"""사용자가 준 제품 링크의 본문 텍스트를 읽는다.

외부 페이지는 신뢰하지 않는 데이터다. 텍스트만 뽑아 출처로 보관하고, 그 안의 문구를 지시로 쓰지 않는다.
서버가 임의 주소를 여는 것이므로 내부망 접근(SSRF)을 막는다.
"""

import ipaddress
import socket
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

import httpx

TIMEOUT_SEC = 8
MAX_BYTES = 1_000_000
MAX_REDIRECTS = 3
TEXT_MAX = 5000
USER_AGENT = "Mozilla/5.0 (compatible; salkkang-malkkang/0.1)"


class LinkError(Exception):
    """사용자에게 그대로 보여줄 한국어 사유를 담는다."""


def is_url(text: str) -> bool:
    return " " not in text and text.lower().startswith(("http://", "https://"))


def check_url(url: str) -> str:
    """검사를 통과한 IP를 돌려준다. 실제 연결은 이 IP로만 해서 DNS rebinding을 막는다."""
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise LinkError("http 또는 https 주소만 읽을 수 있어요.")
    try:
        infos = socket.getaddrinfo(parts.hostname, parts.port or (443 if parts.scheme == "https" else 80))
    except (socket.gaierror, UnicodeError):
        raise LinkError("주소를 찾을 수 없어요. 링크를 확인해 주세요.")
    ips = [ipaddress.ip_address(info[4][0].split("%")[0]) for info in infos]
    if not ips or not all(ip.is_global for ip in ips):
        raise LinkError("내부망이나 로컬 주소는 읽을 수 없어요.")
    return str(ips[0])


def pinned(url: str, ip: str) -> tuple[str, dict, dict]:
    """주소의 호스트를 검사한 IP로 바꾼 요청 주소, Host 헤더, TLS 확인용 이름(SNI)."""
    parts = urlsplit(url)
    host = f"[{ip}]" if ":" in ip else ip
    netloc = host + (f":{parts.port}" if parts.port else "")
    host_header = parts.hostname + (f":{parts.port}" if parts.port else "")
    ext = {"sni_hostname": parts.hostname} if parts.scheme == "https" else {}
    return parts._replace(netloc=netloc).geturl(), {"Host": host_header}, ext


class _TextExtractor(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "template", "iframe"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.og_title = ""
        self.description = ""
        self._in_title = False
        self._skip = 0
        self.chunks: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in self.SKIP:
            self._skip += 1
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = (a.get("property") or a.get("name") or "").lower()
            if key == "og:title" and not self.og_title:
                self.og_title = (a.get("content") or "").strip()
            elif key in ("description", "og:description") and not self.description:
                self.description = (a.get("content") or "").strip()

    def handle_endtag(self, tag):
        if tag in self.SKIP and self._skip:
            self._skip -= 1
        elif tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self._skip and data.strip():
            self.chunks.append(" ".join(data.split()))


def extract(html: str) -> tuple[str, str]:
    """(제품명 후보, 본문 텍스트)."""
    p = _TextExtractor()
    p.feed(html)
    name = (p.og_title or " ".join(p.title.split())).strip()
    body = "\n".join(([p.description] if p.description else []) + p.chunks)
    return name, body[:TEXT_MAX]


def _decode(raw: bytes, charset: str | None) -> str:
    for enc in filter(None, [charset, "utf-8", "cp949"]):
        try:
            return raw.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    return raw.decode("utf-8", errors="replace")


def fetch_html(url: str) -> str:
    with httpx.Client(timeout=TIMEOUT_SEC, follow_redirects=False, headers={"User-Agent": USER_AGENT}) as client:
        for _ in range(MAX_REDIRECTS + 1):
            target, headers, ext = pinned(url, check_url(url))
            try:
                with client.stream("GET", target, headers=headers, extensions=ext) as res:
                    if res.is_redirect:
                        url = urljoin(url, res.headers.get("location", ""))
                        continue
                    if res.status_code >= 400:
                        raise LinkError(f"사이트가 페이지를 열어 주지 않았어요 (상태 {res.status_code}). 자동 접근을 막는 사이트일 수 있어요.")
                    ctype = res.headers.get("content-type", "")
                    if "html" not in ctype and "text/plain" not in ctype:
                        raise LinkError("웹페이지가 아닌 링크예요.")
                    raw = b""
                    for chunk in res.iter_bytes():
                        raw += chunk
                        if len(raw) > MAX_BYTES:
                            raise LinkError("페이지가 너무 커서 읽지 않았어요.")
                    return _decode(raw, res.charset_encoding)
            except httpx.TimeoutException:
                raise LinkError("페이지가 응답하지 않아요. 잠시 후 다시 시도해 주세요.")
            except httpx.HTTPError:
                raise LinkError("페이지에 연결하지 못했어요.")
    raise LinkError("리다이렉트가 너무 많아요.")


def read_link(url: str) -> tuple[str, str]:
    name, text = extract(fetch_html(url))
    if "로그인" in name or "login" in name.lower():
        raise LinkError("로그인이 필요한 페이지로 넘어가서 제품 정보를 읽지 못했어요.")
    if len(text) < 30:
        raise LinkError("페이지에서 읽을 수 있는 내용이 거의 없어요. 화면을 스크립트로 그리는 사이트일 수 있어요.")
    return name, text
