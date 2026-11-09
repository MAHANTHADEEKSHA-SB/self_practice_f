(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  window.PAGE = {
    CW: 104,
    wgroups: [["all", "All"], ["arch", "Architecture"], ["mtp", "Transport"], ["link", "Link setup"], ["uda", "UDA"]],
    scenarios: [
      {
        id: "sbsetup", tab: "Sideband path setup", unit: "steps", title: "Management path setup over sideband: 1 RxQ, 1 VC",
        desc: "Chiplet A and chiplet B both support Management Transport over sideband. Each column is one step, not a fixed time.",
        ref: "§8.2.3.1, p.371–375 · §8.2.5.1.3, p.384 · Table 10-2, p.527",
        n: 10, gaps: [],
        sig: [
          { name: "LTSM", d: "note", t: "note", v: ["MBINIT.PARAM", "MBINIT.PARAM", "", "", "", "", "", "", "", ""] },
          { name: "A → B (sideband)", d: "sb", t: "note", v: ["SBFE (RxQs)", "", "Caps NumVC=0", "Cred VC0 req", "Cred VC0 rsp", "Init Done Q0", "", "MTP", "", "cred return"] },
          { name: "B → A (sideband)", d: "sb", t: "note", v: ["", "SBFE resp", "Caps NumVC=0", "Cred VC0 req", "Cred VC0 rsp", "Init Done Q0", "", "", "MTP", ""] },
          { name: "pm_param_done (pulse)", d: "pl", t: "bit", v: bits(10, [[1, 1]]) },
          { name: "mp_mgmt_up / init_done", d: "lp", t: "bit", v: bits(10, [[6, 9]]) },
          { name: "SB_MGMT_UP (PHY)", d: "pl", t: "bit", v: bits(10, [[6, 9]]) },
          { name: "heartbeat", d: "note", t: "note", v: seq([["", 6], ["8 ms timer · MPM ≤ 4 ms apart", 4]]) }
        ],
        steps: [
          { r: [0, 1], t: "Negotiation in MBINIT.PARAM", x: "The PHYs exchange Sideband Feature Extension information: management transport support and the number of RxQs. The PHY tells the gateway with pm_param_done and the module counts.", s: "§8.2.3, p.371 · §4.5.3.3.1.1 · Table 10-2, p.527" },
          { r: [2, 2], t: "Capabilities", x: "Each gateway sends one Management Port Gateway Capabilities message with its Port ID and NumVC (0 = one VC). Both enable MIN(sent, received) + 1 VCs: here VC0 only.", s: "§8.2.3.1 step 1, p.372" },
          { r: [3, 4], t: "Credits for VC0, requests and responses", x: "Each side returns credits for VC0 request and response buffers on RxQ-ID 0.", w: "Separate request and response credits stop requests from filling the buffers that their own responses need.", s: "§8.2.3.1 step 2, p.372" },
          { r: [5, 6], t: "Init Done, path up", x: "After its last credit return on RxQ0, each side sends Init Done. Having sent and received Init Done on every RxQ-ID, the gateway asserts mp_mgmt_up and mp_mgmt_init_done; the PHY sets SB_MGMT_UP.", s: "§8.2.3.1 step 3, p.374" },
          { r: [7, 9], t: "MTPs flow; heartbeat keeps it alive", x: "Encapsulated MTPs now travel as MPMs, regardless of the mainband's state. If a side has nothing to send for 4 ms it sends a credit return so the partner's 8 ms Heartbeat timer never expires.", s: "§8.2.5.1.3, p.384" }
        ]
      }
    ]
  };
})();
