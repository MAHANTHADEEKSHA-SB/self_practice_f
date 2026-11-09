#!/usr/bin/env python3
"""Offline sanity checks for the built pages (standard library only).

Checks index.html and guides/*.html for:
  * relative links whose file or #fragment does not exist
  * external URLs other than the optional Google Fonts stylesheet
  * duplicate element ids
  * a series navigation bar that links back to the hub and to every guide
  * the hub linking to every guide

Usage:
    python tools/check_site.py
Exit status is 0 when every check passes, 1 otherwise.
"""
from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
ALLOWED_HOSTS = {"fonts.googleapis.com", "fonts.gstatic.com"}


class PageScan(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.links: list[str] = []
        self.in_series = 0
        self.series_links: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        if tag == "div" and a.get("id") == "series":
            self.in_series = 1
        elif tag == "div" and self.in_series:
            self.in_series += 1
        for key in ("href", "src"):
            if a.get(key):
                self.links.append(a[key])
                if self.in_series and key == "href":
                    self.series_links.append(a[key])

    def handle_endtag(self, tag):
        if tag == "div" and self.in_series:
            self.in_series -= 1


def scan(path: Path) -> PageScan:
    parser = PageScan()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def main() -> int:
    guides = sorted((ROOT / "guides").glob("*.html"))
    hub = ROOT / "index.html"
    pages = ([hub] if hub.exists() else []) + guides
    if not pages:
        print("no built pages yet; nothing to check")
        return 0

    scans = {p.resolve(): scan(p) for p in pages}
    problems: list[str] = []

    for page, result in scans.items():
        rel = page.relative_to(ROOT)
        if "claude.ai" in page.read_text(encoding="utf-8"):
            problems.append(f"{rel}: contains a claude.ai link")
        dupes = {i for i in result.ids if result.ids.count(i) > 1}
        if dupes:
            problems.append(f"{rel}: duplicate ids {sorted(dupes)}")
        for link in result.links:
            parts = urlsplit(link)
            if parts.scheme in ("http", "https"):
                if parts.hostname not in ALLOWED_HOSTS:
                    problems.append(f"{rel}: external link {link}")
                continue
            if parts.scheme or link.startswith("data:"):
                continue
            target = (page.parent / parts.path).resolve() if parts.path else page
            if not target.exists():
                problems.append(f"{rel}: broken link {link}")
                continue
            if parts.fragment:
                ids = scans[target].ids if target in scans else scan(target).ids
                if parts.fragment not in ids:
                    problems.append(f"{rel}: missing anchor {link}")

    expected = {g.name for g in guides}
    for g in guides:
        got = {Path(urlsplit(h).path).name for h in scans[g.resolve()].series_links}
        if hub.exists() and "index.html" not in got:
            problems.append(f"guides/{g.name}: navigation has no link to ../index.html")
        lacking = expected - got - {g.name}
        if lacking:
            problems.append(f"guides/{g.name}: navigation lacks {sorted(lacking)}")
    if hub.exists():
        hub_links = {Path(urlsplit(h).path).name for h in scans[hub.resolve()].links}
        for name in sorted(expected - hub_links):
            problems.append(f"index.html: no link to guides/{name}")

    if problems:
        print(f"{len(problems)} problem(s):", *problems, sep="\n  ")
        return 1
    print(f"OK: {len(pages)} pages, {sum(len(s.links) for s in scans.values())} links checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
