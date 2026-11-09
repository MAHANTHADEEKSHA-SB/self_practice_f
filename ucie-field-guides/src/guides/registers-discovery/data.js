(function () {
  function h(n, w) { var s = (n >>> 0).toString(16).toUpperCase(); while (s.length < (w || 1)) s = "0" + s; return s + "h"; }
  function bin(n, w) { var s = (n >>> 0).toString(2); while (s.length < w) s = "0" + s; return s + "b"; }
  function fld(v, hi, lo) { return (v >>> lo) & ((1 << (hi - lo + 1)) - 1); }
  function e(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---- width encodings ---- */
  (function () {
    var chips = document.getElementById("wchips"), tb = document.querySelector("#wtable tbody");
    if (!chips || !tb) return;
    var W = ["x4", "x8", "x16", "x32", "x64", "x128", "x256"];
    var CAP = { x16: 0, x32: 1, x64: 2, x128: 3, x256: 4, x8: 7 };
    var CTL = { x8: 1, x16: 2, x32: 3, x64: 4, x128: 5, x256: 6 };
    var STS = { x4: 0, x8: 1, x16: 2, x32: 3, x64: 4, x128: 5, x256: 6 };
    function c(m, w) { return w in m ? h(m[w]) : "—"; }
    W.forEach(function (w) {
      var tr = document.createElement("tr"); tr.dataset.w = w;
      tr.innerHTML = "<td>" + w + "</td><td>" + c(CAP, w) + "</td><td>" + c(CTL, w) + "</td><td>" + c(STS, w) + "</td>";
      tb.appendChild(tr);
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = w;
      b.addEventListener("click", function () { pick(w); });
      chips.appendChild(b);
    });
    function pick(w) {
      Array.prototype.forEach.call(chips.children, function (b) { b.setAttribute("aria-pressed", b.textContent === w ? "true" : "false"); });
      Array.prototype.forEach.call(tb.children, function (tr) { Array.prototype.forEach.call(tr.children, function (td) { td.className = tr.dataset.w === w ? "hit" : ""; }); });
    }
    pick("x16");
  })();

  /* ---- Link Status decoder ---- */
  (function () {
    var inp = document.getElementById("lsin"), out = document.getElementById("lsout");
    if (!inp) return;
    var WID = ["x4", "x8", "x16", "x32", "x64", "x128", "x256"], SPD = ["4", "8", "12", "16", "24", "32", "48", "64"];
    function yn(b) { return b ? "1 (yes)" : "0"; }
    function run() {
      var t = inp.value.trim().replace(/^0x/i, "").replace(/h$/i, "").replace(/[_\s]/g, "");
      if (!/^[0-9a-fA-F]{1,8}$/.test(t)) { out.innerHTML = "<span class=\"warn\">Enter up to 8 hex digits.</span>"; return; }
      var v = parseInt(t, 16) >>> 0, up = fld(v, 15, 15);
      var w = fld(v, 10, 7), s = fld(v, 14, 11), ff = fld(v, 25, 22);
      var rows = [
        ["[15] Link Status", up ? "1: link UP (RDI and FDI up)" : "0: link DOWN: the fields marked * are not meaningful"],
        ["[16] Training/Retraining", yn(fld(v, 16, 16))],
        ["[10:7] Link Width enabled *", (WID[w] || "reserved") + " (" + h(w) + ")"],
        ["[14:11] Link Speed enabled *", (SPD[s] ? SPD[s] + " GT/s" : "reserved") + " (" + h(s) + ")"],
        ["[25:22] Flit Format *", ff >= 1 && ff <= 6 ? "Format " + ff + (ff === 1 ? " (Raw)" : ff === 2 ? " (68B)" : "") : (ff === 0 ? "0h (none / not valid)" : "reserved (" + h(ff) + ")")],
        ["[0] Raw Format enabled *", yn(fld(v, 0, 0))],
        ["[1] Multi-protocol enabled *", yn(fld(v, 1, 1))],
        ["[2] Enhanced Multi-protocol enabled *", yn(fld(v, 2, 2))],
        ["[3] x32 Advanced Package module", yn(fld(v, 3, 3))],
        ["[17] Link Status changed (RW1C)", yn(fld(v, 17, 17))],
        ["[18] HW autonomous BW changed (RW1C)", yn(fld(v, 18, 18))],
        ["[19] Correctable error detected", yn(fld(v, 19, 19)) + (fld(v, 19, 19) ? ": see Correctable Error Status (D2D block 1Ch)" : "")],
        ["[20] Uncorrectable non-fatal detected", yn(fld(v, 20, 20)) + (fld(v, 20, 20) ? ": see Uncorrectable Error Status (10h)" : "")],
        ["[21] Uncorrectable fatal detected", yn(fld(v, 21, 21)) + (fld(v, 21, 21) ? ": see Uncorrectable Error Status (10h) and Header Log 2" : "")],
        ["[26] Sideband PMO operational", yn(fld(v, 26, 26))],
        ["[27] PSPT operational", yn(fld(v, 27, 27))],
        ["[28] L2SPD applicable", yn(fld(v, 28, 28))]
      ];
      var warn = (fld(v, 6, 4) || fld(v, 31, 29)) ? "<p class=\"warn\" style=\"margin:8px 0 0\">Reserved bits [6:4] or [31:29] are non-zero: check the value.</p>" : "";
      out.innerHTML = "<table>" + rows.map(function (r) { return "<tr><td>" + e(r[0]) + "</td><td>" + e(r[1]) + "</td></tr>"; }).join("") + "</table>" + warn;
    }
    inp.addEventListener("input", run); run();
  })();

  /* ---- Mailbox calculator ---- */
  (function () {
    var op = document.getElementById("mbop"), rl = document.getElementById("mbrl"), off = document.getElementById("mboff"), be = document.getElementById("mbbe"), out = document.getElementById("mbout");
    if (!op) return;
    var OPS = [[0, "32b Memory Read"], [1, "32b Memory Write"], [4, "32b Configuration Read"], [5, "32b Configuration Write"], [8, "64b Memory Read"], [9, "64b Memory Write"], [12, "64b Configuration Read"], [13, "64b Configuration Write"]];
    OPS.forEach(function (o) { var x = document.createElement("option"); x.value = o[0]; x.textContent = bin(o[0], 5) + " " + o[1]; op.appendChild(x); });
    op.value = "4";
    function isCfg(c) { return c === 4 || c === 5 || c === 12 || c === 13; }
    function is64(c) { return c >= 8; }
    function fillRL() {
      var c = +op.value, keep = rl.value; rl.innerHTML = "";
      var L = isCfg(c) ? [[0, "0h: UCIe Link DVSEC"], [15, "Fh: shadowed protocol config regs"]] : [[0, "0h: Register Locator 0"], [1, "1h: Register Locator 1"], [2, "2h: Register Locator 2"], [3, "3h: Register Locator 3"], [15, "Fh: shadowed protocol MMIO regs"]];
      L.forEach(function (o) { var x = document.createElement("option"); x.value = o[0]; x.textContent = o[1]; rl.appendChild(x); });
      if (Array.prototype.some.call(rl.options, function (o) { return o.value === keep; })) rl.value = keep;
    }
    function run() {
      var c = +op.value, r = +rl.value, notes = [];
      var ot = off.value.trim().replace(/^0x/i, "").replace(/h$/i, ""), bt = be.value.trim().replace(/^0x/i, "").replace(/h$/i, "");
      if (!/^[0-9a-fA-F]{1,5}$/.test(ot) || !/^[0-9a-fA-F]{1,2}$/.test(bt)) { out.innerHTML = "<span class=\"warn\">Offset: up to 5 hex digits. BE: up to 2 hex digits.</span>"; return; }
      var o = parseInt(ot, 16), b = parseInt(bt, 16), max = isCfg(c) ? 0xFFF : 0xFFFFF;
      if (o > max) notes.push("Offset too large: " + (isCfg(c) ? "config accesses carry a 12-bit byte offset" : "memory accesses carry a 20-bit byte offset") + ".");
      if (o % (is64(c) ? 8 : 4)) notes.push("Offset must be " + (is64(c) ? "QWORD (8-byte)" : "DWORD (4-byte)") + " aligned for this access size.");
      var addr = ((r & 0xF) << 20) | (o & max);
      var lo = (((addr & 0x7FFFF) << 13) | ((b & 0xFF) << 5) | (c & 0x1F)) >>> 0, hi = (addr >>> 19) & 0x1F;
      var write = (c & 1) === 1;
      var rows = [
        ["Addr[23:0]", h(addr, 6) + (isCfg(c) ? "  = {RL " + h(r) + ", Rsvd 00h, Offset " + h(o & 0xFFF, 3) + "}" : "  = {RL " + h(r) + ", Offset " + h(o & 0xFFFFF, 5) + "}")],
        ["Index Low", h(lo, 8) + "  = Addr[18:0] " + h(addr & 0x7FFFF, 5) + " | BE " + h(b, 2) + " | opcode " + bin(c, 5)],
        ["Index High", h(hi, 8) + "  = Addr[23:19]"],
        ["Then", (write ? "Write data to Data Low" + (is64(c) ? " and Data High" : "") + "; " : "") + "write 1 to Control[0]; poll until it reads 0; check Status[1:0] = 11b" + (write ? "." : "; read Data Low" + (is64(c) ? " and Data High." : " (Data High is not valid for 32b)."))]
      ];
      if (r === 15) notes.push("RL Fh offsets are implementation-specific: the protocol layer translates them to the Adapter's layout.");
      out.innerHTML = "<table>" + rows.map(function (x) { return "<tr><td>" + e(x[0]) + "</td><td>" + e(x[1]) + "</td></tr>"; }).join("") + "</table>" + notes.map(function (n) { return "<p class=\"warn\" style=\"margin:6px 0 0\">" + e(n) + "</p>"; }).join("");
    }
    op.addEventListener("change", function () { fillRL(); run(); });
    [rl, off, be].forEach(function (x) { x.addEventListener("input", run); x.addEventListener("change", run); });
    fillRL(); run();
  })();

  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }

  window.PAGE = {
    CW: 104,
    wgroups: [["all", "All"], ["disc", "Discovery"], ["ctl", "Control & status"], ["mbx", "Mailbox"], ["err", "Errors"], ["mon", "Health"]],
    scenarios: [
      {
        id: "mbx", tab: "Mailbox read", unit: "steps", title: "Host reads the partner die's Link Status through the mailbox",
        desc: "A 32-bit Configuration Read of offset 14h in the partner's UCIe Link DVSEC. Each column is a step, not a fixed time.",
        ref: "§9.5.1.11–9.5.1.16, p.477–479 · Table 7-6, p.273",
        n: 7, gaps: [],
        sig: [
          { name: "Software", d: "lp", t: "note", v: ["IdxLo ← 281E4h", "IdxHi ← 0h", "Ctl[0] ← 1", "poll: 1", "poll: 1", "poll: 0", "read Sts, Data"] },
          { name: "Trigger Ctl[0]", d: "pl", t: "bit", v: bits(7, [[2, 4]]) },
          { name: "Sideband", d: "sb", t: "note", v: ["", "", "", "Cfg Rd 32b →", "← Cpl + data", "", ""] },
          { name: "Status[1:0]", d: "pl", t: "bus", v: ["not valid", "not valid", "not valid", "not valid", "not valid", "11b", "11b"] },
          { name: "Data Low", d: "pl", t: "bus", v: ["undefined", "undefined", "undefined", "undefined", "undefined", "partner Link Status", "partner Link Status"] }
        ],
        steps: [
          { r: [0, 1], t: "Build the request", x: "Address {RL 0h = Link DVSEC, offset 014h} = 000014h. Index Low = Addr[18:0] << 13 | BE 0Fh << 5 | opcode 00100b = 000281E4h. Index High = Addr[23:19] = 0.", w: "The values are worked out from the field layouts; try other accesses in the calculator above.", s: "Tables 9-15, 9-16, p.477–478 · Table 7-6, p.273" },
          { r: [2, 2], t: "Pull the trigger", x: "Software writes 1 to Control bit 0. The 0→1 edge sends the request and re-arms Header Log 1 for this access.", s: "Table 9-19, p.479 · Table 9-32, p.485" },
          { r: [3, 4], t: "Across the sideband and back", x: "The Adapter sends a sideband Configuration Read to the partner, which returns a completion with 32-bit data. Status and data are not valid yet, so software keeps polling.", w: "If no completion comes, the access times out; after the Remote Register Access Threshold (default 4) consecutive timeouts the Adapter logs 0111b and the link is taken down.", s: "Table 9-34, p.488 · Table 9-33, p.486" },
          { r: [5, 6], t: "Done", x: "The trigger clears itself. Status = 11b (Success), so Data Low holds the partner's Link Status. On 00b (CA) or 01b (UR), read Header Log 1 for the failing request header.", s: "Tables 9-17, 9-20, p.478–479" }
        ]
      },
      {
        id: "err", tab: "Fatal error", unit: "steps", title: "Retry timeout takes the link down and software recovers",
        desc: "Retry is enabled, the link is up, and the partner stops returning Ack/Nak. Software has enabled the Link Event interrupt and the fatal-error interrupt and unmasked Adapter Timeout. Columns are steps.",
        ref: "Tables 9-27, 9-33, p.482–487 · Tables 9-10 to 9-12, p.470–475",
        n: 8, gaps: [1],
        sig: [
          { name: "Adapter", d: "pl", t: "note", v: ["flits unacked", "no Ack/Nak", "8 ms: timeout", "link goes down", "", "", "", "retraining"] },
          { name: "UE Status[0]", d: "pl", t: "bit", v: bits(8, [[2, 5]]) },
          { name: "HdrLog2[3:0]", d: "pl", t: "bus", v: ["0000b", "0000b", "0100b", "0100b", "0100b", "0100b", "0100b", "0100b"] },
          { name: "Link Status [15]", d: "pl", t: "bit", v: bits(8, [[0, 2]]) },
          { name: "Changed [17]", d: "pl", t: "bit", v: bits(8, [[3, 5]]) },
          { name: "Fatal det. [21]", d: "pl", t: "bit", v: bits(8, [[3, 5]]) },
          { name: "MSI", d: "note", t: "note", v: ["", "", "", "", "2 MSIs fire", "", "", ""] },
          { name: "Software", d: "lp", t: "note", v: ["", "", "", "", "ISR reads", "W1C status", "Start training", ""] }
        ],
        steps: [
          { r: [0, 1], t: "Retry buffer waits", x: "Flits sit in the retry buffer and no Ack or Nak returns. The 8 ms timer only counts while RDI is Active and the retry buffer is not empty.", s: "Table 9-33 encoding 0100b, p.486" },
          { r: [2, 2], t: "Adapter Timeout logged", x: "Uncorrectable Error Status bit 0 sets. Header Log 2 [3:0] = 0100b (Retry Timeout). First Fatal Error Indicator [22:18] = 00h.", s: "Tables 9-27, 9-33, p.482–487" },
          { r: [3, 3], t: "Link goes down", x: "An Adapter Timeout brings the main link down. Link Status bit 15 falls, bit 17 (Link Status changed) and bit 21 (uncorrectable fatal detected; severity defaults to fatal) set.", s: "Table 9-27, p.482 · Table 9-29, p.484 · Table 9-10, p.471" },
          { r: [4, 4], t: "Interrupts", x: "The Link Event vector fires for the status change and the Link Error vector for the fatal error. If the OS gave only one MSI vector, both arrive on it.", s: "Table 9-11, p.472 · Table 9-12, p.475 · §9.7, p.519" },
          { r: [5, 7], t: "Software recovers", x: "Read Header Log 2 for the cause, write 1s to clear the RW1C status bits (which also re-arms the First Fatal Error Indicator), then set Start UCIe Link training. Retrain would do nothing: the link is down.", s: "Table 9-9, p.468–469 · Table 9-33, p.487" }
        ]
      },
      {
        id: "uhm", tab: "Eye margins", unit: "steps", title: "Measuring per-lane eye margins with the UHM DVSEC",
        desc: "The link is up. Software wants a fresh eye margin reading. Columns are steps.",
        ref: "§9.5.3.40, p.505 · Tables 9-66 to 9-68, p.506",
        n: 8, gaps: [],
        sig: [
          { name: "Software", d: "lp", t: "note", v: ["", "EMV ← 1 (clear)", "Retrain ← 1", "poll [16]", "poll [16]", "", "read Step Count", "read EML/EMR"] },
          { name: "EMV (UHM_STS[8])", d: "pl", t: "bit", v: bits(8, [[0, 0], [5, 7]]) },
          { name: "Retrain [11]", d: "lp", t: "bit", v: bits(8, [[2, 4]]) },
          { name: "Training [16]", d: "pl", t: "bit", v: bits(8, [[3, 4]]) },
          { name: "Link Status [15]", d: "pl", t: "bit", v: bits(8, [[0, 7]]) },
          { name: "Margin registers", d: "pl", t: "bus", v: ["old values", "old values", "old values", "measuring", "measuring", "new values", "new values", "new values"] }
        ],
        steps: [
          { r: [0, 1], t: "Clear Eye Margin Valid", x: "EMV = 1 means the registers hold margins from an earlier training. Software writes 1 to clear it (RW1C); hardware may now log new measurements.", s: "Table 9-66, p.506" },
          { r: [2, 4], t: "Retrain", x: "Software sets Retrain UCIe Link (bit 11). Bit 16 shows the retrain in progress while bit 15 stays 1. Hardware measures margins during the retrain.", s: "Table 9-9, p.469 · Table 9-10, p.471" },
          { r: [5, 5], t: "Retrain complete", x: "Bit 11 clears itself, bit 16 falls, and EMV sets: the margins are valid. If EMV were still 0 here, the measurement had an error.", s: "§9.5.3.40, p.505 · Table 9-66, p.506" },
          { r: [6, 7], t: "Read the margins", x: "Step Count (UHM_STS[7:0], 0 means 256) divides the UI. EML/EMR give left and right margin per lane and module relative to the PI center. Example: Step Count 32 and EML = 10 means 10/32 UI on the left.", w: "Receive margins are logged in the Tx UHM registers. For x32 Advanced Package, lanes 63:32 are reserved.", s: "Tables 9-66 to 9-68, p.506 · §9.5.3.40, p.505" }
        ]
      }
    ]
  };
})();
