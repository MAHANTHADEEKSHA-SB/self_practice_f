# Architecture: how a guide page is built

Technical reference for editing or adding guides. For the rules and commands see [AGENTS.md](../AGENTS.md); for history, status and validation see [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md).

## 1. Build pipeline

`tools/build.py` turns sources into self-contained pages. Each output file contains all of its CSS and JavaScript; nothing is loaded at runtime except the optional Google Fonts stylesheet.

```text
src/template/head.html   ({{title}} replaced)
+ <style> style.css + extra.css + src/guides/<slug>/style.css (optional) </style>
+ src/guides/<slug>/body1.html, body2.html, ... (joined in file-name order)
+ <script> src/guides/<slug>/data.js </script>          sets window.PAGE, may define widgets
+ <script> engine_pre.js + wave_engine.js + engine_post.js </script>
= guides/<slug>.html   (the <!-- @nav --> marker replaced by the navigation bar)
```

- **Guide list:** the `GUIDES` list in `build.py` (slug, nav label, page title) sets the navigation order and titles. A guide is built only if `src/guides/<slug>/` exists; the "All guides" link appears only if `src/hub/body.html` exists.
- **Standalone pages:** a guide folder may hold `standalone.html` (a complete document) instead of `body*.html` + `data.js`. FDI works this way. It must still contain one `<!-- @nav -->` marker and define the `.series` styles itself.
- **Hub:** `index.html` = head + base CSS + `src/hub/body.html` + `src/hub/hub.js`. There is no waveform engine on the hub. `hub.js` renders the guide cards (`#glist`) and the topic finder (`#tbody-topics`) from two arrays at the top of the file.
- **`--check`:** builds in memory and compares with the files on disk, ignoring line-ending differences. **`tools/check_site.py`:** parses every page with `html.parser` and reports broken relative links, missing `#anchors`, duplicate ids, external hosts other than Google Fonts, navigation bars missing a guide, and hub links missing a guide.

## 2. Page skeleton

A guide body is a sequence of sections. Section ids double as anchors for the table of contents.

```html
<header class="top"><div class="wrap hero">
  <!-- @nav -->
  <div class="eyebrow">UCIe 3.0 · Chapter N · Topic</div>
  <h1>UCIe … Field Guide</h1>
  <p class="lede">What this guide covers and why.</p>
  <div class="legend" aria-label="Color legend"><span><i class="sw" style="background:var(--lp)"></i>…</span>…</div>
  <p class="src" style="max-width:76ch"><span class="sl">References</span>… tag key …</p>
</div></header>
<nav class="toc" aria-label="Sections"><div class="wrap"><a href="#why">1 · Why</a> …</div></nav>
<main>
  <section id="why"><div class="wrap"><h2>1 · …</h2> … </div></section>
  …
</main>
<footer><div class="wrap">Built from the UCIe Specification Revision 3.0, Version 1.0 (August 5, 2025), Chapter …</div></footer>
```

Building blocks (all defined in `src/template/style.css` and `extra.css`):

| Class | Use |
| --- | --- |
| `.grid.g2` / `.grid.g3` | Responsive card grids (300 px / 250 px minimum columns) |
| `.twocol` | Two responsive columns (320 px minimum) |
| `.card` with `.tagline`, `h3`, `p` | Content card |
| `.tbl-wrap > table` | Scrollable table; add `.diff` for side-by-side comparisons, `.refidx` for the spec index |
| `.flow > div > .n + p` | Numbered step list |
| `.stage > div > b` | Small labelled boxes (layouts, states); `.on` highlights one |
| `.bitfield` | Bit or byte field diagram |
| `.callout` | Highlighted note |
| `.chips > button.chip[aria-pressed]` | Filter chips |
| `p.src > span.sl` | Citation line ("Spec", "References") |
| `span.kind.spec`, `.derived`, `.illus`, `.bg` | Tags |
| `span.ref` | Inline monospace spec reference |
| `figure > svg` | Inline SVG diagram; give it `role="img"` and a descriptive `aria-label`; colors via CSS variables |

