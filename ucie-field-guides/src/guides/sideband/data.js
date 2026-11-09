(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }

  window.PAGE = {
    CW: 92,
    dirName: { pp: "PHY ↔ PHY", aa: "Adapter ↔ Adapter", rq: "requester → completer", rh: "Retimer/device → host", mm: "MPG ↔ MPG", x: "either side" },
    dirCls: { pp: "sbc", aa: "sbc", rq: "sbc", rh: "sbc", mm: "sbc", x: "sbc" },
    groups: [["all", "All"], ["ra", "Register access"], ["lm", "Link management"], ["pe", "Parameter exchange"], ["tr", "Training"], ["err", "Errors & credits"], ["mpm", "Management & priority"]],
    sigs: [
      ["ra", "Memory / Configuration / DMS Read & Write (32b, 64b)", "rq", "request", "Register access to local or remote Adapter/PHY", "Remote only via the mailbox. DMS opcodes always target local registers.", "Table 7-1, p.269 · Table 7-6, p.273"],
      ["ra", "Completion (no data / 32b / 64b)", "rq", "completion", "Answer to a register access", "Status SC or UR; no credit needed; always sunk.", "Table 7-7, p.274 · §7.1.3.1, p.298"],
      ["lm", "{LinkMgmt.RDI.Req/Rsp.*}", "pp", "no data", "RDI state handshakes", "MsgCode 01h Req, 02h Rsp. One outstanding per MsgCode.", "Table 7-8, p.275–276"],
      ["lm", "{LinkMgmt.Adapter0/1.Req/Rsp.*}", "aa", "no data", "Adapter LSM state handshakes", "MsgCode 03h/04h stack 0, 05h/06h stack 1.", "Table 7-8, p.276–277"],
      ["lm", "{ParityFeature.Req/Ack/Nak}", "aa", "no data", "Enable runtime parity insertion", "MsgCode 07h (Req), 08h (Ack 00h, Nak 01h).", "Table 7-8, p.277 · §3.9, p.95"],
      ["pe", "{AdvCap/FinCap.Adapter}, {AdvCap/FinCap.CXL}, {MultiProt*Cap.Adapter}", "aa", "64b data", "Stage 3 parameter exchange", "DP sends FinCap; MsgInfo FFFFh = Stall.", "§7.1.2.3, p.283–284 · §3.2.1.2, p.65"],
      ["tr", "Training handshakes without data (Table 7-9)", "pp", "no data", "Enter/exit LTSM sub-states", "SBINIT done, MBINIT.*, MBTRAIN.* start/end, PHYRETRAIN, TRAINERROR Entry. Sent per module.", "§7.1.2.2, Table 7-9 · §4.7.1.1, p.178"],
      ["tr", "Training messages with data (Table 7-11)", "pp", "64b data", "Parameters and results", "MBINIT.PARAM configuration and SBFE, point-test setup and results. Sent per module.", "§7.1.2.3, Table 7-11"],
      ["err", "{ErrMsg}", "rh", "no data", "Correctable / non-fatal / fatal error report", "MsgCode 09h; subcode 00h/01h/02h. Destination is the D2D Adapter.", "Table 7-8, p.275, 277"],
      ["err", "{Nop.Crd}", "aa", "no data", "Explicit end-to-end credit return", "MsgCode 00h; MsgInfo 1–4 credits.", "Table 7-8, p.275 · §7.1.3.3, p.299"],
      ["mpm", "Management Port Messages (with / without data)", "mm", "MPM", "Management Transport over sideband", "Encapsulated MTPs, gateway capabilities, credit return, init done, PM, vendor. Per-RxQ buffers, sunk unconditionally.", "§7.1.2.4–7.1.2.5, p.291–296"],
      ["mpm", "Priority Sideband Traffic Packet", "x", "priority", "Urgent traffic that can interrupt a normal packet", "Opcode 11110b/11111b; no credit check; always accepted.", "§7.1.2.6, p.297 · §4.1.5.2"],
      ["mpm", "Vendor Defined messages", "x", "any", "Vendor extensions", "MsgCode FFh; any time after SBINIT; vendor cap on outstanding count.", "Table 7-8, p.277 · §7.1.3.3, p.299"]
    ],
    wgroups: [["all", "All"], ["arch", "Architecture"], ["int", "Integrity"], ["fc", "Flow control & timeouts"]],
    scenarios: [
      {
        id: "mailbox", tab: "Remote read via mailbox", unit: "steps", title: "Die 0 software reads a Die 1 PHY register",
        desc: "The end-to-end flow of Figure 7-15. Local FDI/RDI credit checks happen at every hop but are only noted where they matter.",
        ref: "§7.1.3.3 and Figure 7-15, p.299–300 · §7.0, p.268",
        n: 11, gaps: [],
        sig: [
          { name: "Die 0 Protocol Layer", d: "lp", t: "note", v: ["mailbox write", "done (1a)", "", "", "", "", "", "", "", "", "poll status"] },
          { name: "Die 0 Adapter", d: "lp", t: "note", v: ["", "mailbox set", "check credits", "req → RDI cfg", "", "", "", "", "", "cpl ← RDI cfg", "mailbox data"] },
          { name: "sideband wire", d: "sb", t: "note", v: ["", "", "", "", "Cfg Read →", "", "", "", "← Cpl + data", "", ""] },
          { name: "Die 1 PHY", d: "pl", t: "note", v: ["", "", "", "", "", "req → Adapter", "", "", "", "", ""] },
          { name: "Die 1 Adapter", d: "pl", t: "note", v: ["", "", "", "", "", "", "read PHY reg", "cpl → RDI cfg", "", "", ""] },
          { name: "Die 0 E2E credits", d: "note", t: "note", v: seq([["4", 3], ["3", 6], ["4 (CR bit)", 2]]) }
        ],
        steps: [
          { r: [0, 1], t: "Software writes the mailbox", x: "The Protocol Layer (on behalf of software) checks FDI credits and writes the mailbox index/control in its Adapter. The FDI access completes as soon as the mailbox register is updated (step 1a).", s: "Figure 7-15 steps 1, 1a, p.300" },
          { r: [2, 3], t: "Adapter checks two kinds of credit", x: "The Adapter needs an end-to-end credit for the remote Adapter (4 available) and a local RDI credit for the PHY, then sends the Configuration Read over RDI cfg.", s: "Figure 7-15 steps 2–3, p.300 · §7.1.3.3, p.299" },
          { r: [4, 5], t: "Across the sideband", x: "Die 0's PHY serializes the 64-bit header onto the sideband wire. Die 1's PHY checks for Adapter credits on its RDI and passes the request up.", s: "Figure 7-15 steps 4–5, p.300" },
          { r: [6, 7], t: "Die 1 answers", x: "Die 1's Adapter reads the target register (in the PHY here, over its own RDI cfg) and returns a Completion with 32 or 64 bits of data, with the CR bit set to return the end-to-end credit.", s: "Figure 7-15 steps 6–7, p.300 · Table 7-7, p.274" },
          { r: [8, 10], t: "Back to the mailbox", x: "The completion crosses the sideband and RDI without needing credits. Die 0's Adapter writes the data and status into the mailbox; software polls status to see that the read is done. The E2E credit is back to 4.", s: "Figure 7-15 steps 8–10, p.300 · §7.1.3.1, p.298" }
        ]
      },
      {
        id: "credit", tab: "RDI cfg credit loop", unit: "cycles", title: "Adapter → PHY sideband packets on a 32-bit RDI cfg bus",
        desc: "The Adapter starts with 2 credits (a design parameter). A packet with data takes 4 cycles (2 header phases + 2 data phases); a header-only message takes 2.",
        ref: "§7.1.3.1, p.298 · Table 10-1 (lp_cfg, pl_cfg_crd), p.526",
        n: 16, gaps: [],
        sig: [
          { name: "lp_cfg_vld", d: "lp", t: "bit", v: bits(16, [[1, 4], [6, 7], [11, 12]]) },
          { name: "lp_cfg[31:0]", d: "lp", t: "bus", v: ["", "A·H0", "A·H1", "A·D0", "A·D1", "", "B·H0", "B·H1", "", "", "", "C·H0", "C·H1", "", "", ""] },
          { name: "pl_cfg_crd", d: "pl", t: "bit", v: bits(16, [[10, 10], [14, 14]]) },
          { name: "Adapter credits", d: "note", t: "note", v: seq([["2", 1], ["1", 5], ["0", 4], ["1", 1], ["0", 3], ["1", 2]]) },
          { name: "note", d: "note", t: "note", v: seq([["", 8], ["C waits: no credit", 2], ["", 6]]) }
        ],
        steps: [
          { r: [1, 4], t: "Packet A: one credit for 128 bits", x: "A register write with 64 bits of data: two header phases and two data phases on the 32-bit bus. It costs one credit (2 → 1).", s: "§7.1.3.1, p.298 · §7.1.2 phase ordering, p.271" },
          { r: [6, 7], t: "Packet B: still one full credit", x: "A Link Management message has only a header, but it costs a full credit too (1 → 0).", s: "§7.1.3.1, p.298" },
          { r: [8, 10], t: "Wait for a credit return", x: "Packet C is ready but the Adapter has no credits. When the PHY has processed A, it pulses pl_cfg_crd for one cycle: one credit back.", w: "Credit returns follow the same clock-gating rules as packets, so they are never dropped by a sleeping receiver.", s: "Table 10-1 (pl_cfg_crd), p.526" },
          { r: [11, 14], t: "Packet C goes; B's credit returns", x: "C is sent (1 → 0). The PHY then frees B's buffer and returns another credit.", s: "§7.1.3.1, p.298" }
        ]
      },
      {
        id: "stall", tab: "Retimer Stall", unit: "ms", title: "A Retimer keeps a request alive with Stalls",
        desc: "Each column is 1 ms. The die sends a request; the Retimer must first resolve with its far-side partner.",
        ref: "§7.0, p.268 · §3.2.1.2, p.70 · Table 7-8, p.276",
        n: 12, gaps: [],
        sig: [
          { name: "Die → Retimer", d: "lp", t: "note", v: ["Req.Active", "", "", "", "", "", "", "", "", "", "", ""] },
          { name: "Retimer ↔ far side", d: "sb", t: "note", v: seq([["", 1], ["resolving over the external link", 9], ["", 2]]) },
          { name: "Retimer → Die", d: "pl", t: "note", v: ["", "", "", "", "Rsp (Stall)", "", "", "", "Rsp (Stall)", "", "Rsp.Active", ""] },
          { name: "die's timeout counter", d: "note", t: "note", v: ["0", "1 ms", "2 ms", "3 ms", "reset", "1 ms", "2 ms", "3 ms", "reset", "1 ms", "done", ""] }
        ],
        steps: [
          { r: [0, 0], t: "Request sent", x: "The die sends {LinkMgmt.Adapter0.Req.Active} and starts its 8 ms timer.", s: "§7.0, p.268" },
          { r: [1, 4], t: "First Stall at 4 ms", x: "The Retimer cannot answer until the far die has. At 4 ms it sends Rsp.Active with MsgInfo FFFFh (Stall); the die resets its timer.", s: "§7.0, p.268 · Table 7-8, p.276" },
          { r: [5, 8], t: "Second Stall", x: "Still resolving, so another Stall 4 ms later. Stalling at half the timeout leaves margin even on the −0% edge of the 8 ms timer.", s: "§7.0, p.268" },
          { r: [9, 10], t: "Real response", x: "The far side answered; the Retimer sends the regular Rsp.Active (MsgInfo 0000h). The Retimer must not stall forever: after a reasonable effort it escalates a link-down event instead.", s: "§7.0, p.268 · §3.5, p.90" }
        ]
      }
    ]
  };
})();
