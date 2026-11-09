#!/usr/bin/env python3
"""Build the UCIe 3.0 field guides from ``src/``.

Writes one self-contained HTML file per guide into ``guides/`` and the hub
page to ``index.html``. Only the Python standard library is needed.

Usage (run from anywhere):
    python tools/build.py            # rebuild every page
    python tools/build.py --check    # exit 1 if the committed pages are stale

Source layout:
    src/template/       shared head, CSS and the waveform engine
    src/guides/<slug>/  body*.html (concatenated in name order), data.js,
                        optional style.css; a guide may instead provide a
                        single standalone.html
    src/hub/            body.html and hub.js for index.html

Every guide body contains the marker ``<!-- @nav -->``; the build replaces it
with the series navigation so the link list lives in one place (``GUIDES``).
Only guides whose source folder exists are built and linked, and the "All
guides" link appears once ``src/hub/`` exists, so the site is consistent at
every stage.
"""
from __future__ import annotations

import argparse
import html
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
NAV_MARKER = "<!-- @nav -->"

# Order is the order of the navigation bar: (slug, short label, page title).
GUIDES = [
    ("fdi", "FDI", "UCIe FDI Field Guide"),
    ("rdi", "RDI", "UCIe RDI Field Guide"),
    ("d2d-adapter", "D2D Adapter", "UCIe D2D Adapter Field Guide"),
    ("link-training", "Link Training", "UCIe Link Training (LTSM) Field Guide"),
    ("logical-phy", "Logical PHY", "UCIe Logical PHY Field Guide"),
    ("sideband", "Sideband", "UCIe Sideband Field Guide"),
    ("protocol-mappings", "Protocol Mappings", "UCIe Protocol Mappings Field Guide"),
    ("manageability-uda", "Manageability & UDA", "UCIe Manageability, MTP and UDA Field Guide"),
    ("registers-discovery", "Registers & Discovery", "UCIe Registers and Software Discovery Field Guide"),
    ("retimers-compliance", "Retimers & Compliance", "UCIe Retimers and Compliance Field Guide"),
    ("electrical-ucie-3d", "Electrical & UCIe-3D", "UCIe Electrical Layer and UCIe-3D Field Guide"),
]
HUB_TITLE = "UCIe 3.0 Field Guides"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def present() -> list[tuple[str, str, str]]:
    """Guides that have sources, in navigation order."""
    return [g for g in GUIDES if (SRC / "guides" / g[0]).is_dir()]


def has_hub() -> bool:
    return (SRC / "hub" / "body.html").exists()


def nav(current: str) -> str:
    """Series navigation for a page in guides/ (links are relative)."""
    parts = ['<span>UCIe 3.0 Field Guides:</span>']
    if has_hub():
        parts.append('<a href="../index.html"><strong>All guides</strong></a>')
    for slug, label, _ in present():
        text = html.escape(label)
        if slug == current:
            parts.append(f'<span class="here">{text}</span>')
        else:
            parts.append(f'<a href="{slug}.html">{text}</a>')
    return '<div class="series" id="series">' + "".join(parts) + "</div>"


def head(title: str) -> str:
    return read(SRC / "template/head.html").replace("{{title}}", html.escape(title))


def base_css() -> str:
    return read(SRC / "template/style.css") + read(SRC / "template/extra.css")


def build_guide(slug: str, title: str) -> str:
    folder = SRC / "guides" / slug
    standalone = folder / "standalone.html"
    if standalone.exists():
        page = read(standalone)
    else:
        bodies = sorted(folder.glob("body*.html"))
        if not bodies:
            raise SystemExit(f"error: no body*.html or standalone.html in {folder}")
        css = base_css()
        extra = folder / "style.css"
        if extra.exists():
            css += read(extra)
        engine = "".join(read(SRC / "template" / name)
                         for name in ("engine_pre.js", "wave_engine.js", "engine_post.js"))
        page = (head(title) + "\n<style>\n" + css + "\n</style>\n</head>\n<body>\n"
                + "".join(read(b) for b in bodies)
                + "\n<script>\n" + read(folder / "data.js") + "\n</script>\n"
                + "<script>\n" + engine + "\n</script>\n</body>\n</html>\n")
    if page.count(NAV_MARKER) != 1:
        raise SystemExit(f"error: {slug} must contain exactly one {NAV_MARKER}")
    return page.replace(NAV_MARKER, nav(slug))


def build_hub() -> str:
    return (head(HUB_TITLE) + "\n<style>\n" + base_css() + "\n</style>\n</head>\n<body>\n"
            + read(SRC / "hub/body.html")
            + "\n<script>\n" + read(SRC / "hub/hub.js") + "\n</script>\n</body>\n</html>\n")


def outputs() -> dict[Path, str]:
    pages = {ROOT / "guides" / f"{slug}.html": build_guide(slug, title)
             for slug, _, title in present()}
    if has_hub():
        pages[ROOT / "index.html"] = build_hub()
    return pages


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true",
                        help="do not write; fail if any built page differs from src/")
    args = parser.parse_args()

    stale = []
    for path, text in outputs().items():
        rel = path.relative_to(ROOT)
        if args.check:
            if not path.exists() or read(path) != text:
                stale.append(str(rel))
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8", newline="\n")
        print(f"wrote {rel} ({len(text.encode('utf-8')):,} bytes)")

    if args.check:
        if stale:
            print("out of date (run python tools/build.py):", *stale, sep="\n  ")
            return 1
        print(f"all {len(present()) + has_hub()} pages are up to date")
    return 0


if __name__ == "__main__":
    sys.exit(main())
