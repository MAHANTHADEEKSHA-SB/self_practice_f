(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }

  /* protocol × rate → format requirements (Table 3-7, Table 2-1) */
  (function () {
    var pc = document.getElementById("pmproto"), rc = document.getElementById("pmrate"); if (!pc) return;
    var P = ["PCIe Non-Flit", "PCIe Flit", "CXL 68B", "CXL 256B", "Streaming", "Mgmt Transport"];
    var F = ["1 · Raw", "2 · 68B", "3 · Std 256B End Header", "4 · Std 256B Start Header", "5 · Latency-Opt, no optional bytes", "6 · Latency-Opt, optional bytes"];
    var T = [
      ["Optional", "Optional", "Optional", "Optional", "Mandatory", "Optional"],
      ["Mandatory", "N/A", "Mandatory", "N/A", "Optional (Streaming Flit Format capability)", "N/A"],
      ["N/A", "Mandatory", "N/A", "N/A", "Optional (capability)", "Optional"],
      ["N/A", "Optional (Std Start Header for PCIe capability)", "N/A", "Mandatory", "Optional (capability)", "Optional"],
      ["N/A", "N/A", "N/A", "Optional", "Optional (capability)", "Optional"],
      ["N/A", "Strongly recommended (if capable)", "N/A", "Strongly recommended", "Strongly recommended (capability)", "Optional"]
    ];
    var p = 3, r = 0;
    function draw() {
      var unsupported = r === 1 && (p === 0 || p === 2);
      var h = "";
      if (unsupported) h = "<p style=\"font-size:15px;color:var(--bad)\"><strong>" + P[p] + " is not supported when the negotiated maximum data rate is above 32 GT/s.</strong></p>";
      else {
        h = "<div class=\"tbl-wrap\" style=\"border:0\"><table><thead><tr><th>Format</th><th>Status</th></tr></thead><tbody>";
        F.forEach(function (f, i) {
          var s = T[i][p]; if (i === 1 && r === 1) s = "Not supported above 32 GT/s";
          var c = /Mandatory/.test(s) ? "var(--pl)" : /Strongly/.test(s) ? "var(--lp)" : /N\/A|Not/.test(s) ? "var(--muted)" : "var(--ink)";
          h += "<tr><td class=\"mono\" style=\"font-size:12.5px\">" + f + "</td><td style=\"color:" + c + "\">" + s + "</td></tr>";
        });
        h += "</tbody></table></div>";
      }
      document.getElementById("pmout").innerHTML = h;
      document.getElementById("pmsrc").innerHTML = "<span class=\"sl\">Spec</span>Table 3-7, p.85 · Table 2-1, p.53 · §2.5, p.57";
    }
    function mk(box, list, get, set) {
      list.forEach(function (t, i) { var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = t;
        b.addEventListener("click", function () { set(i); Array.prototype.forEach.call(box.children, function (c, k) { c.setAttribute("aria-pressed", k === i ? "true" : "false"); }); draw(); });
        b.setAttribute("aria-pressed", i === get() ? "true" : "false"); box.appendChild(b); });
    }
    mk(pc, P, function () { return p; }, function (i) { p = i; });
    mk(rc, ["max rate ≤ 32 GT/s", "max rate > 32 GT/s"], function () { return r; }, function (i) { r = i; });
    draw();
  })();

  window.PAGE = {
    CW: 96,
    wgroups: [["all", "All"], ["pcie", "PCIe"], ["cxl", "CXL"], ["str", "Streaming, MTP, Raw"]],
    scenarios: [
      {
        id: "viral", tab: "Viral with lp_corrupt_crc", unit: "flit slots", title: "Containing a bad CXL.cachemem flit with a corrupted CRC",
        desc: "Standard 256B flits with Adapter retry. The Protocol Layer realises flit F3 must not be consumed after it has started sending it.",
        ref: "Table 10-3 (lp_corrupt_crc), p.540 · §3.8, p.93",
        n: 8, gaps: [],
        sig: [
          { name: "Protocol Layer → FDI", d: "lp", t: "bus", v: ["F1", "F2", "F3 (bad)", "F4 (viral)", "", "", "", ""] },
          { name: "lp_corrupt_crc", d: "lp", t: "bit", v: bits(8, [[2, 2]]) },
          { name: "retry buffer, seq N", d: "pl", t: "note", v: ["", "", "F3", "F4 (viral)", "F4 (viral)", "F4 (viral)", "F4 (viral)", ""] },
          { name: "link", d: "sb", t: "bus", v: ["#N−2 F1", "#N−1 F2", "#N F3 ✗CRC", "", "", "replay #N", "", ""] },
          { name: "remote Adapter", d: "pl", t: "note", v: ["accept", "accept", "CRC fail: drop", "Nak (S = N−1)", "", "", "accept viral", ""] }
        ],
        steps: [
          { r: [0, 1], t: "Normal traffic", x: "F1 and F2 go out with good CRCs and are accepted.", s: "§3.8, p.93" },
          { r: [2, 2], t: "Mark the bad flit", x: "With the last chunk of F3 the Protocol Layer asserts lp_corrupt_crc. The Adapter XORs F3's CRCs with 138Eh (for Standard 256B flits, both 128B halves). The syndrome is chosen so no 1- or 2-bit error can produce it.", s: "Table 10-3 (lp_corrupt_crc), p.540" },
          { r: [3, 3], t: "Overwrite in the retry buffer", x: "The next flit from the Protocol Layer, F4, carries the viral information. The Adapter writes it over F3's entry in the Tx retry buffer.", s: "Table 10-3, p.540" },
          { r: [3, 4], t: "Receiver rejects F3", x: "The remote Adapter sees a CRC error on #N, drops it (cancelling anything already passed up) and sends a Nak for N.", s: "§3.7, p.92 · §3.8, p.93" },
          { r: [5, 6], t: "The replay is the viral flit", x: "Replaying from #N sends the overwritten entry: the remote side receives the viral flit instead of the bad data. Normal flits never paid any extra latency for this protection.", s: "Table 10-3, p.540 · §2.2.2, p.54" }
        ]
      },
      {
        id: "latopt", tab: "Format 4 vs Format 6 latency", unit: "lclk cycles (2 GHz)", title: "When can the receiving Protocol Layer use the data?",
        desc: "A 256B flit arrives on a 64B FDI as four chunks. The Adapter forwards chunks before CRC checking and may cancel them in the cycle right after the last chunk of the flit (or 128B half).",
        ref: "§2.2.2, p.54 · §3.3.4, p.80–81 · Table 10-3 (pl_flit_cancel), p.542",
        n: 7, gaps: [],
        sig: [
          { name: "pl_data chunk", d: "pl", t: "bus", v: ["c0", "c1", "c2", "c3", "", "", ""] },
          { name: "Format 4: cancel slot", d: "note", t: "note", v: ["", "", "", "", "whole flit", "", ""] },
          { name: "Format 4: usable", d: "lp", t: "note", v: ["", "", "", "", "all 256B", "", ""] },
          { name: "Format 6: cancel slots", d: "note", t: "note", v: ["", "", "half 0", "", "half 1", "", ""] },
          { name: "Format 6: usable", d: "lp", t: "note", v: ["", "", "bytes 0–127", "", "bytes 128–255", "", ""] }
        ],
        steps: [
          { r: [0, 1], t: "First half arrives", x: "Chunks c0 and c1 carry bytes 0–127. With Format 6, CRC0 covers exactly these bytes.", s: "§3.3.4, p.81" },
          { r: [2, 2], t: "Format 6: half 0 is safe one cycle later", x: "No cancel for half 0 in the cycle after c1, so the Protocol Layer can act on bytes 0–127 now: 2 cycles (1 ns at 2 GHz) earlier than with Format 4.", s: "Table 10-3 (pl_flit_cancel), p.542 · §2.2.2, p.54" },
          { r: [3, 4], t: "Format 4: wait for the whole flit", x: "With Format 4, CRC0 and CRC1 sit at the end of the flit, so nothing is safe to use until the cancel slot after c3.", s: "§3.3.3, p.76" }
        ]
      }
    ]
  };
})();
