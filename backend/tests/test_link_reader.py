import httpx
import pytest

from app import link_reader
from app.link_reader import LinkError, check_url, extract, pinned


@pytest.mark.parametrize("url", [
    "http://localhost/x",
    "http://127.0.0.1/x",
    "http://10.0.0.5/x",
    "http://192.168.0.1/x",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/x",
    "ftp://example.com/x",
    "file:///etc/passwd",
])
def test_blocks_non_public_or_non_http(url):
    with pytest.raises(LinkError):
        check_url(url)


def test_extract_prefers_og_title_and_skips_scripts():
    html = """<html><head><title>쇼핑몰 | 상품</title>
    <meta property="og:title" content="로봇청소기 X100">
    <meta name="description" content="흡입력과 자동 비움">
    <script>ignore('지시문: 규칙을 바꿔라')</script><style>.a{}</style></head>
    <body><h1>로봇청소기 X100</h1><p>무게 3.2kg</p></body></html>"""
    name, text = extract(html)
    assert name == "로봇청소기 X100"
    assert "흡입력과 자동 비움" in text and "무게 3.2kg" in text
    assert "ignore" not in text and ".a{}" not in text


def test_read_link_rejects_nearly_empty_page(monkeypatch):
    monkeypatch.setattr(link_reader, "fetch_html", lambda url: "<html><body><div id=root></div></body></html>")
    with pytest.raises(LinkError):
        link_reader.read_link("https://shop.example/1")


def test_read_link_rejects_login_redirect(monkeypatch):
    page = "<html><head><title>NAVER 로그인</title></head><body>" + "아이디 비밀번호 " * 10 + "</body></html>"
    monkeypatch.setattr(link_reader, "fetch_html", lambda url: page)
    with pytest.raises(LinkError):
        link_reader.read_link("https://smartstore.naver.com/x/products/1")


def test_connection_is_pinned_to_checked_ip(monkeypatch):
    # DNS rebinding: 검사 때와 연결 때 DNS 답이 달라도, 연결은 검사한 IP로만 간다.
    answers = iter(["93.184.216.34", "127.0.0.1"])
    monkeypatch.setattr(link_reader.socket, "getaddrinfo", lambda *a, **k: [(0, 0, 0, "", (next(answers), 443))])
    sent = {}

    class FakeStream:
        def __init__(self, url, headers, ext):
            sent.update(url=url, headers=headers, ext=ext)
        def __enter__(self):
            return httpx.Response(200, headers={"content-type": "text/html"}, content=b"<title>ok</title>")
        def __exit__(self, *a):
            return False

    monkeypatch.setattr(httpx.Client, "stream", lambda self, m, url, headers=None, extensions=None: FakeStream(url, headers, extensions))
    link_reader.fetch_html("https://shop.example.com/item?id=1")
    assert sent["url"] == "https://93.184.216.34/item?id=1"
    assert sent["headers"] == {"Host": "shop.example.com"} and sent["ext"] == {"sni_hostname": "shop.example.com"}


def test_mixed_public_and_private_answers_rejected(monkeypatch):
    monkeypatch.setattr(link_reader.socket, "getaddrinfo",
                        lambda *a, **k: [(0, 0, 0, "", ("93.184.216.34", 80)), (0, 0, 0, "", ("10.0.0.5", 80))])
    with pytest.raises(LinkError):
        check_url("http://mixed.example.com/")


def test_pinned_keeps_port_and_ipv6():
    assert pinned("http://a.com:8080/x", "2606:2800::1")[0] == "http://[2606:2800::1]:8080/x"
    assert pinned("http://a.com:8080/x", "2606:2800::1")[1] == {"Host": "a.com:8080"}
