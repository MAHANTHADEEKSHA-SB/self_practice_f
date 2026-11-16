#!/usr/bin/env python3
"""Build the AXI Field Guides from src/ into index.html and guides/*.html.

    python tools/build.py           rebuild every published page
    python tools/build.py --check   exit 1 if a generated page is out of date

Standard library only. Each page is one self-contained HTML file; links
between pages are relative, so the folder works offline from file://.
"""
import html, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")


def read(*parts):
    with open(os.path.join(SRC, *parts), encoding="utf-8") as f:
        return f.read()


CSS = read("template", "base.css.html")
ENGINE = read("template", "engine.js")
SERIES = json.loads(read("series.json"))  # [key, name, output path or null]


def rel(frm, to):
    """Relative link from output file `frm` to output file `to`."""
    if to is None:
        return None
    return os.path.relpath(to, os.path.dirname(frm) or ".").replace(os.sep, "/")


def nav(here, out):
    parts = ['<div class="series" id="series"><span>AXI Field Guides (Issue L):</span>']
    for key, name, path in SERIES:
        label = "<strong>All guides</strong>" if key == "hub" else html.escape(name)
        if key == here:
            parts.append(f'<span class="here">{label}</span>')
        elif path:
            parts.append(f'<a href="{rel(out, path)}">{label}</a>')
        else:
            parts.append(f'<span title="coming soon" style="opacity:.55">{label}</span>')
    parts.append("</div>")
    return "".join(parts)


def render(key, out):
    d = ("guides", key)
    meta = json.loads(read(*d, "meta.json"))
    links = {k: {"name": n, "url": rel(out, p)} for k, n, p in SERIES}
    body = read(*d, "content.html").replace("{{SERIES}}", nav(key, out))
    if key != "hub":
        pub = [(k, n, p) for k, n, p in SERIES if k != "hub" and p]
        i = [k for k, _, _ in pub].index(key)
        pg = '<div class="wrap"><nav class="pager" aria-label="Guides">'
        if i > 0:
            pg += f'<a class="pv" href="{rel(out, pub[i-1][2])}"><small>← Previous guide</small><strong>{html.escape(pub[i-1][1])}</strong></a>'
        if i < len(pub) - 1:
            pg += f'<a class="nx" href="{rel(out, pub[i+1][2])}"><small>Next guide →</small><strong>{html.escape(pub[i+1][1])}</strong></a>'
        pg += f'<a class="all" href="{rel(out, SERIES[0][2])}">All guides and the request map</a></nav></div>'
        assert body.count("</main>") == 1, key
        body = body.replace("</main>", pg + "</main>")
    for k, v in links.items():
        body = body.replace("{{URL:" + k + "}}", v["url"] or "#")
    sj = json.dumps(links)
    body = body.replace("{{SERIES_JSON}}", sj)

    def opt(name):
        p = os.path.join(SRC, *d, name)
        return read(*d, name) if os.path.exists(p) else ""

    data = opt("data.js").replace("{{SERIES_JSON}}", sj)
    extra = opt("extra.js")
    extra_tag = f"<script>{extra}</script>" if extra else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(meta["title"])}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
{CSS}
</head>
<body>
{body}
<script>
{data}
</script>
<script>
{ENGINE}
</script>
{extra_tag}
</body>
</html>
"""


def main():
    check = "--check" in sys.argv[1:]
    stale = []
    for key, _, path in SERIES:
        if not path:
            continue
        page = render(key, path)
        dest = os.path.join(ROOT, path)
        if check:
            old = open(dest, encoding="utf-8").read() if os.path.exists(dest) else None
            if old != page:
                stale.append(path)
        else:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8", newline="\n") as f:
                f.write(page)
            print(f"{path}  {len(page):,} bytes")
    if stale:
        print("Out of date (run python tools/build.py):", ", ".join(stale))
        sys.exit(1)
    if check:
        print("All generated pages match src/.")


if __name__ == "__main__":
    main()
