import pytest

from app import rate_limit


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    # 테스트끼리 요청 횟수가 섞이지 않게 매번 비운다.
    rate_limit._hits.clear()
