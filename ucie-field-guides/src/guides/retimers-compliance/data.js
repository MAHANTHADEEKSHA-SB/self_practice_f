(function () {
  function e(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---- Retry Injection Control builder (Table 9-77) ---- */
  (function () {
    var box = document.getElementById("rib"), out = document.getElementById("ribout");
    if (!box || typeof BigInt === "undefined") return;
    var F = [
      { k: "en", name: "[0] Retry Injection Enable", lo: 0, w: 1, opts: [[1, "1: enable / start"], [0, "0: off"]] },
      { k: "typ", name: "[3:1] Error type", lo: 1, w: 3, opts: [[1, "001b: 1-bit error"], [2, "010b: 2-bit error"], [3, "011b: 3-bit error"], [0, "000b: none"]] },
      { k: "off", name: "[11:4] Byte Offset (0–255)", lo: 4, w: 8, num: 10 },
      { k: "gap", name: "[19:12] Flits between errors (0 = random 1–31)", lo: 12, w: 8, num: 50 },
      { k: "cnt", name: "[27:20] Number of errors (0 = until disabled)", lo: 20, w: 8, num: 20 },
      { k: "ft", name: "[30:28] Flit type", lo: 28, w: 3, opts: [[3, "011b: Test flits only"], [0, "000b: any flit"], [1, "001b: NOP flits only"], [2, "010b: payload (protocol or test)"], [4, "100b: payload, same sequence number"]] },
      { k: "thr", name: "[35:32] Tx Retry Error Threshold (0–15)", lo: 32, w: 4, num: 4 }
    ];
    var el = {};
    F.forEach(function (f) {
      var l = document.createElement("label"); l.textContent = f.name;
      var x;
      if (f.opts) { x = document.createElement("select"); f.opts.forEach(function (o) { var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; x.appendChild(op); }); }
      else { x = document.createElement("input"); x.type = "number"; x.min = 0; x.max = (1 << f.w) - 1; x.value = f.num; x.inputMode = "numeric"; }
      x.addEventListener("input", run); x.addEventListener("change", run);
      l.appendChild(x); box.appendChild(l); el[f.k] = x;
    });
    function run() {
      var v = BigInt(0), notes = [];
      F.forEach(function (f) {
        var n = parseInt(el[f.k].value, 10); if (isNaN(n) || n < 0) n = 0;
        var max = (1 << f.w) - 1; if (n > max) { notes.push(f.name + ": maximum is " + max + "."); n = max; }
        v = v | (BigInt(n) << BigInt(f.lo));
      });
      var hx = v.toString(16).toUpperCase(); while (hx.length < 16) hx = "0" + hx;
      var gap = +el.gap.value, cnt = +el.cnt.value, ft = +el.ft.value;
      var desc = (+el.typ.value === 0 ? "No errors will be injected." : (+el.typ.value) + "-bit error in byte " + (+el.off.value) + " of " + (ft === 0 ? "any" : ft === 1 ? "NOP" : ft === 3 ? "Test" : "payload") + " flits, " + (ft === 4 ? "repeated on the same sequence number" : (gap === 0 ? "a random 1–31 flits apart" : "every " + gap + " flits")) + ", " + (cnt === 0 ? "until disabled" : cnt + " times") + ".");
      if (+el.thr.value) desc += " More than " + (+el.thr.value) + " independent retry events sets 'Number of Retries Exceeded Threshold' and triggers Retrain on RDI.";
      out.innerHTML = "<div class=\"big\">" + hx.slice(0, 8) + "_" + hx.slice(8) + "h</div><p style=\"margin:6px 0 0\">" + e(desc) + "</p>" + notes.map(function (n) { return "<p class=\"warn\" style=\"margin:6px 0 0\">" + e(n) + "</p>"; }).join("");
    }
    run();
  })();

  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }

  window.PAGE = {
    CW: 100,
    wgroups: [["all", "All"], ["rt", "Retimers"], ["cp", "Compliance"]],
    scenarios: [
      {
        id: "pe", tab: "Parameter exchange", unit: "steps", title: "Die 0 negotiates through Retimer 0 while the far side is still resolving",
        desc: "Sideband parameter exchange between Die 0 (a Downstream Port) and Retimer 0. The order of retimer-to-retimer messages is implementation-specific and shown only as 'resolve'. Columns are steps; the Stall columns are about 4 ms apart.",
        ref: "§3.2.1.2, p.63–70 · §1.3, p.48",
        n: 7, gaps: [],
        sig: [
          { name: "Die 0 → Retimer 0", d: "sb", t: "note", v: ["AdvCap (DP=1)", "", "", "", "", "FinCap", ""] },
          { name: "Retimer 0 → Die 0", d: "sb", t: "note", v: ["", "", "AdvCap.Stall", "AdvCap.Stall", "AdvCap merged", "", ""] },
          { name: "Retimer 0 ↔ Retimer 1", d: "pl", t: "note", v: ["", "resolve", "resolve", "resolve", "done", "", ""] },
          { name: "Die 0 8 ms timer", d: "lp", t: "bus", v: ["running", "running", "reset", "reset", "stopped", "stopped", "stopped"] },
          { name: "RDI", d: "pl", t: "bus", v: ["Active", "Active", "Active", "Active", "Active", "Active", "Active"] }
        ],
        steps: [
          { r: [0, 0], t: "Die 0 advertises", x: "With RDI Active, Die 0 sends {AdvCap.Adapter} with DP = 1. Its 8 ms (−0%/+50%) parameter exchange timer runs only while RDI is Active.", s: "§3.2.1.2, p.64, p.70" },
          { r: [1, 3], t: "Retimer 0 must not answer yet", x: "It first resolves capabilities with Retimer 1 (which needs Die 1's) and merges its own. Meanwhile it sends the Stall form of {AdvCap.Adapter} once every 4 ms; each Stall resets Die 0's timer.", w: "Without Stall, a slow external link would make Die 0 time out (Adapter Timeout 0001b) and go to LinkError.", s: "§3.2.1.2, p.70" },
          { r: [4, 4], t: "Merged answer", x: "Retimer 0 sends its own {AdvCap.Adapter}: Retimer = 1, Retimer_Credits (9-bit, 256 B each), DP = 0 and UP = 0, and only capabilities that work end to end.", s: "§3.2.1.2, p.63–64" },
          { r: [5, 6], t: "Finalize", x: "Die 0, as Downstream Port, sends {FinCap.Adapter}. The Adapter LSM handshakes that follow are again resolved end to end by the retimers.", s: "§3.2.1.2, p.65 · §3.5, p.90" }
        ]
      },
      {
        id: "cr", tab: "Retimer credits", unit: "steps", title: "Die 0 spends and earns Retimer 0 credits",
        desc: "Retimer_Credits = 4 so the picture stays small (real values go up to 511). One credit = 256 B, one flit here. Columns are steps.",
        ref: "§1.3, p.48 · §4.1.2.1, Table 4-1, p.101",
        n: 10, gaps: [],
        sig: [
          { name: "Die 0 → R0 data", d: "lp", t: "bus", v: ["idle", "Flit 1", "Flit 2", "Flit 3", "Flit 4", "must wait", "must wait", "Flit 5", "idle", "idle"] },
          { name: "Die 0 credits", d: "lp", t: "bus", v: ["4", "3", "2", "1", "0", "0", "1", "0", "1", "4 (reset)"] },
          { name: "R0 → Die 0 Valid", d: "pl", t: "note", v: ["", "", "", "", "", "", "11110000b", "", "11111111b", ""] },
          { name: "R0 buffer (flits)", d: "pl", t: "bus", v: ["0", "1", "2", "3", "4", "4", "3", "4", "3", "drain/dump"] },
          { name: "RDI", d: "pl", t: "bus", v: ["Active", "Active", "Active", "Active", "Active", "Active", "Active", "Active", "Active", "Retrain"] }
        ],
        steps: [
          { r: [0, 0], t: "Start of Active", x: "Die 0's counter holds the advertised Retimer_Credits.", s: "§1.3, p.48" },
          { r: [1, 4], t: "Spend", x: "Each 256 B sent uses one credit. These credits are separate from any protocol credits.", s: "§1.3, p.48" },
          { r: [5, 5], t: "Out of credits", x: "With zero credits, Die 0 must not send anything to the retimer.", s: "§1.3, p.48" },
          { r: [6, 6], t: "Credit without data", x: "Retimer 0 forwarded a flit to Retimer 1 and frees space. With no data to send back, it frames Valid as 11110000b: no flit data + 1 credit release.", s: "Table 4-1, p.101" },
          { r: [7, 8], t: "Credit with data", x: "Die 0 sends Flit 5. Retimer 0 later sends data to Die 0 framed 11111111b: data + 1 credit. Retimer-to-die data itself is not credited.", s: "Table 4-1, p.101 · §1.3, p.48" },
          { r: [9, 9], t: "Leaving Active resets everything", x: "RDI goes to Retrain: Die 0 restores its counter to the advertised value and Retimer 0 drains or dumps its buffer before re-entering Active.", w: "Because credits are re-advertised, the first transfer after Active cannot be a credit-only frame.", s: "§1.3, p.48 · §4.1.2, p.100" }
        ]
      },
      {
        id: "vref", tab: "PHY compliance", unit: "steps", title: "Upper Rx Vref margin sweep on a DUT",
        desc: "Compliance software steps the DUT's Rx Vref up from its trained value until the point test fails. Single module shown. Columns are steps.",
        ref: "§9.5.4.5, Tables 9-78 to 9-80, p.514–517",
        n: 9, gaps: [],
        sig: [
          { name: "Software", d: "lp", t: "note", v: ["Mode ← 10b", "CompEn, Retrain", "", "Vref +1, trig", "", "Vref +2, trig", "", "Vref +3, trig", ""] },
          { name: "LTSM", d: "pl", t: "bus", v: ["ACTIVE", "PHYRETRAIN", "@PHY-Compl.", "@PHY-Compl.", "@PHY-Compl.", "@PHY-Compl.", "@PHY-Compl.", "@PHY-Compl.", "@PHY-Compl."] },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(9, [[0, 0]]) },
          { name: "Op Trigger", d: "lp", t: "bit", v: bits(9, [[3, 3], [5, 5], [7, 7]]) },
          { name: "Rx Vref Offset", d: "lp", t: "bus", v: ["0", "0", "0", "+1", "+1", "+2", "+2", "+3", "+3"] },
          { name: "Vref status", d: "pl", t: "note", v: ["", "", "", "", "10b pass", "", "10b pass", "", "11b fail"] }
        ],
        steps: [
          { r: [0, 0], t: "Adapter first", x: "Software sets Adapter Compliance Mode to 10b. It takes effect at the next RDI entry to Retrain, and it must be set before PHY compliance.", s: "Table 9-72, p.509 · §9.5.4.5, p.514" },
          { r: [1, 2], t: "Into PHY Compliance", x: "Software sets Compliance Enable (Control 1 bit 0) in every module and retrains. On PHYRETRAIN the PHY enters PHY Compliance; it does not assert pl_trdy even if RDI reaches Active.", s: "Table 9-78, p.514" },
          { r: [3, 4], t: "First step: +1", x: "Rx Vref Offset Enable = 01b (add), Offset = 1, Operation Type = 011b (Rx-initiated point training), then trigger 0→1. Errors are compared with the thresholds in Training Setup 4; under the threshold, status reads 10b.", s: "Tables 9-78, 9-80, p.515–517" },
          { r: [5, 6], t: "Step by one", x: "Software must change the offset by one from the previous value. +2 also passes.", s: "Table 9-78, p.515" },
          { r: [7, 8], t: "Fail: margin found", x: "At +3 the errors exceed a threshold, so status is 11b. The upper Vref margin is 2 steps above the trained value. Repeat with Enable = 10b (subtract) for the lower margin.", w: "11b also covers an offset beyond what the hardware supports, so check the requested value is in range.", s: "Table 9-80, p.517" }
        ]
      }
    ]
  };
})();
