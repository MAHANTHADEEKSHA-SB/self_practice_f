(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }

  /* retrain resolver (Tables 4-11, 4-12) */
  (function () {
    var a = document.getElementById("rt0"), b = document.getElementById("rt1");
    if (!a) return;
    var SEV = { "1": 0, "4": 1, "2": 2 }, NAME = { "1": "001b · no lane errors", "4": "100b · repair", "2": "010b · speed degrade" };
    var EXIT = { "1": "MBTRAIN.TXSELFCAL", "4": "MBTRAIN.REPAIR", "2": "MBTRAIN.SPEEDIDLE" };
    function upd() {
      var r = SEV[a.value] >= SEV[b.value] ? a.value : b.value;
      document.getElementById("rtout").textContent = "Both dies → " + EXIT[r];
      document.getElementById("rtwhy").textContent = "Resolved encoding " + NAME[r] + ". " +
        (a.value === b.value ? "Encodings match, so the partner simply responds with the same value." :
         "Encodings differ; both resolve to the more severe one and send it in {PHYRETRAIN.retrain start resp}.");
    }
    a.addEventListener("change", upd); b.addEventListener("change", upd); upd();
  })();

  window.PAGE = {
    CW: 70,
    wgroups: [["all", "All"], ["flow", "Flow control"], ["sb", "Sideband"], ["mb", "Mainband init"], ["mt", "Training at speed"], ["rt", "Retrain & errors"]],
    scenarios: [
      {
        id: "bringup", tab: "Full bring-up", unit: "steps", title: "From RESET to ACTIVE on one module",
        desc: "Die 0's view of a clean first training (no faults). One column per state or sub-state.",
        ref: "§4.5.3, p.131–168",
        n: 20, gaps: [],
        sig: [
          { name: "phase", d: "note", t: "note", v: seq([["RESET", 1], ["SBINIT", 3], ["MBINIT", 6], ["MBTRAIN", 8], ["LINKINIT", 1], ["ACTIVE", 1]]) },
          { name: "LTSM sub-state", d: "lp", t: "bus", v: ["RESET", "pattern", "OOR", "done", "PARAM", "CAL", "REPAIRCLK", "REPAIRVAL", "REVERSAL", "REPAIRMB", "VALVREF", "DATAVREF", "SPEEDIDLE", "TXSELFCAL", "RXCLKCAL", "VALTRAIN…", "DATATRAIN…", "LINKSPEED", "LINKINIT", "ACTIVE"] },
          { name: "sideband", d: "sb", t: "note", v: ["", "64UI clk", "Out of Reset", "done", "PARAM", "CAL done", "clk test", "valid test", "lane ID", "D2C test", "Vref", "Vref", "speed", "cal done", "clk cal", "centering", "centering", "check", "RDI Active", ""] },
          { name: "mainband", d: "note", t: "note", v: ["tri-state", "tri-state", "tri-state", "tri-state", "tri-state", "tri-state", "clock lanes", "valid lane", "Per Lane ID", "Per Lane ID", "VALTRAIN", "LFSR", "idle", "tri-state", "clock", "valid", "LFSR", "LFSR 4K UI", "quiet", "flits"] },
          { name: "data rate", d: "note", t: "note", v: seq([["—", 4], ["4 GT/s", 8], ["→ target", 1], ["target speed", 7]]) },
          { name: "pl_phyinrecenter", d: "pl", t: "bit", v: bits(20, [[1, 17]]) },
          { name: "RDI pl_state_sts", d: "pl", t: "bus", v: seq([["Reset", 19], ["Active", 1]]) }
        ],
        steps: [
          { r: [0, 0], t: "RESET: wait and settle", x: "At least 4 ms after entry, with supplies, an 800 MHz sideband clock and stable PLLs, and a training trigger such as software's Start UCIe Link Training bit or the Adapter's NOP→Active on RDI. All mainband transmitters are tri-stated.", s: "§4.5.3.1, p.132 · §4.5, p.125" },
          { r: [1, 3], t: "SBINIT: wake the control channel", x: "Send 64-UI clock pattern + 32-UI low until the partner's pattern is detected; four more iterations; exchange {SBINIT Out of Reset} (on Advanced it carries the chosen sideband pair); then {SBINIT done req/resp}.", s: "§4.5.3.2, p.133–135" },
          { r: [4, 4], t: "MBINIT.PARAM: agree the basics", x: "Swap voltage swing, maximum data rate (partner answers with the common maximum), clock mode, clock phase, Module ID and feature bits.", s: "§4.5.3.3.1, p.137–139" },
          { r: [5, 9], t: "MBINIT: calibrate, then check every lane at 4 GT/s", x: "CAL, then clock and track lanes (REPAIRCLK), the valid lane (REPAIRVAL), lane reversal with Per Lane ID patterns (REVERSALMB), and every data lane including redundant lanes (REPAIRMB), repairing or degrading as needed.", w: "Clock and valid come before data because data is sampled with one and framed by the other.", s: "§4.5.3.3.2–4.5.3.3.6, p.146–155" },
          { r: [10, 11], t: "Set receiver Vref at 4 GT/s", x: "MBTRAIN.VALVREF and DATAVREF optimize receiver reference voltage for valid and data while still at the lowest rate.", s: "§4.5.3.4.1–4.5.3.4.2, p.156–157" },
          { r: [12, 14], t: "Change speed, calibrate", x: "SPEEDIDLE switches to the negotiated rate. TXSELFCAL calibrates transmitters on their own; RXCLKCAL calibrates the receive clock (a requested free-running clock starts here).", s: "§4.5.3.4.3–4.5.3.4.5, p.158–159" },
          { r: [15, 16], t: "Center at speed", x: "Valid centering and optional Vref, then data centering, optional Vref, optional per-lane deskew, and final recentering (DATATRAINCENTER2).", s: "§4.5.3.4.6–4.5.3.4.11, p.159–164" },
          { r: [17, 17], t: "LINKSPEED: prove it", x: "A 4K UI LFSR point test at the final phase. No errors and single module: proceed to LINKINIT.", s: "§4.5.3.4.12, p.164" },
          { r: [18, 19], t: "LINKINIT, then ACTIVE", x: "The scrambler resets on LINKINIT entry; the Adapter and PHY complete the RDI Active Entry handshake; the PHY clears its copy of Start UCIe Link Training. In ACTIVE, data is scrambled.", s: "§4.5.3.5–4.5.3.6, p.168 · §10.1.6, p.534" }
        ]
      },
      {
        id: "sbinit", tab: "SBINIT with a bad bump", unit: "steps", title: "SBINIT on Advanced Package with an open CKSB",
        desc: "Die 0 leaves RESET first. Die 0's sideband clock CKSB toward Die 1 has an open bump, so Die 1 must use the redundant clock.",
        ref: "§4.5.3.2, p.133–135",
        n: 8, gaps: [],
        sig: [
          { name: "Die 0 LTSM", d: "lp", t: "bus", v: seq([["SBINIT", 7], ["MBINIT", 1]]) },
          { name: "Die 1 LTSM", d: "pl", t: "bus", v: seq([["RESET", 3], ["SBINIT", 4], ["MBINIT", 1]]) },
          { name: "Die 0 → Die 1", d: "sb", t: "note", v: ["pattern", "quiet 1 ms", "pattern", "pattern", "+4 iterations", "Out of Reset", "", "done req/resp"] },
          { name: "Die 1 → Die 0", d: "sb", t: "note", v: ["", "", "", "pattern", "+4 iterations", "Out of Reset", "", "done req/resp"] },
          { name: "Die 1 Rx: CKSB×DATASB", d: "pl", t: "bit", v: bits(8, []) },
          { name: "CKSBRD×DATASB", d: "pl", t: "bit", v: bits(8, [[3, 7]]) },
          { name: "CKSB×DATASBRD", d: "pl", t: "bit", v: bits(8, []) },
          { name: "CKSBRD×DATASBRD", d: "pl", t: "bit", v: bits(8, [[3, 7]]) },
          { name: "Die 1 sideband choice", d: "note", t: "note", v: seq([["", 4], ["Result 1010 → DATASB + CKSBRD", 4]]) }
        ],
        steps: [
          { r: [0, 2], t: "The early die keeps offering", x: "Die 0 is out of RESET; Die 1 is not. Die 0 sends 64-UI clock pattern + 32-UI low on both data lanes with both clocks, alternating 1 ms sending and 1 ms quiet. Nothing is detected yet.", s: "§4.5.3.2 steps 1 and 5, p.134" },
          { r: [3, 3], t: "Die 1 listens on four combinations", x: "Die 1 enters SBINIT and samples both incoming data lanes with both incoming clocks. With CKSB open, only the two combinations clocked by CKSBRD see 128 UI of clock pattern.", s: "§4.5.3.2 steps 2–3, p.134" },
          { r: [4, 4], t: "Detected: four more iterations, then choose", x: "Each die that detects sends four more iterations so the other side is sure to see them, then stops. Die 1's Result[3:0] = 1010b, which the priority pseudocode maps to DATASB sampled by CKSBRD.", s: "§4.5.3.2 steps 4 and 6, p.134–135" },
          { r: [5, 6], t: "Out of Reset carries the choice", x: "Both send {SBINIT Out of Reset} until they receive it. The message carries each side's chosen data/clock assignment; from now on all messages use the functional sideband.", s: "§4.5.3.2 steps 7–9, p.135" },
          { r: [7, 7], t: "Done: on to MBINIT", x: "{SBINIT done req/resp}; once a die has sent and received the response it exits to MBINIT.", s: "§4.5.3.2 step 10, p.135" }
        ]
      },
      {
        id: "linkspeed", tab: "LINKSPEED → repair", unit: "steps", title: "LINKSPEED finds a bad lane; repair and retry",
        desc: "x64 Advanced at the target speed. Lane 17 fails the final check; a redundant lane is available.",
        ref: "§4.5.3.4.12–4.5.3.4.13, p.164–168 · §4.3.1",
        n: 12, gaps: [9],
        sig: [
          { name: "LTSM", d: "lp", t: "bus", v: seq([["LINKSPEED", 5], ["REPAIR", 3], ["TXSELFCAL", 1], ["", 1], ["LINKSPEED", 1], ["LINKINIT", 1]]) },
          { name: "sideband", d: "sb", t: "note", v: ["start req/resp", "", "results", "error req/resp", "exit to repair", "init", "apply repair", "end", "done", "", "done", "RDI Active"] },
          { name: "mainband", d: "note", t: "note", v: ["", "LFSR 4K UI", "", "electrical idle", "", "", "", "", "", "", "LFSR 4K UI", ""] },
          { name: "failing lanes", d: "note", t: "note", v: ["", "lane 17", "lane 17", "lane 17", "lane 17", "lane 17", "repaired", "", "", "", "none", ""] },
          { name: "redundant lanes used", d: "note", t: "note", v: seq([["0 of 4", 6], ["1 of 4", 6]]) }
        ],
        steps: [
          { r: [0, 2], t: "Final check at speed", x: "LINKSPEED start handshake, then a Tx-initiated point test with 4K UI of LFSR at the final clock phase. The results show errors on lane 17 only.", s: "§4.5.3.4.12 steps 1–2, p.164" },
          { r: [3, 4], t: "Report and pick a fix", x: "The module idles its transmitters and sends {MBTRAIN.LINKSPEED error req}; the partner answers. One failing lane and redundant lanes available, so it sends {MBTRAIN.LINKSPEED exit to repair req}; the partner (not degrading speed) answers and both go to REPAIR.", s: "§4.5.3.4.12 step 3, p.164–165" },
          { r: [5, 7], t: "Apply repair", x: "REPAIR init, apply repair (lane 17 mapped onto a redundant lane per §4.3.1 on the transmitter; the partner applies the matching receive mapping), then REPAIR end.", s: "§4.5.3.4.13, p.167" },
          { r: [8, 9], t: "Recalibrate the repaired configuration", x: "Exit to TXSELFCAL, then RXCLKCAL through DATATRAINCENTER2 again (compressed column), because the lane mapping changed.", s: "§4.5.3.4.13 step 3, p.167" },
          { r: [10, 11], t: "Pass, then LINKINIT", x: "LINKSPEED passes with no failing lanes; the module proceeds to LINKINIT and the RDI Active handshake.", s: "§4.5.3.4.12 steps 4 and 6, p.165–166" }
        ]
      },
      {
        id: "phyretrain", tab: "PHYRETRAIN", unit: "steps", title: "Runtime retrain with different encodings",
        desc: "Both dies are in ACTIVE. Die 1's PHY detects a Valid framing error; its Runtime Link Test status says a repair is needed. Die 0's receivers are clean.",
        ref: "§4.5.3.7, p.168–171 · Tables 4-10 to 4-12, p.169",
        n: 10, gaps: [6],
        sig: [
          { name: "Die 0 RDI status", d: "pl", t: "bus", v: seq([["Active", 2], ["Retrain", 7], ["Active", 1]]) },
          { name: "Die 0 LTSM", d: "lp", t: "bus", v: seq([["ACTIVE", 2], ["PHYRETRAIN", 3], ["REPAIR", 1], ["", 1], ["LINKSPEED", 1], ["LINKINIT", 1], ["ACTIVE", 1]]) },
          { name: "Die 1 → Die 0", d: "sb", t: "note", v: ["", "Req.Retrain", "", "start req 100b", "start resp 100b", "repair msgs", "", "done", "Req/Rsp.Active", ""] },
          { name: "Die 0 → Die 1", d: "sb", t: "note", v: ["", "", "Rsp.Retrain", "start req 001b", "start resp 100b", "repair msgs", "", "done", "Req/Rsp.Active", ""] },
          { name: "encoding", d: "note", t: "note", v: ["", "", "", "001b vs 100b", "resolved 100b", "", "", "", "", ""] }
        ],
        steps: [
          { r: [0, 1], t: "Die 1 asks for a retrain", x: "Die 1's PHY sees a framing error, flags it with pl_error, stalls its Adapter and sends {LinkMgmt.RDI.Req.Retrain}.", s: "§4.5.3.7.2, p.170" },
          { r: [2, 2], t: "Die 0 joins", x: "Die 0 stalls its own Adapter, moves RDI to Retrain and replies Rsp.Retrain. Both LTSMs are in PHYRETRAIN.", s: "§4.5.3.7.3, p.171" },
          { r: [3, 4], t: "Agree the retrain type", x: "Each side sends {PHYRETRAIN.retrain start req} with its encoding. Die 0 has no lane errors (001b); Die 1 needs repair (100b). They differ, so both resolve to the more severe, 100b, and send it in the response.", w: "Each die only knows its own receive errors; taking the worse request fixes whichever direction is bad.", s: "§4.5.3.7, p.169–171 · Table 4-12, p.169" },
          { r: [5, 7], t: "REPAIR, retrain, check", x: "Both exit to MBTRAIN.REPAIR, apply repair, then run TXSELFCAL through LINKSPEED (compressed column).", s: "§4.5.3.4.13, p.167 · §4.5.3.4.12" },
          { r: [8, 9], t: "Back to Active", x: "LINKINIT and the RDI Active Entry handshake (the Adapter gives NOP→Active because Retrain was entered from Active). RDI returns to Active and Retry replays anything lost.", s: "§10.1.6, p.534 · §10.3.3.4, p.567" }
        ]
      }
    ]
  };
})();
