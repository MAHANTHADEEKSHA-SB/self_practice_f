(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }

  /* ---------- byte map ---------- */
  (function () {
    var chips = document.getElementById("bmchips"); if (!chips) return;
    var W = [
      { n: 64, name: "x64", cap: "x64: one x64 Advanced module, two x32 Advanced modules, or four x16 Standard modules. A 256B flit takes 4 blocks of 8 UI.", ref: "Figure 4-2, p.99" },
      { n: 32, name: "x32", cap: "x32: a 256B flit takes 8 blocks. Still one byte per lane per 8 UI.", ref: "Figure 4-3, p.99" },
      { n: 16, name: "x16 Standard", cap: "x16 Standard Package: 16 blocks per 256B flit.", ref: "Figure 4-4, p.99" },
      { n: 8, name: "x8 (degraded x16)", cap: "A x16 Standard module degraded to x8: only the 8 active lanes carry bytes, in ascending order; 32 blocks per 256B flit.", ref: "Figure 4-5, p.100 · §4.3.7, p.118" }
    ];
    function cols(n) { return n <= 16 ? Array.apply(null, Array(n)).map(function (_, i) { return i; }) : [0, 1, 2, 3, -1, n - 4, n - 3, n - 2, n - 1]; }
    function draw(w) {
      var rows = 256 / w.n, cs = cols(w.n), rlist = rows <= 5 ? Array.apply(null, Array(rows)).map(function (_, i) { return i; }) : [0, 1, 2, -1, rows - 1];
      var h = "<table class=\"mono\" style=\"font-size:12px\"><thead><tr><th>UI block</th>";
      cs.forEach(function (c) { h += "<th class=\"num\">" + (c < 0 ? "…" : (w.n === 8 ? "active " + c : "lane " + c)) + "</th>"; });
      h += "</tr></thead><tbody>";
      rlist.forEach(function (r) {
        h += "<tr><td>" + (r < 0 ? "…" : (r * 8) + "–" + (r * 8 + 7)) + "</td>";
        cs.forEach(function (c) { h += "<td class=\"num\">" + (r < 0 || c < 0 ? "…" : "B" + (r * w.n + c)) + "</td>"; });
        h += "</tr>";
      });
      document.getElementById("bmap").innerHTML = h + "</tbody></table>";
      document.getElementById("bmcap").innerHTML = w.cap + "<span class=\"ref\">Spec: " + w.ref + "</span>";
    }
    W.forEach(function (w, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = w.name;
      b.addEventListener("click", function () { Array.prototype.forEach.call(chips.children, function (c, k) { c.setAttribute("aria-pressed", k === i ? "true" : "false"); }); draw(w); });
      chips.appendChild(b);
    });
    chips.children[0].setAttribute("aria-pressed", "true"); draw(W[0]);
  })();

  /* ---------- lane repair visualizer (group 0) ---------- */
  (function () {
    var g1 = document.getElementById("rpgrid"), g2 = document.getElementById("rpgrid2"); if (!g1) return;
    var fails = [];
    function mapping() {
      var m = {}; var f = fails.slice().sort(function (a, b) { return a - b; });
      for (var k = 0; k < 32; k++) m["P" + k] = "L" + k;
      m.TRD0 = "—"; m.TRD1 = "—";
      if (f.length >= 1) { var a = f[0]; for (var k2 = 0; k2 <= a; k2++) { if (k2 === 0) m.TRD0 = "L0"; else m["P" + (k2 - 1)] = "L" + k2; } m["P" + a] = "✕"; }
      if (f.length === 2) { var b = f[1]; for (var k3 = b; k3 <= 31; k3++) { if (k3 === 31) m.TRD1 = "L31"; else m["P" + (k3 + 1)] = "L" + k3; } m["P" + b] = "✕"; }
      return m;
    }
    function cell(name, logical, clickable, idx) {
      var bad = logical === "✕", spare = name.indexOf("TRD") === 0, moved = !spare && logical !== "L" + name.slice(1) && !bad, used = spare && logical !== "—";
      var bg = bad ? "color-mix(in srgb, var(--bad) 18%, var(--surface))" : (moved || used) ? "color-mix(in srgb, var(--lp) 18%, var(--surface))" : spare ? "var(--bg)" : "var(--surface)";
      var el = document.createElement(clickable ? "button" : "div");
      if (clickable) { el.type = "button"; el.setAttribute("aria-pressed", bad ? "true" : "false"); el.addEventListener("click", function () { toggle(idx); }); el.title = "Toggle a failure on physical lane " + idx; }
      el.style.cssText = "border:1px solid " + (spare ? "var(--pl)" : "var(--line)") + ";border-radius:6px;padding:4px 2px;text-align:center;background:" + bg + ";font-family:var(--font-mono);color:var(--ink);cursor:" + (clickable ? "pointer" : "default") + ";min-width:0";
      el.innerHTML = "<div style=\"font-size:9.5px;color:var(--muted)\">" + name.replace("P", "TD_P") + "</div><div style=\"font-size:12px;font-weight:500\">" + logical + "</div>";
      return el;
    }
    function toggle(i) {
      var at = fails.indexOf(i);
      if (at >= 0) fails.splice(at, 1); else { if (fails.length === 2) fails.shift(); fails.push(i); }
      draw();
    }
    function draw() {
      var m = mapping(); g1.innerHTML = ""; g2.innerHTML = "";
      g1.appendChild(cell("TRD0", m.TRD0, false));
      for (var k = 0; k < 16; k++) g1.appendChild(cell("P" + k, m["P" + k], true, k));
      for (var k2 = 16; k2 < 32; k2++) g2.appendChild(cell("P" + k2, m["P" + k2], true, k2));
      g2.appendChild(cell("TRD1", m.TRD1, false));
      var f = fails.slice().sort(function (a, b) { return a - b; }), t;
      if (!f.length) t = "No failures: logical lane n on physical lane n; TRD0 and TRD1 unused (tri-stated). Click physical lanes to fail them.";
      else if (f.length === 1) t = "One failure on TD_P" + f[0] + ": logical lanes 0–" + f[0] + " shift left by one bump, L0 lands on TRD0. Lanes above " + f[0] + " are untouched; TRD1 stays unused.";
      else t = "Two failures, TD_P" + f[0] + " and TD_P" + f[1] + ": lanes 0–" + f[0] + " shift left (L0 onto TRD0); lanes " + f[1] + "–31 shift right (L31 onto TRD1); lanes " + (f[0] + 1) + "–" + (f[1] - 1) + " stay. A third failure in this group cannot be repaired.";
      document.getElementById("rpcap").innerHTML = t + "<span class=\"ref\">Spec: §4.3.1, §4.3.3.1–4.3.3.2 pseudocode, p.107–112 (lanes 32–63 use TRD2/TRD3 the same way)</span>";
    }
    draw();
  })();

  window.PAGE = {
    CW: 22,
    wgroups: [["all", "All"], ["map", "Mapping"], ["frm", "Framing & clock"], ["sb", "Sideband"], ["rep", "Repair & reversal"], ["mm", "Multi-module"]],
    scenarios: [
      {
        id: "valid", tab: "Valid framing + postamble", unit: "UI", title: "Two data blocks on lane 0, then clock gating",
        desc: "Half-rate forwarded clock (one clock edge per UI). Strobe mode: the clock runs with data and stops after the postamble.",
        ref: "§4.1.1–4.1.3, p.98–101",
        n: 40, gaps: [],
        sig: [
          { name: "forwarded clock", d: "pl", t: "bit", v: "0000" + "10101010101010101010101010101010" + "0000" },
          { name: "Valid", d: "pl", t: "bit", v: bits(40, [[4, 7], [12, 15]]) },
          { name: "lane 0 bit index", d: "lp", t: "bus", v: seq([["", 4]]).concat(["0", "1", "2", "3", "4", "5", "6", "7", "0", "1", "2", "3", "4", "5", "6", "7"], seq([["", 20]])) },
          { name: "lane 0 byte", d: "note", t: "note", v: seq([["", 4], ["B0", 8], ["B64", 8], ["", 20]]) },
          { name: "clock state", d: "note", t: "note", v: seq([["gated", 4], ["data", 16], ["postamble: 8 cycles = 16 UI", 16], ["gated", 4]]) }
        ],
        steps: [
          { r: [4, 11], t: "One byte per lane per 8 UI", x: "Valid rises with the first bit. Lane 0 sends B0 bit 0 first through bit 7 last, while lanes 1–63 send B1–B63 in parallel. Valid is high for 4 UI and low for 4 UI.", s: "§4.1.1, p.98 · §4.1.2, p.100" },
          { r: [12, 19], t: "The next block on the 8-UI grid", x: "The next transfer starts exactly 8 UI later. On a x64 module lane 0 now carries B64, the first byte of the next 64-byte beat.", s: "§4.1.2 note, p.100 · Figure 4-2, p.99" },
          { r: [20, 35], t: "Postamble flushes the receiver", x: "Valid stays low, but the clock keeps toggling for 8 cycles (16 UI at half-rate clocking) so the receiver's deserializer can empty, then it stops.", s: "§4.1.3, p.101" },
          { r: [36, 39], t: "Gated", x: "Clock and data are parked (levels per §5.11). The next burst must start on the same 8-UI grid. With free-running clock negotiated, the clock would keep toggling here.", s: "§4.1.3–4.1.4, p.101 · §5.11" }
        ]
      },
      {
        id: "credit", tab: "Retimer credits on Valid", unit: "UI", title: "A Retimer returns 256B credits on Valid",
        desc: "Four 8-UI blocks from a Retimer to its local UCIe die. Codes are written bit 7…0; bit 0 is sent first, so read the waveform right to left within a code.",
        ref: "§4.1.2.1 and Table 4-1, p.101",
        n: 32, gaps: [],
        sig: [
          { name: "Valid", d: "pl", t: "bit", v: "11110000" + "11111111" + "00001111" + "00000000" },
          { name: "code (bit 7…0)", d: "note", t: "note", v: seq([["00001111b", 8], ["11111111b", 8], ["11110000b", 8], ["00000000b", 8]]) },
          { name: "meaning", d: "note", t: "note", v: seq([["data, no credit", 8], ["data + 1 credit", 8], ["1 credit, no data", 8], ["nothing", 8]]) },
          { name: "data lanes", d: "lp", t: "bus", v: seq([["B0–B63", 8], ["B64–B127", 8], ["", 16]]) }
        ],
        steps: [
          { r: [0, 7], t: "Data, no credit", x: "The normal data pattern: Valid high for the first 4 UI, low for the last 4.", s: "Table 4-1, p.101" },
          { r: [8, 15], t: "Data plus a credit", x: "The last 4 UI are also high: one 256B Retimer buffer credit is returned along with the data, at no bandwidth cost.", s: "Table 4-1, p.101" },
          { r: [16, 31], t: "Credit only, then idle", x: "First 4 UI low (no data), last 4 high: a credit with no data. Then a fully idle block. The four codes differ enough to detect 3 bit flips; above 48 GT/s receivers must correct single-bit errors instead.", s: "§4.1.2.1, p.101" }
        ]
      },
      {
        id: "pspt", tab: "Priority sideband packet", unit: "8-UI chunks", title: "PSPT: a priority packet interrupts a normal one",
        desc: "Sideband with Performant Mode and PSPT negotiated. Each column is 8 UI (10 ns at 800 MT/s). A packet is 64 UI = 8 chunks.",
        ref: "§4.1.5.1–4.1.5.2.1, p.102–104",
        n: 22, gaps: [],
        sig: [
          { name: "sideband data", d: "sb", t: "bus", v: ["A0", "A1", "A2", "A3", "", "P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "A4", "A5", "A6", "A7", "B0", "B1", "B2", "B3", "B4"] },
          { name: "what", d: "note", t: "note", v: seq([["normal packet A", 4], ["idle", 1], ["priority packet, opcode 11111b", 8], ["A resumes", 4], ["next packet B, no gap (PMO)", 5]]) }
        ],
        steps: [
          { r: [0, 3], t: "Normal packet A starts", x: "A normal 64-UI packet (for example a management message) begins.", s: "§4.1.5, p.102" },
          { r: [4, 4], t: "Interrupt on an 8-UI boundary", x: "A priority packet is waiting. At an 8-UI multiple of packet A the transmitter inserts 8 UI of idle (clock and data both 0) to mark the interruption.", s: "§4.1.5.2.1 rules 1–2, p.103" },
          { r: [5, 12], t: "Priority packet", x: "The full 64-UI priority packet follows. Its opcode 11111b says it is the last priority packet, so packet A resumes immediately after it. Opcode 11110b would have chained another priority packet.", s: "§4.1.5.2.1 rule 3, p.103" },
          { r: [13, 16], t: "Packet A resumes", x: "The remaining 32 UI of packet A follow with no idle. The receiver tracked that A was interrupted and reassembles it.", s: "§4.1.5.2.1, p.104" },
          { r: [17, 21], t: "Back to back with PMO", x: "Performant Mode removes the 32-UI gap between packets, so packet B starts right away. Without PMO there would be at least 32 UI of low first.", s: "§4.1.5.1, p.102" }
        ]
      }
    ]
  };
})();
