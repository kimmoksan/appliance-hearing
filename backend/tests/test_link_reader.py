import pytest

from app import link_reader
from app.link_reader import LinkError, check_url, extract


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
