(function () {
  "use strict";
  var P = window.PAGE || {};
  function $(id) { return document.getElementById(id); }

  /* ---------- signal / field table ---------- */
  (function () {
    var chipsEl = $("sigchips"), bodyEl = $("sigbody");
    if (!chipsEl || !bodyEl || !P.sigs) return;
    var dirName = P.dirName || { lp: "Upper", pl: "Lower", both: "both" };
    var dirCls = P.dirCls || {};
    var active = "all";
    function drawTable() {
      var html = "";
      P.sigs.forEach(function (r) {
        if (active !== "all" && r[0] !== active) return;
        var dirTxt = dirName[r[2]] || r[2];
        var cls = dirCls[r[2]] !== undefined ? dirCls[r[2]] : (r[2] === "both" ? "" : r[2]);
        html += "<tr><td class=\"sig " + cls + "\">" + r[1] + "</td><td class=\"dir " + cls + "\">" + dirTxt +
          "</td><td><span class=\"pill\">" + r[3] + "</span></td><td>" + r[4] + "</td><td>" + r[5] + "</td><td class=\"ref\">" + (r[6] || "") + "</td></tr>";
      });
      bodyEl.innerHTML = html;
    }
    P.groups.forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = g[1];
      b.setAttribute("aria-pressed", g[0] === active ? "true" : "false");
      b.addEventListener("click", function () {
        active = g[0];
        Array.prototype.forEach.call(chipsEl.children, function (c) { c.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        drawTable();
      });
      chipsEl.appendChild(b);
    });
    drawTable();
  })();

  /* ---------- rationale filter ---------- */
  (function () {
    var wchips = $("whychips");
    if (!wchips || !P.wgroups) return;
    var wcards = document.querySelectorAll(".wcard");
    var wactive = "all";
    P.wgroups.forEach(function (g) {
      var count = 0;
      Array.prototype.forEach.call(wcards, function (c) { if (g[0] === "all" || c.getAttribute("data-g") === g[0]) count++; });
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = g[1] + " · " + count;
      b.setAttribute("aria-pressed", g[0] === wactive ? "true" : "false");
      b.addEventListener("click", function () {
        wactive = g[0];
        Array.prototype.forEach.call(wchips.children, function (c) { c.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        Array.prototype.forEach.call(wcards, function (c) { c.hidden = !(wactive === "all" || c.getAttribute("data-g") === wactive); });
      });
      wchips.appendChild(b);
    });
  })();

  /* ---------- waveform engine ---------- */
  var CW = P.CW || 34, LW = P.LW || 196, RH = 28, TOP = 20;
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function renderWave(scn, hl, compact, part, plw) {
    var N = scn.n, gaps = scn.gaps || [], rows = scn.sig;
    CW = scn.cw || P.CW || 34;
    var lw = part === "wave" ? 4 : part === "labels" ? plw : (compact ? 150 : LW);
    var W = lw + N * CW + 10, H = TOP + rows.length * RH + 6;
    if (part === "labels") {
      var ls = "<svg viewBox=\"0 0 " + lw + " " + H + "\" width=\"" + lw + "\" height=\"" + H + "\" aria-hidden=\"true\">", mc = Math.floor((lw - 14) / 7.25);
      rows.forEach(function (r, ri) {
        var y0 = TOP + ri * RH, mid = (y0 + 6 + y0 + RH - 7) / 2, nm = r.name;
        if (nm.length > mc) nm = nm.slice(0, mc - 1) + "…";
        ls += "<text class=\"wl " + r.d + "\" x=\"8\" y=\"" + (mid + 4) + "\"><title>" + esc(r.name) + "</title>" + esc(nm) + "</text>";
      });
      return ls + "</svg>";
    }
    function isGap(i) { return gaps.indexOf(i) >= 0; }
    var s = "<svg viewBox=\"0 0 " + W + " " + H + "\" width=\"" + W + "\" height=\"" + H + "\" role=\"img\" aria-label=\"" + esc(scn.aria || scn.title || "waveform") + "\">";
    if (hl) s += "<rect class=\"hlr\" x=\"" + (lw + hl[0] * CW) + "\" y=\"0\" width=\"" + ((hl[1] - hl[0] + 1) * CW) + "\" height=\"" + H + "\"/>";
    for (var i = 0; i <= N; i++) {
      var x = lw + i * CW;
      s += "<line class=\"grid-l\" x1=\"" + x + "\" y1=\"" + (TOP - 4) + "\" x2=\"" + x + "\" y2=\"" + (H - 4) + "\" opacity=\"0.6\"/>";
      if (i < N && !isGap(i)) s += "<text class=\"cyc\" x=\"" + (x + CW / 2) + "\" y=\"12\" text-anchor=\"middle\">" + i + "</text>";
    }
    rows.forEach(function (r, ri) {
      var y0 = TOP + ri * RH, hi = y0 + 6, lo = y0 + RH - 7, mid = (hi + lo) / 2;
      if (part !== "wave") s += "<text class=\"wl " + r.d + "\" x=\"8\" y=\"" + (mid + 4) + "\">" + esc(r.name) + "</text>";
      if (r.t === "bit") {
        var d = "", prev = null;
        for (var k = 0; k < N; k++) {
          if (isGap(k)) { prev = null; continue; }
          var v = r.v.charAt(k), yy = v === "1" ? hi : lo, x0 = lw + k * CW, x1 = x0 + CW;
          if (prev === null) d += "M" + x0 + "," + yy; else if (prev !== yy) d += "L" + x0 + "," + yy;
          d += "L" + x1 + "," + yy; prev = yy;
        }
        s += "<path class=\"wv " + r.d + "\" d=\"" + d + "\"/>";
      } else {
        var vals = r.v, k2 = 0;
        while (k2 < N) {
          if (isGap(k2)) { k2++; continue; }
          var lab = vals[k2], j = k2;
          while (j + 1 < N && !isGap(j + 1) && vals[j + 1] === lab) j++;
          var xa = lw + k2 * CW, xb = lw + (j + 1) * CW, w = xb - xa;
          if (r.t === "bus") {
            if (lab === "") {
              s += "<line class=\"idle\" x1=\"" + xa + "\" y1=\"" + mid + "\" x2=\"" + xb + "\" y2=\"" + mid + "\"/>";
            } else {
              s += "<path class=\"bus " + r.d + "\" d=\"M" + xa + "," + mid + " L" + (xa + 4) + "," + hi + " L" + (xb - 4) + "," + hi + " L" + xb + "," + mid + " L" + (xb - 4) + "," + lo + " L" + (xa + 4) + "," + lo + " Z\"/>";
              var t = lab, maxc = Math.floor((w - 8) / 6.4);
              if (t.length > maxc) t = maxc > 2 ? t.slice(0, maxc - 1) + "…" : "";
              s += "<text class=\"bt\" x=\"" + (xa + w / 2) + "\" y=\"" + (mid + 4) + "\" text-anchor=\"middle\"><title>" + esc(lab) + "</title>" + esc(t) + "</text>";
            }
          } else if (lab !== "") {
            s += "<rect class=\"notebox\" x=\"" + (xa + 2) + "\" y=\"" + (hi - 1) + "\" width=\"" + (w - 4) + "\" height=\"" + (lo - hi + 2) + "\" rx=\"5\"" + (r.d === "sb" ? " style=\"stroke:var(--sb)\"" : "") + "/>";
            var t2 = lab, maxc2 = Math.floor((w - 10) / 5.8);
            if (t2.length > maxc2) t2 = t2.slice(0, Math.max(0, maxc2 - 1)) + "…";
            s += "<text class=\"nt\" x=\"" + (xa + w / 2) + "\" y=\"" + (mid + 4) + "\" text-anchor=\"middle\"" + (r.d === "sb" ? " style=\"fill:var(--sb);font-style:normal;font-family:var(--font-mono);font-size:10.5px\"" : "") + "><title>" + esc(lab) + "</title>" + esc(t2) + "</text>";
          }
          k2 = j + 1;
        }
      }
    });
    gaps.forEach(function (g) {
      var x = lw + g * CW;
      s += "<rect class=\"gapbg\" x=\"" + (x + 1) + "\" y=\"" + (TOP - 4) + "\" width=\"" + (CW - 2) + "\" height=\"" + (H - TOP) + "\"/>";
      var z1 = "", z2 = "";
      for (var yy = TOP - 4, n = 0; yy < H - 4; yy += 6, n++) {
        z1 += (n === 0 ? "M" : "L") + (x + 11 + (n % 2 ? 4 : 0)) + "," + yy;
        z2 += (n === 0 ? "M" : "L") + (x + 19 + (n % 2 ? 4 : 0)) + "," + yy;
      }
      s += "<path class=\"gapz\" d=\"" + z1 + "\"/><path class=\"gapz\" d=\"" + z2 + "\"/>";
      s += "<text class=\"cyc\" x=\"" + (x + CW / 2) + "\" y=\"12\" text-anchor=\"middle\">≈</text>";
    });
    return s + "</svg>";
  }

  /* ---------- mini handshake waves ---------- */
  (function () {
    var minisEl = $("minis");
    if (!minisEl || !P.minis) return;
    P.minis.forEach(function (m) {
      var c = document.createElement("div");
      c.className = "card";
      c.innerHTML = "<div class=\"tagline\">" + esc(m.tag) + "</div><h3>" + esc(m.title) + "</h3><div class=\"scroller\">" +
        renderWave(m.w, null, true) + "</div><p style=\"font-size:15px\">" + esc(m.text) + "</p>" +
        (m.ref ? "<p class=\"src\"><span class=\"sl\">Spec</span>" + esc(m.ref) + "</p>" : "");
      minisEl.appendChild(c);
    });
  })();

  /* ---------- live scenarios ---------- */
  (function () {
    var tabsEl = $("tabs"), waveEl = $("wave"), dotsEl = $("dots");
    if (!tabsEl || !P.scenarios) return;
    var scenarios = P.scenarios, cur = 0, step = 0;
    function pick(i) {
      cur = i; step = 0;
      Array.prototype.forEach.call(tabsEl.children, function (t, k) { t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; });
      var s = scenarios[i];
      $("sc-title").textContent = s.title;
      $("sc-desc").textContent = s.desc;
      $("sc-src").innerHTML = s.ref ? "<span class=\"sl\">Spec</span>" + esc(s.ref) : "";
      dotsEl.innerHTML = "";
      s.steps.forEach(function (st, k) {
        var d = document.createElement("button");
        d.type = "button"; d.className = "dot"; d.textContent = String(k + 1);
        d.setAttribute("aria-label", "Step " + (k + 1) + ": " + st.t);
        d.addEventListener("click", function () { go(k); });
        dotsEl.appendChild(d);
      });
      go(0);
    }
    function go(k) {
      var s = scenarios[cur];
      step = Math.max(0, Math.min(s.steps.length - 1, k));
      var st = s.steps[step];
      var longest = 0; s.sig.forEach(function (r) { longest = Math.max(longest, r.name.length); });
      var narrow = waveEl.clientWidth && waveEl.clientWidth < 560;
      var plw = Math.max(64, Math.min(Math.round(longest * 7.25 + 18), narrow ? Math.round(waveEl.clientWidth * 0.36) : 230));
      waveEl.innerHTML = "<div class=\"wfix\">" + renderWave(s, null, false, "labels", plw) + "</div>" + renderWave(s, st.r, false, "wave");
      var vis = waveEl.clientWidth - plw, a = 4 + st.r[0] * CW, b = 4 + (st.r[1] + 1) * CW;
      if (vis > 0) waveEl.scrollLeft = (b - a >= vis) ? Math.max(0, a - 6) : Math.max(0, Math.min(a - CW * 0.6, (a + b) / 2 - vis / 2 + 0));
      if (vis > 0 && b <= vis - 6) waveEl.scrollLeft = 0;
      $("st-title").textContent = (step + 1) + ". " + st.t;
      $("st-text").textContent = st.x;
      var w = $("st-why");
      w.textContent = st.w || ""; w.style.display = st.w ? "" : "none";
      var se = $("st-src");
      se.innerHTML = st.s ? "<span class=\"sl\">Spec</span>" + esc(st.s) : ""; se.style.display = st.s ? "" : "none";
      $("cyc").textContent = (s.unit || "cycles") + " " + st.r[0] + "–" + st.r[1];
      Array.prototype.forEach.call(dotsEl.children, function (d, j) { if (j === step) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current"); });
      $("prev").disabled = step === 0;
      $("next").disabled = step === s.steps.length - 1;
    }
    scenarios.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "tab"; b.setAttribute("role", "tab"); b.textContent = s.tab;
      b.addEventListener("click", function () { pick(i); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); var n = (i + 1) % scenarios.length; pick(n); tabsEl.children[n].focus(); }
        if (e.key === "ArrowLeft") { e.preventDefault(); var p = (i - 1 + scenarios.length) % scenarios.length; pick(p); tabsEl.children[p].focus(); }
      });
      tabsEl.appendChild(b);
    });
    $("prev").addEventListener("click", function () { go(step - 1); });
    $("next").addEventListener("click", function () { go(step + 1); });
    pick(0);
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { go(step); }, 150); });
    /* sanity: every waveform row must match its scenario length */
    scenarios.concat((P.minis || []).map(function (m) { return m.w; })).forEach(function (s) {
      s.sig.forEach(function (r) { if (r.v.length !== s.n && window.console) console.warn("length mismatch", s.id || s.aria, r.name, r.v.length, s.n); });
    });
  })();

  /* ---------- tables: label cells so they can stack into cards on phones ---------- */
  (function () {
    function label(t) {
      var ths = t.querySelectorAll("thead th"); if (!ths.length) return;
      var heads = Array.prototype.map.call(ths, function (h) { return h.textContent.trim(); });
      Array.prototype.forEach.call(t.querySelectorAll("tbody tr"), function (tr) {
        Array.prototype.forEach.call(tr.children, function (td, i) { if (heads[i] !== undefined) td.setAttribute("data-label", heads[i]); });
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll("table"), function (t) {
      if (!t.tHead || t.querySelector("[rowspan],[colspan]") || t.classList.contains("nostack")) return;
      t.classList.add("stack"); label(t);
      if (window.MutationObserver && t.tBodies[0]) new MutationObserver(function () { label(t); }).observe(t.tBodies[0], { childList: true });
    });
  })();

  /* ---------- section nav: mark the section being read; series nav: show the current guide ---------- */
  (function () {
    var here = document.querySelector(".series .here"), ser = $("series");
    if (here && ser && ser.scrollWidth > ser.clientWidth) ser.scrollLeft = Math.max(0, here.offsetLeft - ser.offsetLeft - 60);
    var bar = document.querySelector("nav.toc .wrap");
    if (!bar || !window.IntersectionObserver) return;
    var links = {}, cur = null;
    Array.prototype.forEach.call(bar.querySelectorAll("a[href^='#']"), function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = links[e.target.id]; if (!a || a === cur) return;
        if (cur) cur.removeAttribute("aria-current");
        cur = a; a.setAttribute("aria-current", "true");
        bar.scrollLeft = Math.max(0, a.offsetLeft - bar.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2);
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  })();

  /* ---------- quiz reveal: open all / close all ---------- */
  (function () {
    var b = $("qa-toggle");
    if (!b) return;
    b.addEventListener("click", function () {
      var ds = document.querySelectorAll("#quiz details"), open = b.getAttribute("aria-pressed") !== "true";
      Array.prototype.forEach.call(ds, function (d) { d.open = open; });
      b.setAttribute("aria-pressed", open ? "true" : "false");
      b.textContent = open ? "Hide all answers" : "Show all answers";
    });
  })();
})();