Colors are CSS variables: `--lp` amber (upper layer, requester, transmitter or software), `--pl` teal (lower layer, responder, hardware or clock), `--sb` violet (sideband), `--bad` red (errors and warnings), `--hl` highlight, plus `--bg`, `--surface`, `--ink`, `--muted`, `--line`. A `prefers-color-scheme: dark` block redefines them, so always use the variables and never hard-coded colors.

## 3. Snippets

### Rule card (`#rationale`)

```html
<section id="rationale"><div class="wrap">
  <h2>N · Why each rule exists</h2>
  <div class="chips" role="group" aria-label="Filter rules by area" id="whychips"></div>
  <div class="whys">
    <article class="wcard" data-g="GROUPKEY">
      <div class="meta"><span>Area</span><span>§x.y p.N</span></div>
      <h3>Short rule name</h3>
      <p class="rule">The rule in one or two sentences.</p>
      <div class="part"><span class="l l-why">Why</span><p>The reason.</p></div>
      <div class="part ex"><span class="l l-ex">Real-time example</span><p>A concrete case.</p></div>
      <div class="part brk"><span class="l l-brk">If you break it</span><p>What goes wrong.</p></div>
      <div class="part checks"><span class="l l-src">Check it in the spec</span><ul>
        <li><span class="kind spec">Spec</span>What <span class="ref">§x.y, p.N</span></li>
        <li><span class="kind derived">Derived</span>what was worked out</li>
      </ul></div>
    </article>
  </div>
</div></section>
```

`data-g` must match a key in `PAGE.wgroups`. The chips are generated with counts.

### Live scenario viewer (`#live`): copy as is

```html
<section id="live"><div class="wrap">
  <h2>N · Live scenarios</h2>
  <div class="viewer">
    <div class="tabs" role="tablist" id="tabs" aria-label="Scenarios"></div>
    <div class="vhead"><h3 id="sc-title"></h3><p id="sc-desc"></p><p class="src" id="sc-src"></p></div>
    <div class="scroller" id="wave"></div>
    <div class="steps"><div class="stepbar"><button class="btn" id="prev" type="button">← Previous</button><button class="btn primary" id="next" type="button">Next →</button><div class="dots" id="dots" aria-label="Steps"></div><span class="cycles" id="cyc"></span></div>
    <div class="stepbody"><h3 id="st-title"></h3><p id="st-text"></p><p class="why" id="st-why"></p><p class="src" id="st-src"></p></div></div>
  </div>
</div></section>
```

### Quiz (`#quiz`)

```html
<section id="quiz"><div class="wrap">
  <h2>N · Test yourself</h2>
  <p class="sub">Interview-style questions. <button class="btn" id="qa-toggle" type="button" aria-pressed="false" style="margin-left:8px">Show all answers</button></p>
  <details><summary>Question? <span class="lvl">Basic</span></summary><div><p>Answer.</p><p class="src"><span class="sl">Spec</span>§x.y, p.N</p></div></details>
</div></section>
```

Levels used: Basic, Intermediate, Advanced.

### Optional signal table

```html
<div class="chips" role="group" aria-label="Filter signals by group" id="sigchips"></div>
<div class="tbl-wrap"><table>
  <thead><tr><th>Signal</th><th>Driver</th><th>Kind</th><th>Meaning</th><th>Live behavior</th><th>Spec</th></tr></thead>
  <tbody id="sigbody"></tbody>
</table></div>
```

### Optional mini handshakes

`<div class="mini" id="minis"></div>`, filled from `PAGE.minis`.

## 4. The `window.PAGE` data contract (`data.js`)

`data.js` runs before the engine. Wrap it in an IIFE, define any page-specific widgets first (they run at load and look up their own element ids), then set `window.PAGE`.

