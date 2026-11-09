(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------- flit format byte maps ---------- */
  var FMT = [
    { id: "f1", name: "1 · Raw", rows: [[["64B from Protocol Layer, passed through unchanged", 64, "p"]]],
      cap: "Raw Format: no header, no CRC, no Retry. Mandatory for Streaming; optional for the others.", ref: "§3.3.1, p.71 · Figure 3-10" },
    { id: "f2", name: "2 · 68B (3 flits + PDS)", rows: [
        [["FH", 2, "a"], ["Flit 1: 62B", 62, "p"]],
        [["2B", 2, "p"], ["CRC", 2, "a"], ["FH", 2, "a"], ["Flit 2: 58B", 58, "p"]],
        [["6B", 6, "p"], ["CRC", 2, "a"], ["FH", 2, "a"], ["Flit 3: 54B", 54, "p"]],
        [["10B", 10, "p"], ["CRC", 2, "a"], ["PDS", 2, "s"], ["50B zeros to the 64B boundary", 50, "r"]],
        [["64B zeros (required chunk 1)", 64, "r"]],
        [["64B zeros (required chunk 2)", 64, "r"]],
        [["64B zeros (pad to 256B multiple)", 64, "r"]],
        [["64B zeros (pad to 256B multiple)", 64, "r"]]],
      cap: "Each flit is 64B of payload plus a 2B header and 2B CRC, so successive flits slide 4 bytes. Before pausing, the Adapter sends a PDS header, zeros to the next 64B boundary, at least two all-zero 64B chunks, and more zeros to make the total a multiple of 256B (512B here).", ref: "§3.3.2.1, p.73 · Figures 3-11 to 3-13, p.74–75" },
    { id: "f3", name: "3 · Std 256B End Header (PCIe)", rows: [
        [["Protocol Layer: bytes 0–63", 64, "p"]], [["bytes 64–127", 64, "p"]], [["bytes 128–191", 64, "p"]],
        [["44B (to byte 235)", 44, "p"], ["FH", 2, "a"], ["DLP2–5", 4, "a"], ["10B reserved", 10, "r"], ["CRC0", 2, "a"], ["CRC1", 2, "a"]]],
      cap: "PCIe and CXL.io: DLP0–1 become the UCIe Flit Header (bytes 236–237), DLP2–5 are inserted by the Adapter. CRC0 covers bytes 0–127, CRC1 covers 128–241. Mandatory for PCIe Flit Mode.", ref: "§3.3.3, p.76 · Figure 3-14, p.77" },
    { id: "f4", name: "4 · Std 256B Start Header (CXL)", rows: [
        [["FH", 2, "a"], ["Protocol Layer: 62B", 62, "p"]], [["64B", 64, "p"]], [["64B", 64, "p"]],
        [["46B (to byte 237)", 46, "p"], ["DLP2–5", 4, "a"], ["10B reserved", 10, "r"], ["CRC0", 2, "a"], ["CRC1", 2, "a"]]],
      cap: "Header first, so the receiver learns protocol and stack from byte 0. Shown for CXL.io/PCIe (with DLP2–5); without DLP the last row carries 50B of payload. Same CRC coverage as Format 3. Mandatory for CXL 256B Flit Mode.", ref: "§3.3.3, p.76 · Figures 3-17, 3-18, p.78 · Figure 10-25, p.559" },
    { id: "f5", name: "5 · Latency-Optimized (no optional bytes)", rows: [
        [["FH", 2, "a"], ["Protocol Layer: 62B", 62, "p"]],
        [["58B", 58, "p"], ["DLP2–5", 4, "a"], ["CRC0", 2, "a"]],
        [["64B", 64, "p"]],
        [["52B", 52, "p"], ["6B reserved", 6, "r"], ["FM / OUFC", 4, "a"], ["CRC1", 2, "a"]]],
      cap: "Each 128B half has its own CRC: CRC0 (bytes 126–127) covers 0–125; CRC1 (254–255) covers 128–253. The first half can be checked and used before the second arrives. Shown for CXL.io; FM bytes carry a Flit_Marker or Optimized_Update_FC.", ref: "§3.3.4, p.80–81 · Figure 3-20, p.81" },
    { id: "f6", name: "6 · Latency-Optimized (with optional bytes)", rows: [
        [["FH", 2, "a"], ["Protocol Layer: 62B", 62, "p"]],
        [["58B", 58, "p"], ["DLP2–5", 4, "a"], ["CRC0", 2, "a"]],
        [["64B", 64, "p"]],
        [["52B", 52, "p"], ["+4B TLP", 4, "p"], ["2B", 2, "r"], ["FM / OUFC", 4, "a"], ["CRC1", 2, "a"]]],
      cap: "Same layout as Format 5, but the Protocol Layer uses bytes that Format 5 leaves reserved. Shown for CXL.io: 4 extra TLP bytes (244–247); bytes 248–249 stay 0. For CXL.cachemem the extra space becomes an additional 14-byte H-slot between slots 7 and 8. Strongly recommended for CXL 256B Flit Mode.", ref: "§3.3.4, p.80–81 · §2.2.2, p.54 · Figures 3-23 to 3-26, p.82–84" }
  ];
  var CLR = { p: "var(--lp)", a: "var(--pl)", s: "var(--sb)", r: "var(--line)" };
  function drawFmt(f) {
    var h = "<div style=\"display:grid;grid-template-columns:minmax(0,1fr);gap:4px\">";
    f.rows.forEach(function (row, ri) {
      h += "<div style=\"display:flex;align-items:stretch;gap:6px\"><span class=\"mono\" style=\"width:62px;flex:none;font-size:11px;color:var(--muted);align-self:center\">" + (ri * 64) + "–" + (ri * 64 + 63) + "</span><div style=\"display:flex;flex:1;min-width:0;border:1px solid var(--line);border-radius:6px;overflow:hidden\">";
      row.forEach(function (sg) {
        var bg = sg[2] === "r" ? "var(--bg)" : "color-mix(in srgb, " + CLR[sg[2]] + " 16%, var(--surface))";
        var bd = CLR[sg[2]];
        h += "<div title=\"" + esc(sg[0]) + " (" + sg[1] + "B)\" style=\"flex:" + sg[1] + " 0 0;min-width:0;background:" + bg + ";border-right:1px solid var(--line);box-shadow:inset 0 -3px 0 " + bd + ";padding:6px 4px;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;font-family:var(--font-mono)\">" + esc(sg[0]) + "</div>";
      });
      h += "</div></div>";
    });
    return h + "</div>";
  }
  (function () {
    var chips = document.getElementById("fmtchips"), map = document.getElementById("fmtmap"), cap = document.getElementById("fmtcap");
    if (!chips) return;
    function pick(i) {
      Array.prototype.forEach.call(chips.children, function (c, k) { c.setAttribute("aria-pressed", k === i ? "true" : "false"); });
      map.innerHTML = drawFmt(FMT[i]);
      cap.innerHTML = esc(FMT[i].cap) + "<span class=\"ref\">Spec: " + esc(FMT[i].ref) + "</span>";
    }
    FMT.forEach(function (f, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = f.name;
      b.addEventListener("click", function () { pick(i); }); chips.appendChild(b);
    });
    pick(3);
  })();

  /* ---------- truth-table resolver ---------- */
  (function () {
    var sel = document.getElementById("ttsel"), box = document.getElementById("ttbits");
    if (!sel) return;
    var TT = [
      { name: "Truth Table 1 (PCIe / CXL)", src: "Table 3-9, p.88 · bits from {FinCap.Adapter}",
        bits: ["Raw Format", "68B Flit Mode", "CXL 256B Flit Mode", "PCIe Flit Mode", "CXL_LatOpt_Fmt5", "CXL_LatOpt_Fmt6"],
        init: [0, 0, 1, 0, 0, 1],
        f: function (v) {
          if (v[0]) return ["Format 1: Raw", "Raw Format negotiated wins outright."];
          if (v[2]) { if (v[5]) return ["Format 6: Latency-Optimized with optional bytes (CXL)", "CXL 256B Flit Mode with CXL_LatOpt_Fmt6."];
                      if (v[4]) return ["Format 5: Latency-Optimized without optional bytes (CXL)", "CXL 256B Flit Mode with CXL_LatOpt_Fmt5 but not Fmt6."];
                      return ["Format 4: Standard 256B Start Header (CXL)", "CXL 256B Flit Mode with neither Latency-Optimized option."]; }
          if (v[3]) return ["Format 3: Standard 256B End Header (PCIe)", "PCIe Flit Mode, CXL 256B Flit Mode not set."];
          if (v[1]) return ["Format 2: 68B Flit", "Only 68B Flit Mode is set (CXL 68B or PCIe Non-Flit, max rate ≤ 32 GT/s)."];
          return ["No valid format", "Nothing negotiated. The Adapter takes the link down and reports the error if applicable."];
        } },
      { name: "Truth Table 2 (Streaming, Enhanced Multi-Protocol, PCIe extras)", src: "Table 3-10 and notes, p.88 · AND of sent and received {AdvCap.Adapter}, or {FinCap.Adapter} bits",
        bits: ["Raw Format", "68B Flit Format", "Std 256B End Header", "Std 256B Start Header", "LatOpt 256B without optional bytes", "LatOpt 256B with optional bytes"],
        init: [0, 1, 1, 1, 1, 0],
        f: function (v) {
          if (v[0]) return ["Format 1: Raw", "Raw is advertised only when it is the required mode, so it has top priority."];
          if (v[5]) return ["Format 6", "Highest priority among flit formats: best performance."];
          if (v[3]) return ["Format 4", "Start Header beats End Header: the receiver sees protocol and stack in the first bytes, lowering Adapter latency when multiplexing."];
          if (v[2]) return ["Format 3", "End Header, chosen because Format 4 and Format 6 are not both available."];
          if (v[1]) return ["Format 2: 68B", "No 256B Standard format and no Format 6 in common."];
          if (v[4]) return ["Format 5", "Lowest priority: the most overhead of the 256B formats."];
          return ["No valid format", "Either side may take the link to LinkError if the desired format is not negotiated."];
        } }
    ];
    var cur = 0, vals;
    function render() {
      var t = TT[cur]; box.innerHTML = "";
      t.bits.forEach(function (b, i) {
        var l = document.createElement("label"); l.style.display = "flex"; l.style.gap = "8px"; l.style.alignItems = "center"; l.style.cursor = "pointer";
        var c = document.createElement("input"); c.type = "checkbox"; c.checked = !!vals[i];
        c.addEventListener("change", function () { vals[i] = c.checked ? 1 : 0; out(); });
        l.appendChild(c); l.appendChild(document.createTextNode(b)); box.appendChild(l);
      });
      out();
    }
    function out() { var r = TT[cur].f(vals); document.getElementById("ttout").textContent = r[0]; document.getElementById("ttwhy").textContent = r[1]; document.getElementById("ttsrc").innerHTML = "<span class=\"sl\">Spec</span>" + esc(TT[cur].src); }
    TT.forEach(function (t, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = t.name;
      b.addEventListener("click", function () { cur = i; vals = t.init.slice(); Array.prototype.forEach.call(sel.children, function (c, k) { c.setAttribute("aria-pressed", k === i ? "true" : "false"); }); render(); });
      sel.appendChild(b);
    });
    sel.children[0].setAttribute("aria-pressed", "true"); vals = TT[0].init.slice(); render();
  })();

  window.PAGE = {
    CW: 56,
    dirName: { both: "both Adapters", dp: "DP Adapter", up: "UP Adapter", tx: "parity sender", rx: "parity receiver", any: "Retimer or device die" },
    dirCls: { both: "sbc", dp: "sbc", up: "sbc", tx: "sbc", rx: "sbc", any: "sbc" },
    groups: [["all", "All"], ["neg", "Negotiation"], ["lsm", "Adapter LSM"], ["par", "Parity"], ["err", "Errors & credits"]],
    sigs: [
      ["neg", "{AdvCap.Adapter}", "both", "64-bit data", "Advertise capabilities (Table 3-1 bits 0–31)", "PCIe/CXL: DP first, UP after reading it. MsgInfo FFFFh = Stall.", "§3.2.1.2, p.65 · p.283"],
      ["neg", "{FinCap.Adapter}", "dp", "64-bit data", "Finalized Adapter configuration", "Msgcode 02h / 00h. Not sent for Streaming or Management-only.", "§3.2.1.2, p.65 · p.283"],
      ["neg", "{AdvCap.CXL}", "both", "64-bit data", "CXL/PCIe details (Flexbus-mode bits)", "Msgcode 01h / 01h. MsgInfo 0000h Stack 0, 0001h Stack 1, FFFFh Stall.", "§3.2.1.2, p.65 · p.284"],
      ["neg", "{FinCap.CXL}", "dp", "64-bit data", "Finalized CXL/PCIe details", "Msgcode 02h / 01h. Exactly one of CXL.io or PCIe set.", "§3.2.1.2, p.65 · §3.4 note, p.87 · p.284"],
      ["neg", "{MultiProtAdvCap.Adapter} / {MultiProtFinCap.Adapter}", "both", "data", "Stack 1 protocol with Enhanced Multi-Protocol", "Same DP-first rule as Stack 0.", "§3.2.1.2, p.67"],
      ["lsm", "{LinkMgmt.Adapter0.Req.*}", "both", "no data", "Stack 0 Adapter LSM state request", "Msgcode 03h; subcode 01h Active, 04h L1, 08h L2, 09h LinkReset, 0Ch Disable. Req.Active MsgInfo FFFFh = Stall.", "Table 7-8, p.276"],
      ["lsm", "{LinkMgmt.Adapter0.Rsp.*}", "both", "no data", "Stack 0 Adapter LSM response", "Msgcode 04h; subcode 01h Active, 02h PMNAK, 04h L1, 08h L2, 09h LinkReset, 0Ch Disable.", "Table 7-8, p.276"],
      ["lsm", "{LinkMgmt.Adapter1.Req.*} / {…Rsp.*}", "both", "no data", "Stack 1 Adapter LSM request / response", "Msgcode 05h (Req) / 06h (Rsp); same subcodes as Stack 0.", "Table 7-8, p.276–277"],
      ["par", "{ParityFeature.Req}", "tx", "no data", "Ask to start inserting parity bytes", "Msgcode 07h / 00h. Sent in Retrain or L1.", "Table 7-8, p.277 · §3.9, p.95"],
      ["par", "{ParityFeature.Ack} / {ParityFeature.Nak}", "rx", "no data", "Receiver ready / not ready", "Msgcode 08h; subcode 00h Ack, 01h Nak. Nak is logged by the requester.", "Table 7-8, p.277 · §3.9, p.96"],
      ["err", "{ErrMsg}", "any", "no data", "Error reporting toward the host", "Msgcode 09h; subcode 00h correctable, 01h non-fatal, 02h fatal. Destination is the D2D Adapter.", "Table 7-8, p.275, 277"],
      ["err", "{Nop.Crd}", "both", "no data", "Explicit end-to-end credit return", "Msgcode 00h / 00h; MsgInfo 1–4 credits. Destination is the D2D Adapter.", "Table 7-8, p.275"]
    ],
    wgroups: [["all", "All"], ["neg", "Negotiation"], ["fmt", "Flit formats"], ["crc", "CRC & Retry"], ["mux", "Stack mux"], ["pm", "States & PM"], ["par", "Runtime parity"]],
    scenarios: [
      {
        id: "param", tab: "Parameter exchange", unit: "steps", title: "Stage 3 for a CXL link: DP and UP negotiate",
        desc: "Sideband traffic between the two Adapters after RDI has reached Active. Each column is one step, not a fixed time.",
        ref: "§3.2.1, p.62–70 · Figure 3-4, p.66 · §10.2.8, p.553",
        n: 18, gaps: [],
        sig: [
          { name: "RDI pl_state_sts", d: "pl", t: "bus", v: seq([["Active", 18]]) },
          { name: "DP → UP (sideband)", d: "sb", t: "note", v: seq([["", 1], ["AdvCap.Adapter", 2], ["", 2], ["FinCap.Adapter", 2], ["AdvCap.CXL", 2], ["", 2], ["FinCap.CXL", 2], ["", 1], ["Adapter0.Req.Active", 2], ["Rsp.Active", 1], ["", 1]]) },
          { name: "UP → DP (sideband)", d: "sb", t: "note", v: seq([["", 3], ["AdvCap.Adapter", 2], ["", 4], ["AdvCap.CXL", 2], ["", 3], ["Adapter0.Req.Active", 2], ["Rsp.Active", 1], ["", 1]]) },
          { name: "exchange timer (8 ms)", d: "note", t: "note", v: seq([["counting: RDI Active, no Stall", 13], ["stopped", 5]]) },
          { name: "FDI pl_inband_pres", d: "pl", t: "bit", v: bits(18, [[13, 17]]) },
          { name: "FDI pl_state_sts", d: "pl", t: "bus", v: seq([["Reset", 17], ["Active", 1]]) },
          { name: "mainband", d: "note", t: "note", v: seq([["", 17], ["SNH", 1]]) }
        ],
        steps: [
          { r: [0, 2], t: "The Downstream Port advertises first", x: "Stage 2 is complete: RDI is Active and the 8 ms parameter-exchange timer starts. The DP Adapter sends {AdvCap.Adapter} with its capability bits: protocols, Retry, stack enables, Latency-Optimized options, DP role.", s: "§3.2.1, p.62 · §3.2.1.2, p.65 · p.283" },
          { r: [3, 4], t: "The Upstream Port reviews and answers", x: "The UP waited for the DP's message, read it, and may adjust its own advertisement before sending {AdvCap.Adapter}.", w: "Only one side decides, so the two dies can never finalize different configurations.", s: "§3.2.1.2, p.65" },
          { r: [5, 6], t: "The DP finalizes", x: "The DP sends {FinCap.Adapter}. A bit is set where both sides advertised it, subject to the stack and Retry rules: Retry is on only if both advertised it and Raw Format was not negotiated.", s: "§3.2.1.2, p.65–67" },
          { r: [7, 12], t: "CXL details", x: "Because FinCap.Adapter set CXL 256B Flit Mode (or 68B Flit Mode), a second round runs: {AdvCap.CXL} both ways, then the DP's {FinCap.CXL}. Its CXL.io and PCIe bits decide CXL vs PCIe; Tables 3-8 and 3-9 then give the protocol and flit format.", s: "§3.2.1.2, p.65 · Tables 3-8, 3-9, p.86–88 · Table 9-42" },
          { r: [13, 13], t: "Report to the Protocol Layer", x: "Parameter exchange finished well inside 8 ms, so the timer stops. The Adapter drives pl_protocol, pl_protocol_flitfmt and pl_protocol_vld on FDI and raises pl_inband_pres.", s: "§3.2.1.3, p.70 · Table 10-3, p.542–544" },
          { r: [14, 17], t: "FDI bring-up, then the Sequence Number Handshake", x: "Each Protocol Layer requests Active; the Adapters exchange {LinkMgmt.Adapter0.Req.Active} and Rsp.Active; FDI goes Active. The first flits on the mainband complete the Sequence Number Handshake, using NOP flits if there is no payload.", s: "§3.2.1.3, p.70 · §10.2.8, p.553–555 · §3.8, p.94" }
        ]
      },
      {
        id: "retry", tab: "CRC error and replay", unit: "flit slots", title: "Retry: a CRC error on #12, Nak, replay, and an idle timeout",
        desc: "256B flits on a link where each slot is one Flit Time (2 ns at x64 16 GT/s). S = flit carries its own sequence number; Ack, A n = flit carries an Ack (up to n); N n = Nak (replay from n+1).",
        ref: "§3.8, p.93–94 · Table 3-5, p.80–81",
        n: 20, gaps: [18],
        sig: [
          { name: "Die 0 → Die 1", d: "lp", t: "bus", v: ["#10·S", "#11·Ack", "#12·S", "#13·Ack", "#14·S", "#15·Ack", "#16·S", "#12·S", "#13·Ack", "#14·S", "#15·Ack", "#16·S", "#17·Ack", "#18·S", "", "", "", "", "", "#18·S"] },
          { name: "Die 1 CRC / seq check", d: "note", t: "note", v: ["ok 10", "ok 11", "✗ 12", "drop 13", "drop 14", "drop 15", "drop 16", "ok 12", "ok 13", "ok 14", "ok 15", "ok 16", "ok 17", "ok 18", "", "", "", "", "", "dup 18"] },
          { name: "Die 1 → FDI", d: "note", t: "note", v: ["#10", "#11", "#12", "cancel", "", "", "", "#12", "#13", "#14", "#15", "#16", "#17", "#18", "", "", "", "", "", ""] },
          { name: "Die 1 → Die 0", d: "pl", t: "bus", v: ["#40·S", "#41·A10", "#42·S", "#43·N11", "#44·S", "#45·S", "#46·S", "#47·S", "#48·S", "#49·A13", "#50·S", "#51·A15", "#52·S", "#53·A17", "", "", "", "", "", "#54·A18"] },
          { name: "Die 0 retry buffer", d: "note", t: "note", v: ["10", "10–11", "10–12", "10–13", "11–14", "11–15", "12–16", "12–16", "12–16", "12–16", "12–16", "14–16", "14–17", "16–18", "16–18", "18", "18", "18", "18", "18"] },
          { name: "replay timer", d: "note", t: "note", v: seq([["", 14], ["idle: +1 per Flit Time", 4], ["", 1], ["≥ 375", 1]]) }
        ],
        steps: [
          { r: [0, 1], t: "Explicit and Ack flits alternate", x: "Die 0's flit headers alternate between the flit's own sequence number (S) and an Ack for Die 1's traffic. PCIe would send three explicit-sequence flits first; UCIe alternates so Acks flow back sooner.", s: "§3.8, p.93 · Table 3-5, p.80–81" },
          { r: [2, 3], t: "CRC fails on #12", x: "#12 is corrupted on the wire. Die 1's Adapter had already started passing it up FDI, so it cancels it with pl_flit_cancel. It sends a Nak whose header carries S = 11 (N−1, for N = 12).", s: "§3.7, p.92 · Table 3-5 Ack/Nak encoding, p.81 · Table 10-3 (pl_flit_cancel), p.542" },
          { r: [3, 6], t: "Drop everything until the replay", x: "Die 1 drops #13–#16 even though they are good: UCIe has no receive retry buffer and no selective Nak. With nothing to acknowledge, Die 1 may send consecutive explicit-sequence flits.", w: "Go-back-N keeps every receiver simple; at BER 1e-15 or better replays are rare.", s: "§3.8, p.93" },
          { r: [6, 7], t: "Purge, then replay from #12", x: "Die 0 processes Nak 11: flits up to #11 are acknowledged and purged, and #12–#16 are replayed, starting with an explicit sequence number so Die 1 can line up. In 68B format a PDS would come first so the replay starts 256B-aligned.", s: "§3.8, p.93 · §3.3.2.1, p.73" },
          { r: [7, 13], t: "Back in order; the buffer drains", x: "Die 1 accepts #12 onward and forwards them; its Acks free Die 0's retry buffer. Die 0 can now send new flits #17 and #18.", s: "§3.8, p.93–94" },
          { r: [14, 19], t: "Idle with #18 unacknowledged", x: "Die 1 goes quiet after Ack 17, so #18 is never acknowledged. No NOPs are being sent, but REPLAY_TIMEOUT_FLIT_COUNT still adds one per idle Flit Time. At ≥ 375 Die 0 replays #18; Die 1 sees a duplicate, drops it, and sends Ack 18.", w: "This is the spec's Implementation Note case. Sending a second Ack before going quiet avoids the 750 ns wait.", s: "§3.8 and Implementation Note, p.93–94" }
        ]
      },
      {
        id: "mux", tab: "Two stacks (Multi_Protocol)", unit: "flit slots", title: "Multi_Protocol_Enable: alternate stacks, fill with NOPs",
        desc: "Two identical stacks share the link. Stack 0 always has data; stack 1 has three flits. Each slot is one flit on the link.",
        ref: "§3.1, p.59",
        n: 16, gaps: [],
        sig: [
          { name: "stack 0 has data", d: "lp", t: "bit", v: bits(16, [[0, 15]]) },
          { name: "stack 1 has data", d: "lp", t: "bit", v: bits(16, [[3, 7]]) },
          { name: "link flit", d: "pl", t: "bus", v: ["S0·a", "NOP", "S0·b", "S1·x", "S0·c", "S1·y", "S0·d", "S1·z", "S0·e", "NOP", "S0·f", "NOP", "S0·e", "NOP", "S0·f", "NOP"] },
          { name: "header stack bit", d: "note", t: "note", v: ["0", "—", "0", "1", "0", "1", "0", "1", "0", "—", "0", "—", "0", "—", "0", "—"] },
          { name: "receiver delivers to", d: "note", t: "note", v: ["stack 0", "drop", "stack 0", "stack 1", "stack 0", "stack 1", "stack 0", "stack 1", "stack 0", "drop", "stack 0", "drop", "stack 0", "drop", "stack 0", "drop"] },
          { name: "event", d: "note", t: "note", v: seq([["", 11], ["Nak for S0·e", 1], ["replay keeps alternating", 4]]) }
        ],
        steps: [
          { r: [0, 2], t: "One busy stack still alternates", x: "Only stack 0 has traffic. With Multi_Protocol_Enable each stack gets at most half the link, so the Adapter never sends two stack-0 flits in a row. It fills the gap with a NOP flit: Protocol ID 00b, all-zero body, not stored in the retry buffer, dropped by the receiver.", s: "§3.1, p.59" },
          { r: [3, 7], t: "Both stacks interleave", x: "Stack 1 has three flits, so the link alternates 0, 1, 0, 1. The stack ID bit in each flit header tells the receiving Adapter which FDI to deliver to.", s: "§3.1, p.59 · Table 3-5 (Byte 0 bit 5), p.80" },
          { r: [8, 11], t: "Back to NOP padding", x: "No fixed pattern is required: stack 0, NOP, stack 0 is as valid as stack 0, stack 1, stack 0.", s: "§3.1, p.59" },
          { r: [12, 15], t: "Replays must alternate too", x: "A Nak causes S0·e and S0·f to be replayed from the shared retry buffer. The Adapter must still insert NOPs between them.", w: "The receiving stack was built for half the link rate; back-to-back replayed flits would overrun it.", s: "§3.1, p.59 · §3.8, p.93" }
        ]
      },
      {
        id: "pm", tab: "PM entry (CXL)", unit: "steps", title: "Hierarchical PM entry for a CXL stack",
        desc: "From the vLSMs down to the PHY. Each column is one step, not a fixed time.",
        ref: "§3.6 and Figure 3-28, p.90–91",
        n: 14, gaps: [],
        sig: [
          { name: "mainband", d: "note", t: "note", v: seq([["ALMP PM req/rsp", 3], ["Acks drain", 2], ["", 9]]) },
          { name: "vLSM CXL.io", d: "lp", t: "bus", v: seq([["Active", 1], ["L1", 13]]) },
          { name: "vLSM CXL.cachemem", d: "lp", t: "bus", v: seq([["Active", 2], ["L1", 12]]) },
          { name: "retry buffer", d: "note", t: "note", v: seq([["holding ALMPs", 4], ["empty", 10]]) },
          { name: "Adapter LSM (stack 0)", d: "pl", t: "bus", v: seq([["Active", 7], ["L1", 7]]) },
          { name: "sideband", d: "sb", t: "note", v: seq([["", 5], ["Adapter0 Req/Rsp.L1", 2], ["", 1], ["RDI Req/Rsp.L1", 3], ["", 3]]) },
          { name: "RDI pl_state_sts", d: "pl", t: "bus", v: seq([["Active", 11], ["L1", 3]]) },
          { name: "PHY", d: "note", t: "note", v: seq([["", 11], ["mainband off, sideband on", 3]]) }
        ],
        steps: [
          { r: [0, 2], t: "vLSMs first, on the mainband", x: "Both CXL vLSMs negotiate L1 with ALMPs. ALMPs travel as flits through the retry buffer, so they are protected by CRC and replay. CXL 68B over UCIe uses the 256B-mode ALMP formats and flows.", s: "§3.6, p.90–91 · Figure 3-28, p.91" },
          { r: [3, 4], t: "Empty the retry buffer", x: "The Adapter LSM may start its PM handshake only when both vLSMs are in PM and the retry buffer is empty: every ALMP acknowledged.", s: "Figure 3-28, p.91 · §10.1.7, p.535" },
          { r: [5, 7], t: "Adapter LSM on sideband", x: "The Adapters coordinate the Adapter LSM's L1 entry with {LinkMgmt.Adapter0.Req/Rsp.L1}. With two stacks, each Adapter LSM does this on its own.", s: "§3.6 step 2, p.91 · Table 7-8, p.276" },
          { r: [8, 11], t: "RDI last", x: "With every Adapter LSM in PM, the Adapter requests L1 on RDI and the PHYs exchange {LinkMgmt.RDI.Req/Rsp.L1}.", s: "§3.6 step 3, p.91 · §10.1.7, p.535" },
          { r: [11, 13], t: "PHY powers down; the sideband stays", x: "The PHY may enter a deeper power state; the sideband must stay up because PM exit starts there. Exit runs in reverse: PHY retrain, RDI Active, Adapter LSM Active, then ALMPs for the vLSMs.", s: "§3.6, p.91" }
        ]
      }
    ]
  };
})();
