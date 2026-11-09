(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }

  window.PAGE = {
    dirName: { lp: "Adapter", pl: "PHY", both: "both", mp: "Mgmt gateway", pm: "PHY" },
    dirCls: { both: "", mp: "lp", pm: "pl" },
    groups: [["all", "All"], ["tx", "Tx data"], ["rx", "Rx data"], ["state", "State"], ["info", "Link info"], ["err", "Errors"], ["hs", "Handshakes"], ["cfg", "Sideband"], ["misc", "Other"], ["mpm", "Mgmt transport (Table 10-2)"]],
    sigs: [
      ["tx", "lp_irdy", "lp", "level", "Adapter has, or will soon have, data", "May rise before lp_valid as an early wake hint. Not driven in Reset (except a few clocks after LinkError→Reset); the PHY ignores it in Reset.", "Table 10-1, p.522 · §10.1.5, p.533"],
      ["tx", "lp_valid", "lp", "level", "lp_data carries valid bytes", "Never drops inside a flit. A beat moves when lp_irdy, lp_valid and pl_trdy are all high.", "Table 10-1, p.522 · §10.1.4, p.532"],
      ["tx", "lp_data[NBYTES-1:0][7:0]", "lp", "bus", "Transmit bytes; flit byte 0 on byte 0", "Final flit bytes, including Flit Header, CRC and PDS for 68B formats. A 256B flit is 4 beats on a 64B RDI.", "Table 10-1, p.522 · §10.3.1, p.559–561"],
      ["tx", "pl_trdy", "pl", "level", "PHY can accept a beat", "Only in Active, or during a LinkError stall drain. May drop on any cycle; no pattern is promised.", "Table 10-1, p.522 · §10.1.4, p.532"],
      ["rx", "pl_valid", "pl", "level", "pl_data carries valid bytes", "No backpressure. Bubbles allowed inside a flit.", "Table 10-1, p.522 · §10.1.4, p.532"],
      ["rx", "pl_data[NBYTES-1:0][7:0]", "pl", "bus", "Received bytes", "On RDIs wider than 256B, a partial accumulation sits on the low bytes with zeros above.", "Table 10-1, p.522 · §10.3.1, p.562"],
      ["state", "lp_state_req[3:0]", "lp", "level", "Requested next state", "Out of Reset, and out of a Retrain entered from Active, the PHY needs a NOP→Active edge. Held while a PM request is unresolved.", "Table 10-1, p.523 · Table 10-4, p.565 · §10.1.7, p.535"],
      ["state", "lp_linkerror", "lp", "level", "Take the link down now", "PHY goes to LinkError and stays while it is high. Adapter ORs FDI lp_linkerror with its own fatal errors.", "Table 10-1, p.523 · §10.3.3.7, p.568"],
      ["state", "pl_state_sts[3:0]", "pl", "level", "Current RDI state", "Moves only after the matching sideband handshake, or on its own for framing errors, remote requests and fatal errors.", "Table 10-1, p.523 · §10.1.5, p.533"],
      ["info", "pl_inband_pres", "pl", "level", "Link trained; ready for RDI Active", "Rises at LINKINIT with a pl_clk_req handshake. Stays 1 until the LTSM goes to TrainError or Reset.", "Table 10-1, p.523 · §10.1.3.2 rule 5, p.531"],
      ["info", "pl_phyinrecenter", "pl", "level", "PHY is training or retraining", "Can drive the Link Training/Retraining status bit. Needs a clk handshake if raised in a gated state.", "Table 10-1, p.525"],
      ["info", "pl_speedmode[2:0]", "pl", "level", "Current data rate, 4 to 64 GT/s", "Meaningful only in Active or Retrain. All modules run at the same speed.", "Table 10-1, p.525"],
      ["info", "pl_max_speedmode", "pl", "level", "Negotiated maximum above 32 GT/s?", "Settled in MBINIT.PARAM; changes only in Reset. Read at Reset→Active, before parameter exchange.", "Table 10-1, p.525"],
      ["info", "pl_lnk_cfg[2:0]", "pl", "level", "Total width over all active modules", "Meaningful only in Active or Retrain; re-read it after every retrain.", "Table 10-1, p.525"],
      ["err", "pl_error", "pl", "pulse", "Framing error, pipeline-matched to the data", "Only in Active. With pl_valid in the same cycle, the Adapter discards that flit. A retrain follows.", "Table 10-1, p.524 · §4.5.3.7.2, p.170"],
      ["err", "pl_cerror", "pl", "pulse", "Correctable error that does not affect data", "Any state; clk handshake first if gated. ORed with pl_error for logging when Retry is enabled.", "Table 10-1, p.524"],
      ["err", "pl_nferror", "pl", "pulse", "Non-fatal error (implementation-specific)", "No architected PHY source. Adapter treats it like a remote Non-Fatal ErrMsg.", "Table 10-1, p.524"],
      ["err", "pl_trainerror", "pl", "level", "Fatal PHY error", "Status goes to LinkError; the signal holds until LinkError → Reset.", "Table 10-1, p.524 · §4.5.3.8, p.171"],
      ["hs", "pl_stallreq / lp_stallack", "both", "4-phase", "Stop Tx at a clean boundary", "Required on every Active exit except LinkError. Ack on a free-running clock is strongly recommended.", "Table 10-1, p.525 · §10.3.2, p.563"],
      ["hs", "lp_wake_req / pl_wake_ack", "both", "4-phase", "Adapter wakes the PHY's clocks", "Before state changes out of gated states and before lp_cfg. Request is asynchronous to the PHY's lclk.", "Table 10-1, p.525–526 · §10.1.3.1, p.530"],
      ["hs", "pl_clk_req / lp_clk_ack", "both", "4-phase", "PHY wakes the Adapter's clocks", "For pl_inband_pres, error pulses, PM exit, pl_cfg packets, LinkError from Reset or PM.", "Table 10-1, p.525 · §10.1.3.2, p.530–531"],
      ["cfg", "lp_cfg[NC-1:0] / lp_cfg_vld", "lp", "bus", "Sideband packets, Adapter → PHY (NC = 8, 16, 32)", "Wait for pl_wake_ack first. Register writes are atomic regardless of NC.", "Table 10-1, p.526"],
      ["cfg", "pl_cfg[NC-1:0] / pl_cfg_vld", "pl", "bus", "Sideband packets, PHY → Adapter", "Wait for lp_clk_ack first.", "Table 10-1, p.526"],
      ["cfg", "lp_cfg_crd / pl_cfg_crd", "both", "pulse", "Credit returns for the other side's packets", "1 credit = 64-bit header + 64-bit data. No initial credits returned; follow wake rules.", "Table 10-1, p.526 · §7.1.3.1"],
      ["misc", "lclk", "both", "clock", "The RDI clock", "One clock domain for both sides.", "Table 10-1, p.522 · §10.1.2, p.529"],
      ["misc", "lp_retimer_crd", "lp", "pulse", "Adapter returns a 256B Retimer-buffer credit", "Only on Retimer dies.", "Table 10-1, p.522"],
      ["misc", "pl_retimer_crd", "pl", "pulse", "Retimer returns a 256B credit to the Adapter", "Only if the partner is a Retimer. Counter resets on Retrain entry.", "Table 10-1, p.523 · §10.3.3.4, p.566"],
      ["misc", "lp_ / pl_vendor_defined[VS-1:0]", "both", "any", "Optional vendor signals", "Raw Format example: one bit per 8 UI per module via TXVLD/RXVLD encodings.", "Table 10-1, p.526 · §10.3.4, p.572"],
      ["mpm", "pm_param_done", "pm", "2-clk pulse", "Management negotiation in MBINIT.PARAM finished", "Asserts even if the partner has no support. Deliver only after mp_clk_ack.", "Table 10-2, p.527, 529"],
      ["mpm", "pm_param_local_count / _remote_count", "pm", "bus", "Modules that negotiated management transport, Tx / Rx", "Sample with pm_param_done.", "Table 10-2, p.527"],
      ["mpm", "mp_mgmt_init_start", "mp", "2-clk pulse", "Start management negotiation on sideband", "Forces the LTSM to RESET; can take the mainband down. mp_mgmt_up must be low.", "Table 10-2, p.527"],
      ["mpm", "mp_mgmt_init_done / mp_mgmt_up", "mp", "pulse + level", "Management init finished; succeeded?", "Lets the PHY move past MBINIT.PARAM; sets SB_MGMT_UP.", "Table 10-2, p.527"],
      ["mpm", "mp_mgmt_port_gateway_ready / mp_stall_after_mbinit_param", "mp", "level", "Gateway ready; hold Rx training at MBINIT.PARAM", "Stall uses the {MBINIT.PARAM SBFE resp} stall encoding.", "Table 10-2, p.527"],
      ["mpm", "mp_mgmt_pkt / pm_mgmt_pkt", "both", "with data", "This transfer is an MPM (1) or link management (0)", "Steers to the right credit buffer or RxQ.", "Table 10-2, p.529"],
      ["mpm", "mp_rxqid / pm_rxqid", "both", "bus", "Receive-queue ID of the message", "Fixed mapping between RxQ-ID and a physical sideband link.", "Table 10-2, p.528"],
      ["mpm", "pm_cfg_credit[N-1:0]", "pm", "pulse", "Credits for MPM buffers, 64 bits each", "One per RxQ-ID. No initial credits returned.", "Table 10-2, p.528"],
      ["mpm", "mp_wake_req / pm_wake_ack · pm_clk_req / mp_clk_ack", "both", "4-phase", "Clock-gating handshakes for the management path", "Independent of RDI state.", "Table 10-2, p.528–529"],
      ["mpm", "Mgmt_clk · pm_so · pm_fatal_error · mp_fatal_error", "both", "misc", "Optional clock; SO mode; sideband fatal error; gateway forces TRAINERROR", "mp_fatal_error is a 2-clock pulse; pm_fatal_error clears on Management Reset.", "Table 10-2, p.529"]
    ],
    wgroups: [["all", "All"], ["width", "Clocking & width"], ["tx", "Tx path"], ["rx", "Rx path & errors"], ["state", "State control"], ["pm", "Power management"], ["hs", "Handshakes & clock gating"], ["err", "Errors & link-down"], ["mpm", "Management transport"]],
    minis: [
      { title: "wake: Adapter wakes the PHY", tag: "lp_wake_req / pl_wake_ack", ref: "§10.1.3.1, p.530",
        text: "Needed before any lp_cfg packet and before a state request out of a gated state. For lp_cfg the Adapter waits for the ack, because one packet spans several cycles; for lp_state_req it may change the request at once. The request falls before the ack.",
        w: { n: 12, aria: "wake handshake", sig: [
          { name: "lp_wake_req", d: "lp", t: "bit", v: bits(12, [[1, 7]]) },
          { name: "pl_wake_ack", d: "pl", t: "bit", v: bits(12, [[3, 8]]) },
          { name: "lp_cfg_vld", d: "lp", t: "bit", v: bits(12, [[4, 6]]) } ] } },
      { title: "clk: PHY wakes the Adapter", tag: "pl_clk_req / lp_clk_ack", ref: "§10.1.3.2, p.530–531",
        text: "Makes sure a sleeping Adapter sees level changes (pl_inband_pres, Retrain status on PM exit), error pulses and pl_cfg packets. pl_inband_pres may rise before the ack, but it is guaranteed seen only once the handshake completes.",
        w: { n: 10, aria: "clk handshake", sig: [
          { name: "pl_clk_req", d: "pl", t: "bit", v: bits(10, [[1, 5]]) },
          { name: "lp_clk_ack", d: "lp", t: "bit", v: bits(10, [[3, 6]]) },
          { name: "pl_inband_pres", d: "pl", t: "bit", v: bits(10, [[2, 9]]) } ] } },
      { title: "stall: quiet the Adapter before leaving Active", tag: "pl_stallreq / lp_stallack", ref: "§10.3.2, p.563–565",
        text: "Used on every Active exit except LinkError. Beats offered before the ack must still be accepted; after the ack, lp_valid and lp_irdy stay low. Here the PHY updates status after the ack, then drops stallreq (the first of the two orderings in the Implementation Note).",
        w: { n: 10, aria: "stallreq handshake", sig: [
          { name: "pl_stallreq", d: "pl", t: "bit", v: bits(10, [[1, 5]]) },
          { name: "lp_stallack", d: "lp", t: "bit", v: bits(10, [[3, 6]]) },
          { name: "lp_valid", d: "lp", t: "bit", v: bits(10, [[0, 2]]) },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(10, [[0, 2]]) },
          { name: "pl_state_sts", d: "pl", t: "bus", v: seq([["Active", 4], ["Retrain", 6]]) } ] } }
    ],
    scenarios: [
      {
        id: "bringup", tab: "Bring-up", title: "Bring-up: end of Stage 2, RDI Reset → Active",
        desc: "Die 0's view as the LTSM finishes training. The PHY announces the trained link, the Adapter asks for Active, and the two PHYs complete the Active Entry handshake over sideband. Stage 3 starts as soon as RDI is Active.",
        ref: "§10.1.6 and Figure 10-7, p.534 · §4.5.3.5–4.5.3.6, p.168",
        n: 27, gaps: [3, 16],
        sig: [
          { name: "LTSM (Die 0)", d: "note", t: "note", v: seq([["MBTRAIN", 3], ["", 1], ["LINKINIT", 19], ["ACTIVE", 4]]) },
          { name: "pl_phyinrecenter", d: "pl", t: "bit", v: bits(27, [[0, 3]]) },
          { name: "pl_clk_req", d: "pl", t: "bit", v: bits(27, [[4, 23]]) },
          { name: "lp_clk_ack", d: "lp", t: "bit", v: bits(27, [[6, 24]]) },
          { name: "pl_inband_pres", d: "pl", t: "bit", v: bits(27, [[4, 26]]) },
          { name: "lp_wake_req", d: "lp", t: "bit", v: bits(27, [[7, 26]]) },
          { name: "pl_wake_ack", d: "pl", t: "bit", v: bits(27, [[9, 26]]) },
          { name: "lp_state_req", d: "lp", t: "bus", v: seq([["NOP", 8], ["Active", 19]]) },
          { name: "sideband (PHY↔PHY)", d: "sb", t: "note", v: seq([["", 10], ["Req.Active →", 3], ["← Req.Active", 3], ["", 1], ["Rsp.Active →", 3], ["← Rsp.Active", 3], ["", 4]]) },
          { name: "pl_state_sts", d: "pl", t: "bus", v: seq([["Reset", 23], ["Active", 4]]) },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(27, [[23, 26]]) },
          { name: "Adapter sideband (lp_cfg)", d: "sb", t: "note", v: seq([["", 23], ["{AdvCap.Adapter} →", 4]]) }
        ],
        steps: [
          { r: [0, 3], t: "Training is finishing", x: "The LTSM is in MBTRAIN, pl_phyinrecenter is high and RDI shows Reset. An Adapter that saves power by clock gating sits gated, waiting for pl_inband_pres.", s: "Table 10-1 (pl_phyinrecenter), p.525 · §10.1.3.2 rule 8, p.531" },
          { r: [4, 6], t: "LINKINIT: pl_inband_pres with a clk handshake", x: "The LTSM enters LINKINIT. The PHY raises pl_clk_req and pl_inband_pres together; the Adapter ungates and acks two cycles later. For initial bring-up the spec recommends holding pl_clk_req until status leaves Reset, which is what happens here.", w: "pl_inband_pres may change before lp_clk_ack because it is a level, but it is only guaranteed observed once the handshake completes.", s: "§4.5.3.5, p.168 · §10.1.3.2 rule 5, p.531 · §10.1.6 step 1, p.534" },
          { r: [7, 9], t: "Adapter wakes the PHY and asks for Active", x: "lp_wake_req rises and, one cycle later, lp_state_req goes NOP → Active without waiting for pl_wake_ack (allowed for state requests). The NOP held since reset is what makes this an edge.", w: "Waiting for the ack is required only for lp_cfg, where one packet spans several cycles.", s: "§10.1.6 step 2, p.534 · §10.1.3.1 rule 5, p.530 · §10.3.3.1, p.565" },
          { r: [10, 15], t: "Req.Active in both directions", x: "Having sampled Active, Die 0's PHY sends {LinkMgmt.RDI.Req.Active}. Die 1 does the same when its own Adapter is ready; either side may go first.", s: "§10.1.6 step 3, p.534 · Table 7-8, p.275" },
          { r: [16, 22], t: "Rsp.Active in both directions", x: "Each PHY answers the remote request with Rsp.Active, which it may do only because it has sampled Active locally. The compressed column is sideband time: each 64-bit message is 64 UI at 800 MT/s (80 ns), with at least 32 UI between messages.", w: "Answering before local Active would let the remote Adapter start parameter exchange with an Adapter that is not ready.", s: "§10.1.6 steps 4–5, p.534 · §4.1.5, p.102 · §5.13, p.254" },
          { r: [23, 26], t: "RDI Active; Stage 3 begins", x: "Having sent and received Rsp.Active, the PHY moves pl_state_sts to Active and the LTSM is in ACTIVE. pl_clk_req falls now that status has left Reset, and pl_trdy can rise. The Adapter starts Stage 3 by sending {AdvCap.Adapter} through lp_cfg.", s: "§10.1.6 steps 5–6, p.534 · §4.5.3.6, p.168 · §3.2.1.2, p.63" }
        ]
      },
      {
        id: "traffic", tab: "Traffic", title: "Steady traffic: early lp_irdy, Tx backpressure, Rx bubbles",
        desc: "A 64B RDI moving 256B flits (four beats each). Top half is the transmit path, bottom half the receive path.",
        ref: "§10.1.4 and Figure 10-3, p.532 · Figures 10-4 and 10-5, p.533",
        n: 16, gaps: [],
        sig: [
          { name: "lp_irdy", d: "lp", t: "bit", v: bits(16, [[0, 11]]) },
          { name: "lp_valid", d: "lp", t: "bit", v: bits(16, [[2, 11]]) },
          { name: "lp_data", d: "lp", t: "bus", v: seq([["", 2], ["F0·0", 1], ["F0·1", 1], ["F0·2", 3], ["F0·3", 1], ["F1·0", 1], ["F1·1", 1], ["F1·2", 1], ["F1·3", 1], ["", 4]]) },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(16, [[2, 3], [6, 15]]) },
          { name: "beat accepted", d: "note", t: "note", v: ["", "", "✓", "✓", "", "", "✓", "✓", "✓", "✓", "✓", "✓", "", "", "", ""] },
          { name: "pl_valid", d: "pl", t: "bit", v: bits(16, [[3, 5], [7, 11]]) },
          { name: "pl_data", d: "pl", t: "bus", v: seq([["", 3], ["G0·0", 1], ["G0·1", 1], ["G0·2", 1], ["", 1], ["G0·3", 1], ["G1·0", 1], ["G1·1", 1], ["G1·2", 1], ["G1·3", 1], ["", 4]]) }
        ],
        steps: [
          { r: [0, 2], t: "lp_irdy first: wake the PHY", x: "The Adapter raises lp_irdy two cycles before lp_valid. A PHY that gated its transmit path uses the hint to ungate, and pl_trdy is high by the time the first beat appears in cycle 2.", w: "This is the Figure 10-4 pattern. pl_trdy could even rise in cycle 1; nothing transfers until lp_valid is also high.", s: "§10.1.5 Implementation Note, Figures 10-4 and 10-5, p.533" },
          { r: [2, 7], t: "Backpressure inside a flit", x: "F0·0 and F0·1 move in cycles 2 and 3. pl_trdy drops for two cycles; the Adapter holds F0·2 with lp_valid and lp_irdy high, and it moves in cycle 6. The Adapter never inserts its own gap inside a flit.", s: "§10.1.4 and Figure 10-3, p.532" },
          { r: [8, 11], t: "Back-to-back flits", x: "With pl_trdy high, a 256B flit leaves every four cycles: 2 ns at 2 GHz, the same time it occupies on a x64 link at 16 GT/s (32 UI). A PHY that keeps up drops pl_trdy only for its own events, for example inserted parity bytes.", s: "§10.3.1, p.559–561 · §10.1.2, p.529" },
          { r: [3, 11], t: "Receive: no backpressure, bubbles allowed", x: "The PHY delivers G0 with a bubble in cycle 6, for example while merging bytes from several modules. There is no ready signal from the Adapter: every pl_valid beat must be taken.", w: "Real consequence: any clock crossing inside the Adapter's receive path must be sized for the full link rate.", s: "§10.1.4, p.532 · §10.1.2, p.529" }
        ]
      },
      {
        id: "retrain", tab: "Retrain (framing error)", title: "PHY-initiated Retrain after a Valid framing error",
        desc: "Die 0's PHY sees a framing error while receiving and its Adapter is mid-flit on transmit. The PHY flags the bad data, quiets the Adapter, agrees Retrain with the remote PHY, retrains and comes back through the Active Entry handshake.",
        ref: "§4.5.3.7.2, p.170 · §10.3.3.4, p.566–567 · §10.3.2, p.563",
        n: 26, gaps: [11, 17],
        sig: [
          { name: "pl_valid", d: "pl", t: "bit", v: bits(26, [[0, 4], [25, 25]]) },
          { name: "pl_data", d: "pl", t: "bus", v: seq([["G0·0", 1], ["G0·1", 1], ["G0·2", 1], ["G0·3", 1], ["G1·0 bad", 1], ["", 20], ["G1·0 replay", 1]]) },
          { name: "pl_error", d: "pl", t: "bit", v: bits(26, [[4, 4]]) },
          { name: "lp_valid / lp_irdy", d: "lp", t: "bit", v: bits(26, [[0, 7]]) },
          { name: "lp_data", d: "lp", t: "bus", v: seq([["F5·0", 1], ["F5·1", 1], ["F5·2", 1], ["F5·3", 1], ["F6·0", 1], ["F6·1", 1], ["F6·2", 1], ["F6·3", 1], ["", 18]]) },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(26, [[0, 7], [24, 25]]) },
          { name: "pl_stallreq", d: "pl", t: "bit", v: bits(26, [[5, 14]]) },
          { name: "lp_stallack", d: "lp", t: "bit", v: bits(26, [[8, 15]]) },
          { name: "sideband (PHY↔PHY)", d: "sb", t: "note", v: seq([["", 9], ["Req.Retrain →", 2], ["", 1], ["← Rsp.Retrain", 2], ["", 1], ["retrain start ⇄", 2], ["", 1], ["", 2], ["Req.Active ⇄", 2], ["Rsp.Active ⇄", 2], ["", 2]]) },
          { name: "pl_state_sts", d: "pl", t: "bus", v: seq([["Active", 14], ["Retrain", 10], ["Active", 2]]) },
          { name: "LTSM", d: "note", t: "note", v: seq([["ACTIVE", 14], ["PHYRETRAIN", 3], ["", 1], ["LINKINIT", 6], ["ACTIVE", 2]]) },
          { name: "pl_phyinrecenter", d: "pl", t: "bit", v: bits(26, [[14, 17]]) },
          { name: "lp_state_req", d: "lp", t: "bus", v: seq([["Active", 15], ["NOP", 4], ["Active", 7]]) }
        ],
        steps: [
          { r: [0, 4], t: "Framing error: pl_error with the bad chunk", x: "G0 arrives cleanly. In cycle 4 the PHY has detected an invalid Valid-lane encoding; it raises pl_error in the same cycle as the corrupted chunk, so the Adapter discards G1 even though it is only partly received.", w: "Pipeline matching is the point: the error must reach the Adapter no later than the data it spoils.", s: "Table 10-1 (pl_error), p.524 · §4.5.3.7.2 step 1, p.170" },
          { r: [5, 8], t: "Stall the transmitter at a flit boundary", x: "The PHY raises pl_stallreq while the Adapter is midway through F6. The PHY keeps accepting (pl_trdy high), and the Adapter raises lp_stallack after F6·3, the next clean boundary. From then on lp_valid and lp_irdy stay low.", s: "§10.3.2 rules 4, 6, 7, p.563" },
          { r: [9, 14], t: "Req/Rsp.Retrain with the remote PHY", x: "With the transmitter quiet, the PHY sends {LinkMgmt.RDI.Req.Retrain}. The partner stalls its own Adapter, moves its RDI to Retrain and replies Rsp.Retrain. On receiving it, Die 0 moves pl_state_sts to Retrain and raises pl_phyinrecenter.", s: "§4.5.3.7.2 steps 2–4, p.170 · Table 7-8, p.275–276" },
          { r: [14, 16], t: "Finish the stall; agree the retrain type", x: "pl_stallreq falls, then lp_stallack: all four phases are done. The Adapter, seeing Retrain, drops lp_state_req to NOP. The PHYs swap {PHYRETRAIN.retrain start req/resp}; with no lane errors both resolve to TXSELFCAL.", w: "The Adapter has to create the NOP→Active edge itself, because this Retrain was entered from Active.", s: "§10.3.2 rule 9, p.563 · §10.3.3.4 rule 1, p.567 · Tables 4-11 and 4-12, p.169" },
          { r: [17, 19], t: "Retrain, then LINKINIT and NOP→Active", x: "The compressed column is MBTRAIN from TXSELFCAL onward. The LTSM reaches LINKINIT and the Adapter drives Active after its NOP cycles.", s: "§4.5.3.7, p.168–169 · §4.5.3.5, p.168" },
          { r: [20, 25], t: "Active Entry handshake, then replay", x: "The PHYs exchange Req.Active and Rsp.Active again, as on every Active entry. Status returns to Active and pl_trdy rises. Retry in the remote Adapter replays G1, which Die 0 had discarded.", w: "With Retry disabled, the same pl_error would have been escalated as an Uncorrectable Internal Error.", s: "§10.1.6, p.534 · Table 10-1 (pl_error), p.524 · §3.8, p.93" }
        ]
      },
      {
        id: "l1", tab: "L1 entry", title: "L1 entry: both dies idle",
        desc: "Both Adapters have already taken their Adapter LSMs to L1. Die 0's Adapter now asks RDI for L1; Die 1's does the same at about the same time.",
        ref: "§10.1.7 and Figure 10-8, p.535–537",
        n: 22, gaps: [13],
        sig: [
          { name: "lp_state_req", d: "lp", t: "bus", v: seq([["Active", 3], ["L1", 19]]) },
          { name: "lp_valid", d: "lp", t: "bit", v: bits(22, []) },
          { name: "pl_stallreq", d: "pl", t: "bit", v: bits(22, [[4, 7]]) },
          { name: "lp_stallack", d: "lp", t: "bit", v: bits(22, [[6, 8]]) },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(22, [[0, 5]]) },
          { name: "sideband (PHY↔PHY)", d: "sb", t: "note", v: seq([["", 10], ["Req.L1 →", 2], ["", 2], ["← Req.L1", 2], ["Rsp.L1 →", 2], ["← Rsp.L1", 2], ["", 2]]) },
          { name: "pl_state_sts", d: "pl", t: "bus", v: seq([["Active", 18], ["L1", 4]]) },
          { name: "lp_wake_req", d: "lp", t: "bit", v: bits(22, [[0, 18]]) },
          { name: "pl_wake_ack", d: "pl", t: "bit", v: bits(22, [[0, 19]]) },
          { name: "LTSM", d: "note", t: "note", v: seq([["ACTIVE", 18], ["L1", 4]]) },
          { name: "power", d: "note", t: "note", v: seq([["", 18], ["mainband may power down; sideband stays on", 4]]) }
        ],
        steps: [
          { r: [0, 3], t: "Ask for L1 only when the stack is idle", x: "Every Adapter LSM has already reached L1 with the remote Adapter: retry buffer empty, no flits or Ack/Nak pending, so lp_valid stays low. The Adapter drives lp_state_req = L1.", s: "§10.1.7, p.535 · §3.5, p.90" },
          { r: [4, 9], t: "Stall handshake, all four phases", x: "The PHY stalls the Adapter. With no traffic the ack comes quickly, and pl_trdy drops after it. Both signals return low before the PHY sends anything.", w: "Even an idle Adapter must complete the handshake; it proves the transmit pipeline holds nothing.", s: "§10.1.7, p.535 · §10.3.2, p.563" },
          { r: [10, 15], t: "PM Requests cross", x: "Die 0's PHY sends {LinkMgmt.RDI.Req.L1}. Die 1, whose Adapter also wants L1, sends its own.", s: "§10.1.7, p.535 · Table 7-8, p.275" },
          { r: [16, 19], t: "Respond, then move to L1", x: "Die 0's Adapter is requesting L1, so its PHY answers Die 1's request with Rsp.L1 and then moves pl_state_sts to L1. Die 1's Rsp.L1 arrives afterwards; Die 0 is no longer Active, so no further action. Entry is complete when both PHYs have received a PM Response.", s: "§10.1.7, p.535–536" },
          { r: [18, 21], t: "Power down", x: "With status L1 the Adapter may drop lp_wake_req and gate its clocks; the PHY may power down its mainband, for example its PLL. The sideband logic and its PLL stay on so a Req.Active can wake the link.", s: "§10.1.7, p.535 · §10.1.3, p.530 · §4.5.3.9, p.172" }
        ]
      },
      {
        id: "pmnak", tab: "PM abort (PMNAK)", title: "PM abort: the remote die is still busy",
        desc: "Die 0 asks for L1 but Die 1's Adapter still has traffic. Die 1's PHY waits 1 µs, then refuses with PMNAK.",
        ref: "§10.1.7 and Figure 10-9, p.535–537",
        n: 20, gaps: [9],
        sig: [
          { name: "lp_state_req", d: "lp", t: "bus", v: seq([["Active", 2], ["L1", 11], ["Active", 7]]) },
          { name: "pl_stallreq", d: "pl", t: "bit", v: bits(20, [[3, 5]]) },
          { name: "lp_stallack", d: "lp", t: "bit", v: bits(20, [[4, 6]]) },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(20, [[0, 4], [12, 19]]) },
          { name: "sideband (PHY↔PHY)", d: "sb", t: "note", v: seq([["", 7], ["Req.L1 →", 2], ["", 1], ["← Rsp.PMNAK", 2], ["", 8]]) },
          { name: "pl_state_sts", d: "pl", t: "bus", v: seq([["Active", 12], ["Active.PMNAK", 2], ["Active", 6]]) },
          { name: "note", d: "note", t: "note", v: seq([["", 14], ["no new PM Request until ≥ 2 µs after PMNAK", 6]]) }
        ],
        steps: [
          { r: [0, 6], t: "Request L1 and stall", x: "Die 0's Adapter drives L1. The PHY completes the stall handshake and pl_trdy drops.", s: "§10.1.7, p.535 · §10.3.2, p.563" },
          { r: [7, 11], t: "The remote die says no", x: "Die 0's PHY sends Req.L1. Die 1's Adapter still has traffic, so Die 1's request and status stay Active. After 1 µs (inside the 2 µs response limit) Die 1's PHY replies {LinkMgmt.RDI.Rsp.PMNAK}. The compressed column covers that wait.", s: "§10.1.7, p.535–536 · Table 7-8, p.276" },
          { r: [12, 12], t: "Active.PMNAK", x: "On PMNAK, Die 0's PHY moves status to Active.PMNAK, a sub-state of Active, so pl_trdy may return. The Adapter's held L1 request has now resolved.", w: "Active.PMNAK cannot go to L1 directly; the Adapter must request Active first.", s: "§10.1.7, p.536 · §10.3, p.559" },
          { r: [13, 14], t: "Back to Active", x: "The Adapter requests Active and the PHY moves status to Active on sampling it (no NOP needed from Active.PMNAK). Anything the Adapter had accepted but held, such as a remote PM-exit request for an Adapter LSM, can now be processed.", s: "Table 10-4 note b, p.565 · §10.1.7, p.535 · Figure 10-9, p.537" },
          { r: [15, 19], t: "Retry later", x: "If the idle conditions still hold, the Adapter may request L1 again, but the PHY may not send a new PM Request until at least 2 µs after the PMNAK, unless Die 1 sends its own Req.L1 first.", s: "§10.1.7, p.536" }
        ]
      },
      {
        id: "l1exit", tab: "L1 exit (remote)", title: "L1 exit started by the remote die",
        desc: "Both dies are in L1. Die 1 needs the link back; Die 0's Adapter is asleep. Die 0's PHY wakes it and shows Retrain to prompt an Active request.",
        ref: "§10.1.7, p.536 · Figures 10-10 and 10-11, p.538 · §4.5.3.9, p.172",
        n: 22, gaps: [9],
        sig: [
          { name: "sideband (PHY↔PHY)", d: "sb", t: "note", v: seq([["", 1], ["← Req.Active", 2], ["", 4], ["Req.Active →", 2], ["", 1], ["", 2], ["Rsp.Active →", 2], ["← Rsp.Active", 2], ["", 6]]) },
          { name: "pl_clk_req", d: "pl", t: "bit", v: bits(22, [[3, 6]]) },
          { name: "lp_clk_ack", d: "lp", t: "bit", v: bits(22, [[5, 7]]) },
          { name: "pl_state_sts", d: "pl", t: "bus", v: seq([["L1", 4], ["Retrain", 12], ["Active", 6]]) },
          { name: "lp_state_req", d: "lp", t: "bus", v: seq([["L1", 6], ["Active", 16]]) },
          { name: "lp_wake_req", d: "lp", t: "bit", v: bits(22, [[6, 21]]) },
          { name: "pl_wake_ack", d: "pl", t: "bit", v: bits(22, [[8, 21]]) },
          { name: "LTSM", d: "note", t: "note", v: seq([["L1", 3], ["MBTRAIN.SPEEDIDLE → …", 6], ["", 1], ["LINKINIT", 6], ["ACTIVE", 6]]) },
          { name: "pl_phyinrecenter", d: "pl", t: "bit", v: bits(22, [[3, 9]]) },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(22, [[16, 21]]) }
        ],
        steps: [
          { r: [0, 2], t: "The remote die wants out of L1", x: "Both dies are in L1. Die 1's Adapter requests Active, so Die 1's PHY sends {LinkMgmt.RDI.Req.Active} and starts L1 exit training.", s: "§10.1.7, p.536 · Figure 10-11, p.538" },
          { r: [3, 5], t: "Wake the Adapter, show Retrain", x: "Die 0's PHY is in PM and has received Req.Active, so it raises pl_clk_req before changing status, then moves pl_state_sts to Retrain. Its LTSM leaves L1 for MBTRAIN.SPEEDIDLE.", w: "Retrain status is how the PHY tells a sleeping Adapter that the link is coming back.", s: "§10.1.7, p.536 · §10.1.3.2 rule 7, p.531 · §4.5.3.9, p.172" },
          { r: [6, 8], t: "Adapter asks for Active; PHY sends its own Req.Active", x: "Seeing Retrain, the Adapter wakes the PHY and drives Active. A level is enough because Retrain was entered from L1, not from Active. That makes Die 0's PHY send Req.Active.", s: "§10.3.3.4 rule 1, p.567 · §10.1.7, p.536" },
          { r: [9, 11], t: "Training; timers start at LINKINIT", x: "The compressed column is retraining. Only when the LTSM reaches LINKINIT do the Active Request handshake timeout counters start, so slow training is not counted against the handshake.", s: "§10.1.7, p.536" },
          { r: [12, 21], t: "Rsp.Active both ways; Active", x: "Each PHY answers with Rsp.Active, both having sampled Active locally. Having sent and received Rsp.Active, Die 0 shows Active, the LTSM is in ACTIVE, and pl_trdy rises.", s: "§10.1.6, p.534 · §10.1.7, p.536 · Figure 10-10, p.538" }
        ]
      },
      {
        id: "linkerror", tab: "LinkError", title: "LinkError from the Adapter, then recovery",
        desc: "The Adapter detects an uncorrectable error and takes the link down at once. Software later clears the error and the link is brought back.",
        ref: "§10.3.3.7, p.568–569 · §10.3.3.8, p.569 · Figure 10-32, p.576",
        n: 22, gaps: [7, 14],
        sig: [
          { name: "lp_linkerror", d: "lp", t: "bit", v: bits(22, [[2, 12]]) },
          { name: "lp_valid / lp_irdy", d: "lp", t: "bit", v: bits(22, [[0, 3]]) },
          { name: "lp_data", d: "lp", t: "bus", v: seq([["F7·0", 1], ["F7·1", 1], ["F7·2", 1], ["F7·3", 1], ["", 18]]) },
          { name: "pl_trdy", d: "pl", t: "bit", v: bits(22, [[0, 2]]) },
          { name: "pl_state_sts", d: "pl", t: "bus", v: seq([["Active", 3], ["LinkError", 13], ["Reset", 6]]) },
          { name: "sideband (PHY↔PHY)", d: "sb", t: "note", v: seq([["", 4], ["Req.LinkError →", 3], ["", 1], ["← Rsp.LinkError", 3], ["", 11]]) },
          { name: "LTSM", d: "note", t: "note", v: seq([["ACTIVE", 3], ["TRAINERROR", 13], ["RESET → training", 6]]) },
          { name: "residency", d: "note", t: "note", v: seq([["", 3], ["≥ 16 ms in LinkError", 13], ["", 6]]) },
          { name: "lp_state_req", d: "lp", t: "bus", v: seq([["Active", 17], ["NOP", 2], ["Active", 3]]) },
          { name: "pl_phyinrecenter", d: "pl", t: "bit", v: bits(22, [[20, 21]]) }
        ],
        steps: [
          { r: [0, 3], t: "lp_linkerror: down now", x: "An uncorrectable error in the Adapter (or ORed in from a Protocol Layer) raises lp_linkerror. The PHY moves to LinkError on the next cycle without any stall handshake and drops pl_trdy, so F7·3 is never accepted and the flit is left incomplete.", w: "A dedicated wire gives the fastest containment path, for example for a CXL viral escalation.", s: "Table 10-1 (lp_linkerror), p.523 · §10.3.3.7, p.568" },
          { r: [3, 6], t: "Clean up and tell the remote PHY", x: "Having sampled LinkError for a cycle, the Adapter cleans its datapath internally even without pl_trdy. The PHY sends {LinkMgmt.RDI.Req.LinkError}, and the LTSM goes to TRAINERROR.", s: "§10.3.3.7, p.568 · §10.3.3.8, p.569 · §4.5.3.8, p.171" },
          { r: [8, 10], t: "The remote die acknowledges", x: "Die 1's PHY moves its RDI to LinkError and replies {LinkMgmt.RDI.Rsp.LinkError}. With no response within 8 ms, Die 0 would still be in LinkError, and Die 1 would get there through its own timeouts.", s: "§10.3.3.8, p.569 · Table 7-8, p.275–276" },
          { r: [11, 15], t: "Hold for at least 16 ms", x: "Software clears the error and the Adapter drops lp_linkerror. The PHY still stays in LinkError until 16 ms have passed (compressed column), and the LTSM stays in TRAINERROR all that time.", s: "§10.3.3.7, p.569 · §4.5.3.8, p.171" },
          { r: [16, 21], t: "Exit to Reset, then retrain on an edge", x: "With lp_state_req = Active, lp_linkerror = 0 and residency met, status goes to Reset. The PHY does not start training until it sees NOP→Active: the Adapter drives NOP for two cycles, then Active, and training begins.", s: "§10.3.3.7, p.569 · §10.3.3.8, p.569" }
        ]
      }
    ]
  };
})();
