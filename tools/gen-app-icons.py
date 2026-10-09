#!/usr/bin/env python3
"""
Build UniWork Office app icons from the brand lockup: only the stylized W mark
(no "uni" / "ork" wordmark), for Dock / taskbar / installer / Linux hicolor.

Source: apps/shell/build/brand/uniwork-lockup-source.jpg
Outputs: apps/shell/build/icon.png, icon-mac.png, icon.icns, icon.ico, icons/*,
         apps/shell/src/renderer/src/assets/app-icon.png

  python3 tools/gen-app-icons.py
"""

from __future__ import annotations

import struct
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "apps/shell/build/brand/uniwork-lockup-source.jpg"
BUILD = ROOT / "apps/shell/build"
RENDERER_ICON = ROOT / "apps/shell/src/renderer/src/assets/app-icon.png"

# macOS app-icon content grid (same ratio as file-association icons)
MAC_CONTENT_RATIO = 824 / 1024
LINUX_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024]
WIN_SIZES = [16, 24, 32, 48, 64, 128, 256]
ICONSET_ENTRIES = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024),
]

BG = (0, 0, 0, 255)


def extract_w_mark(lockup: Image.Image) -> Image.Image:
    """Crop the vivid purple→cyan W (drop dark navy wordmark)."""
    rgba = lockup.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            mx = max(r, g, b)
            mn = min(r, g, b)
            # Background + wordmark are near-black / dark navy; W is vivid.
            if mx > 90 and (mx - mn > 25 or mx > 140):
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit("could not locate W mark in lockup")
    pad = 6
    box = (
        max(0, min(xs) - pad),
        max(0, min(ys) - pad),
        min(w, max(xs) + pad + 1),
        min(h, max(ys) + pad + 1),
    )
    return rgba.crop(box)


def make_square(mark: Image.Image, canvas: int, content_ratio: float) -> Image.Image:
    out = Image.new("RGBA", (canvas, canvas), BG)
    target = max(1, int(round(canvas * content_ratio)))
    # Fit mark inside target box, keep aspect
    mw, mh = mark.size
    scale = min(target / mw, target / mh)
    nw, nh = max(1, int(round(mw * scale))), max(1, int(round(mh * scale)))
    resized = mark.resize((nw, nh), Image.Resampling.LANCZOS)
    # Make near-black lockup backdrop transparent so only the W shows on our BG
    cleaned = Image.new("RGBA", resized.size, (0, 0, 0, 0))
    sp = resized.load()
    dp = cleaned.load()
    for y in range(nh):
        for x in range(nw):
            r, g, b, a = sp[x, y]
            if max(r, g, b) <= 28:
                dp[x, y] = (0, 0, 0, 0)
            else:
                dp[x, y] = (r, g, b, a)
    x0 = (canvas - nw) // 2
    y0 = (canvas - nh) // 2
    out.alpha_composite(cleaned, (x0, y0))
    return out


def write_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG")


def build_ico(entries: list[tuple[int, bytes]]) -> bytes:
    header = struct.pack("<HHH", 0, 1, len(entries))
    dir_bytes = bytearray()
    blobs: list[bytes] = []
    offset = 6 + 16 * len(entries)
    for size, png in entries:
        dir_bytes += struct.pack(
            "<BBBBHHII",
            0 if size >= 256 else size,
            0 if size >= 256 else size,
            0,
            0,
            1,
            32,
            len(png),
            offset,
        )
        blobs.append(png)
        offset += len(png)
    return header + bytes(dir_bytes) + b"".join(blobs)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing source lockup: {SRC}")

    lockup = Image.open(SRC)
    mark = extract_w_mark(lockup)
    mark_path = BUILD / "brand" / "uniwork-w-mark.png"
    write_png(mark, mark_path)
    print(f"W mark {mark.size} → {mark_path.relative_to(ROOT)}")

    # Full-bleed master (Windows / Linux / generic)
    master = make_square(mark, 1024, 0.88)
    write_png(master, BUILD / "icon.png")
    # macOS optical margin
    mac = make_square(mark, 1024, MAC_CONTENT_RATIO)
    write_png(mac, BUILD / "icon-mac.png")
    write_png(master, RENDERER_ICON)
    print("wrote icon.png, icon-mac.png, app-icon.png")

    # Linux hicolor + flat sizes electron-builder expects
    for size in LINUX_SIZES:
        tile = master.resize((size, size), Image.Resampling.LANCZOS)
        write_png(tile, BUILD / "icons" / f"{size}x{size}.png")
        write_png(tile, BUILD / "icons" / f"{size}x{size}" / "apps" / "uniwork-office.png")
    print("wrote build/icons/*")

    # .icns via iconutil
    with tempfile.TemporaryDirectory(prefix="uniwork-iconset-") as tmp:
        iconset = Path(tmp) / "icon.iconset"
        iconset.mkdir()
        for name, size in ICONSET_ENTRIES:
            tile = mac.resize((size, size), Image.Resampling.LANCZOS)
            write_png(tile, iconset / name)
        icns = BUILD / "icon.icns"
        subprocess.run(["iconutil", "-c", "icns", str(iconset), "-o", str(icns)], check=True)
        print(f"wrote {icns.relative_to(ROOT)}")

    # .ico
    ico_entries: list[tuple[int, bytes]] = []
    for size in WIN_SIZES:
        tile = master.resize((size, size), Image.Resampling.LANCZOS)
        from io import BytesIO

        buf = BytesIO()
        tile.save(buf, format="PNG")
        ico_entries.append((size, buf.getvalue()))
    ico_path = BUILD / "icon.ico"
    ico_path.write_bytes(build_ico(ico_entries))
    print(f"wrote {ico_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
