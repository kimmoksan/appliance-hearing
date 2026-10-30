"""임시 도트 자산 생성기 (표준 라이브러리만 사용).

docs/ASSETS.md 1차 목록(거실 + 로봇청소기)을 코드로 찍어 frontend/public/assets/ 에 PNG로 저장한다.
실제 그림이 오면 같은 파일명으로 덮어쓰면 된다. 이 스크립트를 다시 돌리면 덮어쓴 그림도 지워지니 주의.

실행: python scripts/gen_dot_art.py
"""

import math
import struct
import sys
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "assets"

C = {
    "ink": (20, 18, 36), "wall": (44, 38, 82), "wall2": (52, 45, 94), "glow": (78, 64, 110),
    "trim": (34, 30, 64), "floor": (96, 66, 46), "floor2": (84, 57, 40), "floor3": (108, 76, 52),
    "frame": (30, 28, 58), "glass": (22, 26, 56), "glass2": (30, 36, 72), "city": (64, 60, 104),
    "light": (250, 204, 110), "sofa": (104, 86, 156), "sofa2": (86, 70, 134), "sofa3": (128, 110, 182),
    "cush": (156, 136, 206), "cush2": (120, 160, 110), "wood": (124, 86, 56), "wood2": (98, 66, 42),
    "rug": (146, 104, 120), "rug2": (166, 124, 138), "rug3": (128, 90, 106),
    "pole": (62, 56, 74), "shade": (250, 214, 140), "shade2": (226, 180, 106),
    "pot": (156, 94, 62), "pot2": (126, 74, 48), "leaf": (72, 132, 84), "leaf2": (52, 104, 66),
    "white": (232, 232, 240), "grey": (196, 196, 210), "grey2": (150, 150, 168), "grey3": (96, 96, 116),
    "dark": (56, 56, 72), "black": (28, 28, 34), "green": (110, 231, 183), "red": (226, 92, 92),
    "yellow": (250, 204, 21), "blue": (86, 130, 210), "dust": (120, 108, 96), "page": (236, 228, 208),
    "book": (70, 120, 96),
}


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[(0, 0, 0, 0)] * w for _ in range(h)]

    def dot(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = (*C[c], 255) if isinstance(c, str) else c

    def rect(self, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.dot(i, j, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for j in range(math.floor(cy - ry), math.ceil(cy + ry) + 1):
            for i in range(math.floor(cx - rx), math.ceil(cx + rx) + 1):
                if ((i + 0.5 - cx) / rx) ** 2 + ((j + 0.5 - cy) / ry) ** 2 <= 1:
                    self.dot(i, j, c)

    def line(self, x0, y0, x1, y1, c):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.dot(x0, y0, c)
            if x0 == x1 and y0 == y1:
                return
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def save(self, name):
        raw = b"".join(b"\x00" + bytes(v for p in row for v in p) for row in self.px)
        chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d))
        data = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0))
                + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))
        (OUT / f"{name}.png").write_bytes(data)


