(function () {
  var U = {
    fdi: "guides/fdi.html",
    rdi: "guides/rdi.html",
    adp: "guides/d2d-adapter.html",
    ltsm: "guides/link-training.html",
    lphy: "guides/logical-phy.html",
    sb: "guides/sideband.html",
    proto: "guides/protocol-mappings.html",
    mgmt: "guides/manageability-uda.html",
    reg: "guides/registers-discovery.html",
    cmp: "guides/retimers-compliance.html",
    elec: "guides/electrical-ucie-3d.html"
  };
  var N = { fdi: "FDI", rdi: "RDI", adp: "D2D Adapter", ltsm: "Link Training", lphy: "Logical PHY", sb: "Sideband", proto: "Protocol Mappings", mgmt: "Manageability & UDA", reg: "Registers & Discovery", cmp: "Retimers & Compliance", elec: "Electrical & UCIe-3D" };
  function e(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var G = [
    ["fdi", "Chapter 10.2–10.3", "The contract between a protocol controller and the Adapter: every signal, the state machine, the wake/clock/stall handshakes, and flit cancel.", "Live waveforms for bring-up, traffic, CRC replay, PM, retrain and errors."],
    ["rdi", "Chapter 10.1, 10.3", "The Adapter-to-PHY interface: states, Active entry over sideband, PM timing (1 µs, 2 µs), link-down timing (8 ms, 16 ms), LinkError.", "Live waveforms; signal table with filters."],
    ["adp", "Chapter 3", "Flit formats 1–6, CRC-16, retry with 8-bit sequence numbers, parameter exchange, the format truth tables, stack multiplexing, runtime parity.", "Format byte map; truth-table resolver; retry waveforms."],
    ["ltsm", "Chapter 4.5–4.7", "RESET through SBINIT, MBINIT and the 13 MBTRAIN sub-states to ACTIVE; LINKSPEED repair and degrade; PHYRETRAIN; L1/L2; runtime recalibration.", "Retrain resolver; state walk-throughs."],
    ["lphy", "Chapter 4.1–4.4", "Byte-to-lane mapping, Valid framing, sideband framing, lane reversal and Lane ID, lane repair by shifting, width degrade, multi-module rules.", "Byte map; interactive repair grid."],
    ["sb", "Chapter 7", "Sideband packet types and opcodes, srcid/dstid, register accesses and completions, credits, end-to-end mailbox flow, timeouts and Stall.", "Mailbox and credit waveforms."],
    ["proto", "Chapter 2", "How PCIe, CXL (256B and 68B), Streaming and Management map onto UCIe flit formats and rates.", "Protocol × rate format matrix."],
    ["mgmt", "Chapter 8", "The management network, MTP packets, encapsulation over sideband and mainband, path setup, heartbeat, UDA test/debug hub and spokes, firmware download, fast throttle.", "Sideband path-setup waveform."],
    ["reg", "Chapter 9, Appendix A", "Finding a UCIe link (UEDT, UiRB, DVSECs), Link Capability/Control/Status, the sideband mailbox, error registers and Header Log 2, eye margins, interrupts.", "Link Status decoder; mailbox index calculator; error-escalation waveform."],
    ["cmp", "§1.3, Chapters 3, 4, 11, §9.5.4", "Retimers: reliability options, credits on Valid, Stall and end-to-end state resolution. Compliance: Golden Die, Adapter injection hooks, PHY compliance and margining.", "Retry-injection register builder; credit and Vref-sweep waveforms."],
    ["elec", "Chapters 5–6", "Package types, the module, REFCLK and forwarded clocking, Tx/Rx EQ and termination, eye masks and VTF, idle and clock gating, BER, sideband electrical, UCIe-3D.", "Per-rate spec lookup; UCIe-3D repair calculator; UI-level waveforms."]
  ];
  var gl = document.getElementById("glist");
  if (gl) G.forEach(function (g) {
    var d = document.createElement("div"); d.className = "card gcard";
    d.innerHTML = "<div class=\"ch\">" + e(g[1]) + "</div><h3><a href=\"" + U[g[0]] + "\">" + e(N[g[0]]) + "</a></h3><p style=\"font-size:15px\">" + e(g[2]) + "</p><p class=\"tools\">" + e(g[3]) + "</p><a class=\"go\" href=\"" + U[g[0]] + "\">Open the guide →</a>";
    gl.appendChild(d);
  });

  var T = [
    ["How PCIe or CXL traffic rides on UCIe", "proto", "Chapter 2"],
    ["Flit formats 1–6 and which one gets picked", "adp", "§3.3–3.4"],
    ["CRC polynomial and coverage", "adp", "§3.7"],
    ["Retry, Ack/Nak, replay timeout", "adp", "§3.8"],
    ["Parameter exchange ({AdvCap}, {FinCap})", "adp", "§3.2"],
    ["Two protocol stacks on one link", "adp", "§3.1"],
    ["Runtime link testing with parity", "adp", "§3.9"],
    ["Adapter LSM and state hierarchy", "adp", "§3.5"],
    ["lp_/pl_ signals between protocol and Adapter", "fdi", "§10.2"],
    ["pl_flit_cancel timing", "fdi", "§10.2.5"],
    ["RDI states, Active entry, LinkError", "rdi", "§10.1.5–10.1.6"],
    ["Stall, wake and clock handshakes", "rdi", "§10.1.3, §10.3.2"],
    ["L1/L2 power management flows", "rdi", "§10.1.7, §10.2.9, §4.5.3.9"],
    ["LTSM states and MBTRAIN sub-states", "ltsm", "§4.5.3"],
    ["Speed degrade, width degrade, PHYRETRAIN", "ltsm", "§4.5.3.4–4.5.3.7"],
    ["Runtime recalibration and Track", "ltsm", "§4.6, §5.5.1"],
    ["Byte-to-lane mapping and Valid framing", "lphy", "§4.1"],
    ["Lane reversal and Lane ID", "lphy", "§4.2"],
    ["Lane repair and spare lanes", "lphy", "§4.3"],
    ["Multi-module links", "lphy", "§4.7"],
    ["Sideband opcodes and packet formats", "sb", "§7.1.1–7.1.2"],
    ["Sideband credits and timeouts", "sb", "§7.1.3"],
    ["Management Transport packets and path setup", "mgmt", "§8.1.3, §8.2"],
    ["Test and debug (UDA hub and spokes)", "mgmt", "§8.3"],
    ["How software finds a UCIe link", "reg", "§9.2–9.3, §9.8"],
    ["Start training vs Retrain bits", "reg", "Table 9-9"],
    ["Reading the partner die's registers", "reg", "§9.5.1.11–9.5.1.16"],
    ["Error status, masks and Header Log 2", "reg", "§9.5.3.2–9.5.3.8"],
    ["Eye margins per lane (UHM)", "reg", "§9.5.3.40"],
    ["Retimer credits and Stall", "cmp", "§1.3, §3.2.1.2"],
    ["Flit, link-state and retry injection", "cmp", "§9.5.4.4, §11.2"],
    ["PHY compliance mode and Vref margining", "cmp", "§9.5.4.5, §11.3"],
    ["REFCLK, forwarded clock, quadrature", "elec", "§5.1, §5.5"],
    ["Tx equalization presets and Rx CTLE", "elec", "§5.3.3–5.4.4"],
    ["Clock gating and postamble", "elec", "§4.1.3, §5.11"],
    ["Raw BER per rate and package", "elec", "§5.10"],
    ["UCIe-3D", "elec", "Chapter 6"]
  ];
  var tb = document.getElementById("tbody-topics");
  if (tb) T.forEach(function (t) {
    var tr = document.createElement("tr");
    tr.innerHTML = "<td>" + e(t[0]) + "</td><td><a href=\"" + U[t[1]] + "\">" + e(N[t[1]]) + "</a></td><td>" + e(t[2]) + "</td>";
    tb.appendChild(tr);
  });
})();
