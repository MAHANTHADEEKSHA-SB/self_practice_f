
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
      waveEl.innerHTML = renderWave(s, st.r, false);
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
    /* sanity: every waveform row must match its scenario length */
    scenarios.concat((P.minis || []).map(function (m) { return m.w; })).forEach(function (s) {
      s.sig.forEach(function (r) { if (r.v.length !== s.n && window.console) console.warn("length mismatch", s.id || s.aria, r.name, r.v.length, s.n); });
    });
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