def bg_living():
    c = Canvas(320, 180)
    c.rect(0, 0, 320, 112, "wall")
    c.rect(0, 0, 320, 6, "trim")
    # 스탠드 빛 번짐
    for r, col in ((46, "wall2"), (30, "glow")):
        c.ellipse(268, 56, r, r * 0.9, col)
    # 창문 + 밤 도시
    c.rect(150, 18, 92, 70, "frame")
    c.rect(154, 22, 84, 62, "glass")
    for bx, bw, bh in ((156, 12, 30), (170, 9, 44), (182, 14, 26), (198, 10, 38), (210, 16, 30), (228, 9, 48)):
        c.rect(bx, 84 - bh, bw, bh, "city")
        for wy in range(84 - bh + 3, 82, 5):
            for wx in range(bx + 2, bx + bw - 1, 4):
                if (wx * 7 + wy * 3) % 5 < 2:
                    c.dot(wx, wy, "light")
    c.rect(195, 22, 2, 62, "frame")
    c.rect(154, 52, 84, 2, "frame")
    # 바닥 (나무)
    c.rect(0, 112, 320, 68, "floor")
    for y in range(116, 180, 8):
        c.rect(0, y, 320, 1, "floor2")
        off = (y // 8) % 2 * 20
        for x in range(off, 320, 40):
            c.rect(x, y - 7, 1, 7, "floor2")
    c.rect(0, 112, 320, 2, "trim")
    # 러그
    c.ellipse(150, 146, 108, 22, "rug3")
    c.ellipse(150, 145, 104, 20, "rug")
    c.ellipse(150, 145, 90, 14, "rug2")
    c.ellipse(150, 145, 74, 9, "rug")
    # 소파
    c.rect(18, 70, 112, 26, "sofa2")
    c.rect(20, 72, 108, 22, "sofa")
    c.rect(12, 84, 16, 30, "sofa2")
    c.rect(120, 84, 16, 30, "sofa2")
    c.rect(24, 94, 100, 14, "sofa3")
    c.rect(24, 106, 100, 6, "sofa2")
    c.rect(16, 114, 4, 4, "ink")
    c.rect(128, 114, 4, 4, "ink")
    c.rect(32, 78, 18, 14, "cush")
    c.rect(98, 78, 18, 14, "cush2")
    # 낮은 테이블
    c.rect(60, 118, 60, 5, "wood")
    c.rect(60, 123, 60, 2, "wood2")
    c.rect(64, 125, 3, 8, "wood2")
    c.rect(113, 125, 3, 8, "wood2")
    c.rect(72, 114, 6, 4, "white")
    c.rect(96, 115, 10, 3, "book")
    # 스탠드 조명
    c.rect(266, 46, 3, 66, "pole")
    c.rect(258, 110, 19, 3, "pole")
    c.rect(256, 32, 23, 16, "shade2")
    c.rect(258, 32, 19, 14, "shade")
    # 화분
    c.rect(300, 96, 14, 16, "pot2")
    c.rect(301, 96, 12, 14, "pot")
    for dx, dy, h in ((-4, -14, 16), (0, -20, 22), (5, -12, 14), (9, -16, 18)):
        c.line(307, 96, 307 + dx, 96 + dy, "leaf2")
        c.ellipse(307 + dx, 96 + dy, 3, 2, "leaf")
    c.save("bg_living")


def rv_body():
    c = Canvas(28, 12)
    c.ellipse(14, 7, 14, 5, "grey3")
    c.ellipse(14, 6, 13, 4.5, "grey")
    c.ellipse(14, 5.5, 11, 3.5, "white")
    c.ellipse(14, 5, 3, 1.6, "dark")
    c.rect(4, 9, 20, 1, "grey2")
    c.rect(2, 10, 24, 1, "ink")
    c.save("rv_body")


def rv_dock():
    c = Canvas(24, 28)
    c.rect(1, 24, 22, 4, "grey3")
    c.rect(0, 25, 24, 2, "dark")
    c.rect(3, 2, 18, 23, "dark")
    c.rect(4, 3, 16, 21, "grey3")
    c.rect(5, 4, 14, 8, "grey2")
    c.rect(6, 5, 12, 6, "glass2")
    c.rect(11, 15, 2, 1, "green")
    c.rect(7, 19, 10, 3, "black")
    c.save("rv_dock")


def rv_dustbin():
    c = Canvas(12, 10)
    c.rect(0, 1, 12, 9, "grey3")
    c.rect(1, 2, 10, 7, "grey2")
    c.rect(2, 5, 8, 3, "dust")
    c.rect(3, 4, 4, 1, "dust")
    c.rect(4, 0, 4, 2, "dark")
    c.save("rv_dustbin")


def rv_brush():
    c = Canvas(14, 6)
    c.rect(0, 2, 14, 2, "grey3")
    for x in range(1, 13, 2):
        c.dot(x, 1, "yellow")
        c.dot(x + 1, 4, "yellow")
    c.rect(0, 2, 1, 2, "dark")
    c.rect(13, 2, 1, 2, "dark")
    c.save("rv_brush")


def prop_cable():
    c = Canvas(24, 8)
    pts = [(1, 5), (5, 2), (9, 5), (13, 2), (17, 5), (20, 3)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        c.line(x0, y0, x1, y1, "black")
    c.rect(20, 2, 4, 3, "white")
    c.rect(23, 3, 1, 1, "grey3")
    c.save("prop_cable")


def prop_socks():
    c = Canvas(12, 8)
    c.rect(1, 1, 4, 5, "white")
    c.rect(1, 5, 7, 2, "white")
    c.rect(1, 2, 4, 1, "blue")
    c.rect(6, 0, 4, 4, "grey")
    c.rect(6, 3, 6, 2, "grey")
    c.rect(6, 1, 4, 1, "red")
    c.save("prop_socks")


def prop_book():
    c = Canvas(14, 6)
    c.rect(0, 0, 14, 6, "ink")
    c.rect(1, 0, 12, 4, "book")
    c.rect(1, 4, 12, 1, "page")
    c.rect(6, 1, 2, 2, "page")
    c.save("prop_book")


def prop_toy():
    c = Canvas(8, 8)
    c.ellipse(4, 4, 4, 4, "red")
    c.ellipse(4, 4, 4, 1.4, "yellow")
    c.dot(2, 2, "white")
    c.save("prop_toy")


GENERATORS = [bg_living, rv_body, rv_dock, rv_dustbin, rv_brush, prop_cable, prop_socks, prop_book, prop_toy]

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for gen in GENERATORS:
        gen()
        print("wrote", gen.__name__ + ".png")
    sys.exit(0)