```js
(function () {
  function bits(n, ranges) {           // helper: "0" x n with 1s over [from, to] ranges
    var a = []; for (var i = 0; i < n; i++) a.push("0");
    (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; });
    return a.join("");
  }
  window.PAGE = {
    CW: 34,                  // default waveform column width in px (default 34)
    LW: 196,                 // label column width in px (default 196)
    wgroups: [["all", "All"], ["key", "Label"]],          // rule-card filter chips
    groups:  [["all", "All"], ["key", "Label"]],          // signal-table chips (optional)
    sigs: [[group, name, dirKey, kind, meaning, behavior, ref]],  // signal rows (optional)
    dirName: { lp: "Adapter", pl: "PHY" },                // dirKey -> text
    dirCls:  { lp: "lp", pl: "pl" },                      // dirKey -> color class
    minis: [{ title, tag, text, ref, w: SCENARIO }],      // optional small waveforms
    scenarios: [SCENARIO]                                  // the live viewer
  };
})();
```

A **scenario**:

| Field | Meaning |
| --- | --- |
| `id`, `tab`, `title`, `desc`, `ref` | Identity, tab label, heading, one-line setup, spec reference |
| `unit` | Column unit shown in the step bar: `"cycles"`, `"UI"`, `"steps"`, `"ms"` and so on |
| `n` | Number of columns |
| `cw` | Optional column width for this scenario (overrides `PAGE.CW`) |
| `gaps` | Optional column indexes drawn as compressed time (zig-zag, contents hidden) |
| `aria` | Optional accessible name for the SVG |
| `sig` | Rows (below) |
| `steps` | `[{ r: [first, last], t: title, x: text, w: optional "why" note, s: spec ref }]`; `r` highlights those columns |

A **row**: `{ name, d, t, v }`

- `d` sets the color: `"lp"`, `"pl"`, `"sb"` or `"note"`.
- `t: "bit"`: `v` is a string of `0` and `1`, one character per column.
- `t: "bus"`: `v` is an array of labels. Consecutive equal labels merge into one hexagon. `""` draws an idle line.
- `t: "note"`: `v` is an array of labels drawn as rounded boxes. `""` draws nothing. Consecutive equal labels merge.

Every row must have exactly `n` entries (the engine warns in the console otherwise). Labels wider than their bar are cut with an ellipsis (the full text stays in a tooltip), so increase `cw` or shorten labels.

## 5. Adding a new guide

1. Pick a kebab-case slug, for example `streaming-protocol`.
2. Create `src/guides/streaming-protocol/` with `body1.html` (header with `<!-- @nav -->`, toc, first sections), more `bodyN.html` as needed (the last one closes `</main>` and holds the `<footer>`), and `data.js`.
3. Add `("streaming-protocol", "Streaming", "UCIe Streaming Protocol Field Guide")` to `GUIDES` in `tools/build.py`, in reading order.
4. Add the guide to the hub: a card in the `G` array and topics in the `T` array of `src/hub/hub.js`, and optionally a box in the layer-map SVG in `src/hub/body.html`.
5. Add a row to the guide table in `README.md`, the coverage table in `PROJECT_CONTEXT.md`, and an entry in `CHANGELOG.md`.
6. Run `python tools/build.py`, `python tools/build.py --check` and `python tools/check_site.py`, then open the page and check it at desktop width and at 390 px.
7. Rebase on the latest `main`, commit as `feat(ucie-field-guides): add Streaming protocol guide` on a `feat/…` branch, update `PROJECT_CONTEXT.md`, and open a pull request.

## 6. Editing an existing guide

- Text, cards, tables and SVGs: `src/guides/<slug>/body*.html`.
- Waveforms and widgets: `src/guides/<slug>/data.js`.
- Shared look or engine behavior: `src/template/`. A change here affects every templated guide, so rebuild everything and spot-check several pages, including one with a signal table and minis (RDI) and one with `cw` overrides (Electrical & UCIe-3D).
- FDI: `src/guides/fdi/standalone.html` (its own CSS and engine copy; the template was extracted from it, so fixes may need applying in both places).
