(function () {
  function e(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString(); }

  /* ---- rate lookup ---- */
  (function () {
    var pkg = document.getElementById("lkpkg"), rate = document.getElementById("lkrate"), len = document.getElementById("lklen"), sw = document.getElementById("lksw"), out = document.getElementById("lkout");
    if (!pkg) return;
    var R = [4, 8, 12, 16, 24, 32, 48, 64];
    R.forEach(function (r) { var o = document.createElement("option"); o.value = r; o.textContent = r + " GT/s"; rate.appendChild(o); });
    rate.value = "32";
    var CLK = { 4: "2 GHz half-rate, differential", 8: "4 GHz half-rate, differential", 12: "6 GHz half-rate, differential", 16: "8 GHz half-rate, differential", 24: "12 GHz half-rate differential, or 6 GHz quarter-rate quadrature (Rx choice)", 32: "16 GHz half-rate differential, or 8 GHz quarter-rate quadrature (Rx choice)", 48: "12 GHz quarter-rate, quadrature, continuous", 64: "16 GHz quarter-rate, quadrature, continuous" };
    var BER = { A: { 4: "1E-27", 8: "1E-27", 12: "1E-27", 16: "1E-15", 24: "1E-15", 32: "1E-15", 48: "1E-15", 64: "1E-12" }, S: { 4: "1E-27", 8: "1E-27", 12: "1E-15", 16: "1E-15", 24: "1E-15", 32: "1E-15", 48: "1E-15", 64: "1E-12" } };
    var LAT = { 4: 12, 8: 12, 12: 12, 16: 12, 24: 16, 32: 16, 48: 24, 64: 32 };
    var NOISE = { 4: 80, 8: 80, 12: 50, 16: 40, 24: 30, 32: 30, 48: 30, 64: 30 };
    function band(r, a, b, c) { return r <= 16 ? a : r <= 32 ? b : c; }
    function term(p, r, l, s) {
      if (p === "A") return r <= 32 ? ["Unterminated", "§5.4.3, p.197"] : ["Terminated to ground (Rx 50 Ω ± 5)", "§5.4.3, p.197 · Table 5-9"];
      if (r >= 24) return ["Terminated to ground" + (r >= 48 ? " (Rx 50 Ω ± 5)" : ""), "§5.4.3, Tables 5-10, 5-11, p.197–199"];
      var T = s === "0.85" ? [[16, 5], [12, 10], [8, Infinity]] : [[12, 3], [8, 5], [4, 10]];
      var ok = T.some(function (t) { return r <= t[0] && l <= t[1]; });
      return [ok ? "Unterminated (recommended for this rate, length and swing)" : "Terminated to ground", "Table 5-" + (s === "0.85" ? "11, p.199" : "10, p.197")];
    }
    function run() {
      var p = pkg.value, r = +rate.value, l = Math.max(0, +len.value || 0), s = sw.value, ui = 1000 / r;
      var notes = [];
      if (p === "S" && l > 25) notes.push("Standard Package mainband reach is up to 25 mm (100 mm applies only to extended-reach sideband).");
      len.disabled = p === "A"; sw.disabled = p === "A";
      var berv = BER[p][r], t = term(p, r, l, s);
      var rows = [
        ["Unit interval", fmt(ui, 2) + " ps", "1 / data rate"],
        ["Forwarded clock", CLK[r], "Table 5-12, p.203"],
        ["Tx per-lane deskew", r <= 8 ? "optional" : "required", "Table 5-12, p.203"],
        ["Raw BER requirement", berv + (berv === "1E-27" ? " (parity or CRC with reporting suffices)" : " (CRC and retry required)"), "Table 5-32, §5.10, p.251"],
        ["Eye mask (channel sim)", r <= 16 ? "rectangular, 40 mV × 0.75 UI" : r <= 32 ? "rectangular, 40 mV × 0.65 UI (EQ on)" : "diamond, 65 mV × 0.65 UI", "Table 5-15, §5.7, p.206"],
        ["Tx equalization", r <= 12 ? "not required" : r === 16 ? "recommended (de-emphasis)" : r <= 32 ? "must support: de-emphasis 0 dB / −2.2 dB" : "required: 3-tap presets P0–P5", "§5.3.3–5.3.4, p.193–194"],
        ["Rx equalization", r <= 16 ? "not specified" : r <= 32 ? "optional (≈ 1st-order CTLE)" : "required with Tx EQ: CTLE −6…0 dB, optional 1-tap DFE", "§5.4.4, p.200–201"],
        ["Rx termination", t[0], t[1]],
        ["Clock gating", r <= 32 ? "allowed; postamble 8 cycles (16 UI half-rate, 32 UI quarter-rate)" : "not allowed: continuous clock only", "§4.1.3 · §5.11, p.251–253"],
        ["Valid framing", r >= 48 ? "single-error correct, double-error detect required" : "standard 8-UI framing", "§5.11, p.253"],
        ["I/O VCC noise budget", NOISE[r] + " mVpp max", "Table 5-14, p.205"],
        ["Channel matching tolerance", "±" + (p === "A" ? (r <= 32 ? "0.03" : "0.06") : band(r, "0.07", "0.10", "0.20")) + " UI", "Table 5-16, p.208"],
        ["Tx lane-to-lane skew correction", "±" + (p === "A" ? band(r, "0.10", "0.15", "0.18") : band(r, "0.14", "0.22", "0.50")) + " UI", "Table 5-5, p.192"],
        ["PHY latency target (Tx+Rx)", LAT[r] + " UI ≈ " + fmt(LAT[r] * ui / 1000, 2) + " ns", "Tables 5-2, 5-3, p.188–189"],
        ["Idle power target", (r <= 32 ? "15" : (p === "A" ? "20" : "25")) + "% of peak", "Tables 5-2, 5-3"],
        ["Channel reach", p === "A" ? "2 mm" : "up to 25 mm (10 mm short-reach class)", "Tables 1-1, 1-2, p.40"]
      ];
      out.innerHTML = "<table>" + rows.map(function (x) { return "<tr><td>" + e(x[0]) + "</td><td>" + e(x[1]) + "</td><td>" + e(x[2]) + "</td></tr>"; }).join("") + "</table>" + notes.map(function (n) { return "<p class=\"warn\" style=\"margin:6px 0 0\">" + e(n) + "</p>"; }).join("");
    }
    [pkg, rate, len, sw].forEach(function (x) { x.addEventListener("input", run); x.addEventListener("change", run); });
    run();
  })();

  /* ---- UCIe-3D bundle repair ---- */
  (function () {
    var A = document.getElementById("rpA"), D0 = document.getElementById("rpD0"), D1 = document.getElementById("rpD1"), dl = document.getElementById("rpd"), out = document.getElementById("rpout");
    if (!A) return;
    function run() {
      var a = +A.value, d0 = +D0.value, d1 = +D1.value, d = +dl.value;
      if (!(a >= 0) || !(d0 >= 0) || !(d1 >= 0) || !(d > 0)) { out.innerHTML = "<span class=\"warn\">Enter non-negative numbers; δ must be above 0.</span>"; return; }
      var x = a * d0, term = Math.exp(-x), cum = term, k = 0;
      while (1 - cum >= d && k < 500) { k++; term = term * x / k; cum += term; }
      var big = 1 - Math.exp(-a * d1);
      var html = "<div class=\"big\">Reserve " + (2 * k) + " full modules (k = " + k + ")</div>" +
        "<p style=\"margin:6px 0 0\">Expected small defects A·D0 = " + fmt(x, 4) + ". Probability of more than k defects = " + (1 - cum).toExponential(2) + " &lt; δ = " + d + ".</p>" +
        "<p style=\"margin:6px 0 0\" class=\"" + (big < d ? "" : "warn") + "\">Large-defect check: 1 − e^(−A·D1) = " + big.toExponential(2) + (big < d ? " &lt; δ, so the model holds." : " ≥ δ: large defects are too common; more spare bundles are needed (simulate).") + "</p>";
      if (k >= 500) html += "<p class=\"warn\">k capped at 500: check the inputs.</p>";
      out.innerHTML = html;
    }
    [A, D0, D1, dl].forEach(function (x) { x.addEventListener("input", run); });
    run();
  })();

  /* ---- waveform helpers ---- */
  function rep(p, n) { var s = ""; while (s.length < n) s += p; return s.slice(0, n); }
  function lab(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function frame() { return ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7"]; }

  var gateClk = rep("10", 32) + rep("1", 12) + rep("0", 4) + rep("10", 8);
  var gateVld = "1111000011110000" + rep("0", 32) + "11110000";
  var gateDat = frame().concat(frame(), lab([["hold last bit", 32]]), frame());

  var q = 40;
  var qVld = "11110000" + rep("0", 16) + "11110000" + rep("0", 8);
  var qDat = frame().concat(lab([["idle", 16]]), frame(), lab([["idle", 8]]));
  var qTrk = rep("0", 16) + rep("1100", 24);

  var d3n = 16, d3Dat = [], d3Note = [];
  for (var i = 0; i < d3n; i++) { var L = String.fromCharCode(65 + Math.floor(i / 2)); d3Dat.push(L); d3Note.push(i % 2 ? "sample " + L : ""); }

  window.PAGE = {
    CW: 20,
    wgroups: [["all", "All"], ["clk", "Clocking"], ["idle", "Idle & BER"], ["txrx", "Tx/Rx"], ["sb", "Sideband"], ["red", "Degrade"], ["d3", "UCIe-3D"]],
    scenarios: [
      {
        id: "gate", tab: "Clock gating (≤ 32 GT/s)", unit: "UI", cw: 24, title: "Half-rate, strobe mode: two frames, postamble, gate, resume",
        desc: "One data lane, Valid and clock Phase-1 on an unterminated link. Each column is 1 UI; the half-rate clock toggles every UI. Park level and pre-drive length are examples within the rules.",
        ref: "§4.1.3, p.101 · §5.11, Figure 5-64, p.251–252",
        n: 56, gaps: [],
        sig: [
          { name: "Phase", d: "note", t: "note", v: lab([["frame 1", 8], ["frame 2", 8], ["postamble: 16 UI", 16], ["gated, parked high", 12], ["drive low", 4], ["frame 3", 8]]) },
          { name: "CLK (Phase-1)", d: "pl", t: "bit", v: gateClk },
          { name: "VLD", d: "lp", t: "bit", v: gateVld },
          { name: "DATA[n]", d: "lp", t: "bus", v: gateDat }
        ],
        steps: [
          { r: [0, 15], t: "Two frames back to back", x: "Each 8-UI frame has Valid high for 4 UI and low for 4 UI. Data moves on every UI, on both clock edges.", s: "§5.11, p.251 · §4.1.2, p.100" },
          { r: [16, 31], t: "Postamble", x: "Valid stays low. The clock keeps running for 8 cycles (16 UI at half rate) before it may stop. On an unterminated link the data lane holds its last bit.", w: "Some lanes may instead toggle like scrambled data, without advancing the scrambler.", s: "§4.1.3, p.101 · §5.11, p.251" },
          { r: [32, 43], t: "Clock gated", x: "The clock parks. In strobe mode the park level alternates between high and low on consecutive gating events; this time it is high.", s: "§5.11, p.251" },
          { r: [44, 47], t: "Pre-drive low", x: "Before normal operation the clock is driven differential low for 1 to 8 UI (4 here). The whole gated period, 16 UI, is a multiple of 8 UI.", s: "§5.11, p.251" },
          { r: [48, 55], t: "Resume", x: "The clock restarts with the next frame. No preamble beyond the pre-drive is needed.", s: "Figure 5-64, p.251" }
        ]
      },
      {
        id: "q64", tab: "64 GT/s quarter-rate", unit: "UI", cw: 26, title: "64 GT/s: quarter-rate quadrature clock that never stops, with Track",
        desc: "Advanced or Standard Package at 64 GT/s. Each column is 1 UI (15.6 ps). One clock period = 4 UI (16 GHz).",
        ref: "Table 5-12, p.203 · §5.5.1, p.202 · §5.11, p.253",
        n: q, gaps: [],
        sig: [
          { name: "CLK Phase-1", d: "pl", t: "bit", v: rep("1100", q) },
          { name: "CLK Phase-2", d: "pl", t: "bit", v: rep("0110", q) },
          { name: "TRK", d: "pl", t: "bit", v: qTrk },
          { name: "VLD", d: "lp", t: "bit", v: qVld },
          { name: "DATA[n]", d: "lp", t: "bus", v: qDat }
        ],
        steps: [
          { r: [0, 7], t: "Quarter-rate quadrature", x: "16 GHz clock: one period every 4 UI. Phase-2 trails Phase-1 by a quarter period (1 UI), giving the receiver four sampling phases. I/Q correction trims that offset in 1/64 UI steps.", s: "Table 5-12, Table 5-13, p.203" },
          { r: [8, 15], t: "Idle with the clock running", x: "At 48/64 GT/s only continuous clock mode exists. Valid stays low and the idle period is a multiple of 8 UI.", s: "§5.11, p.253" },
          { r: [16, 23], t: "Track on request", x: "The partner asked over sideband for Track. The pattern is 1100… aligned with Phase-1 in quarter-rate mode; the receiver uses it to correct slow drift between data and clock.", s: "§5.5.1, p.202 · §5.3, p.190" },
          { r: [24, 39], t: "Data with Track running", x: "Track may run during data transfer or electrical idle; once enabled, clock and Track stay on until the recalibration flow completes.", s: "§5.11, p.253" }
        ]
      },
      {
        id: "d3", tab: "UCIe-3D timing", unit: "half-UI", cw: 64, title: "UCIe-3D: launch on rise, sample on fall",
        desc: "4 GT/s, one bit per lane per clock (data rate = SoC clock). Each column is half a UI (125 ps). Data and clock delays are matched, so Rx sees the same relationship as Tx.",
        ref: "§6.3, p.260 · Figure 6-4, p.261 · Table 6-1, p.260",
        n: d3n, gaps: [],
        sig: [
          { name: "Tx CLK", d: "lp", t: "bit", v: rep("10", d3n) },
          { name: "Tx DATA", d: "lp", t: "bus", v: d3Dat },
          { name: "Rx CLK", d: "pl", t: "bit", v: rep("10", d3n) },
          { name: "Rx DATA", d: "pl", t: "bus", v: d3Dat },
          { name: "Rx samples", d: "note", t: "note", v: d3Note }
        ],
        steps: [
          { r: [0, 0], t: "Launch on the rising edge", x: "SoC logic launches bit A on the Tx clock rising edge.", s: "Figure 6-4, p.261" },
          { r: [1, 1], t: "Sample on the falling edge", x: "With matched data and clock buffer delays, the Rx falling edge sits in the middle of the data eye, half a UI after launch. That is the whole PHY latency: 0.125 ns at 4 GT/s.", w: "On-die logic usually times rise-to-rise because combinational logic sits between flops; UCIe-3D has none, so rise-to-fall gives the best margin.", s: "§6.3, p.260 · Table 6-1, p.260" },
          { r: [2, 15], t: "Every cycle, one bit", x: "Skew, jitter, channel closure and the Vcc-dependent delay spread must all fit inside 1 UI (Equation 6-6), about 0.98 UI with the table values.", s: "§6.4.1, Table 6-2, Equation 6-6, p.261–263" }
        ]
      }
    ]
  };
})();
