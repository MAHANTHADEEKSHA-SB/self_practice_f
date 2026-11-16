(function () {
  var S = {{SERIES_JSON}};
  function e(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function url(k) { return S[k] && S[k].url; }
  function name(k) { return S[k] ? S[k].name : k; }

  /* map boxes: fade unpublished */
  Array.prototype.forEach.call(document.querySelectorAll(".lmap a[data-k]"), function (a) {
    if (!url(a.getAttribute("data-k"))) { a.classList.add("soon"); a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); }
  });
  /* inline links by data-g */
  Array.prototype.forEach.call(document.querySelectorAll("[data-g]"), function (el) {
    var k = el.getAttribute("data-g"), u = url(k);
    if (el.tagName === "TD") { el.innerHTML = u ? "<a href=\"" + u + "\" target=\"_blank\" rel=\"noopener\">" + e(name(k)) + "</a>" : "<span class=\"soonl\">" + e(name(k)) + "</span>"; return; }
    if (u) { el.setAttribute("href", u); el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
    else { el.classList.add("soonl"); el.removeAttribute("href"); }
  });

  var G = [
    ["chan", "Chapters A1–A2", "Five channels, the VALID/READY handshake and its dependencies, clock and reset, the new credited transport with Resource Planes and shared credits, and register stages.", "Dependency diagrams; 8 step-through waveforms incl. Figures A2.7 and A2.8."],
    ["burst", "Chapter A3.1–A3.2", "AxLEN, AxSIZE, AxBURST; FIXED, INCR and WRAP; the 4 KB rule; transaction equations; narrow, unaligned and byte-invariant transfers; write strobes.", "Burst address calculator; byte-lane maps."],
    ["attr", "Chapter A4", "Subordinate types, AxCACHE bits and memory types, Device vs Normal, buffering, protocol errors, AxPROT and physical address spaces, RME, MEC, regions and QoS.", "Memory-type decoder."],
    ["order", "Chapter A5", "Transaction IDs, the Unique ID indicator, the ordering model (observation, completion, Device and Normal), write response and read data ordering, interleaving and chunking.", "Reordering waveforms; scoreboard design."],
    ["resp", "Chapters A3.3, A6, A7", "OKAY, EXOKAY, SLVERR, DECERR and the other responses, Subordinate busy, single-copy atomicity, exclusive accesses and the monitor, Atomic transactions, request opcodes.", "Exclusive-monitor walk-through; atomic flows."],
    ["cache", "Chapters A8–A9", "Caching in AXI, cache line size, Domains, I/O coherency, Shareable lines, prefetch, stashing, deallocating reads, invalidate hint, CMOs, persistence, PoPA and PoPS.", "CMO propagation flows."],
    ["qual", "Chapters A10–A12", "NSAID, PBHA, Subsystem ID, Arm Compression Technology, WriteZero, WriteDeferrable, MPAM, MTE, trace, loopback and user signals.", "MTE tag transport examples."],
    ["mmu", "Chapters A13, A15", "Untranslated transactions with StreamID and SubstreamID, PCIe considerations, fault flows, stash/unstash translation, DVM messages over the snoop channels, DVM Sync and Complete.", "DVM message field decoder."],
    ["pwr", "Chapters A14, A16", "Wakeup signals, gating credited interfaces with ASKSTOP and channel states, Poison, and parity protection with the check-signal groups.", "Credited stop/start waveforms; parity group table."],
    ["sig", "Appendix B1–B4", "The complete signal list, interface classes (AXI5, AXI5-Lite, ACE5-Lite, -DVM, -ACP), the signal and property matrices, ID constraints and every revision since H.c.", "Signal and property lookup."],
    ["ic", "Spec rules + practice", "What an interconnect must do by the spec, and how real fabrics do it: ID extension, decode and default Subordinates, width and clock conversion, AXI3/AXI4/APB bridges.", "Bridge and fabric design notes."],
    ["axis", "ARM IHI 0051B", "AXI-Stream: TVALID/TREADY, TDATA, TSTRB and TKEEP byte types, TLAST packets, TID and TDEST routing, TUSER, TWAKEUP, and how it differs from AXI.", "Byte-type table; stream waveforms."]
  ];
  var gl = document.getElementById("glist");
  if (gl) G.forEach(function (g) {
    var u = url(g[0]), d = document.createElement("div"); d.className = "card gcard";
    d.innerHTML = "<div class=\"ch\">" + e(g[1]) + "</div><h3>" + (u ? "<a href=\"" + u + "\" target=\"_blank\" rel=\"noopener\">" + e(name(g[0])) + "</a>" : e(name(g[0]))) + "</h3><p style=\"font-size:15px\">" + e(g[2]) + "</p><p class=\"tools\">" + e(g[3]) + "</p>" +
      (u ? "<a class=\"go\" href=\"" + u + "\" target=\"_blank\" rel=\"noopener\">Open the guide →</a>" : "<span class=\"go soon\">Coming soon</span>");
    gl.appendChild(d);
  });

  var T = [
    ["VALID/READY rules and the three handshake orderings", "chan", "§A2.3"],
    ["Write and read channel dependencies, AW/W deadlock", "chan", "§A2.3.2"],
    ["Clock and reset rules", "chan", "§A2.1"],
    ["Credited transport, Resource Planes, shared credits, PENDING", "chan", "§A2.4"],
    ["Register slices", "chan", "§A2.5"],
    ["AxSIZE, AxLEN, maximum bytes per transaction", "burst", "§A3.1.1–A3.1.3"],
    ["FIXED, INCR and WRAP bursts", "burst", "§A3.1.4"],
    ["Transaction equations and pseudocode", "burst", "§A3.1.6–A3.1.7"],
    ["Regular transactions", "burst", "§A3.1.8"],
    ["Write strobes, narrow and unaligned transfers, byte invariance", "burst", "§A3.2"],
    ["BRESP and RRESP encodings, Subordinate busy", "resp", "§A3.3"],
    ["AxCACHE: Bufferable, Modifiable, Allocate", "attr", "§A4.2"],
    ["Memory types (Device, Normal, cacheable)", "attr", "§A4.3"],
    ["AxPROT, physical address space, RME, GDI", "attr", "§A4.5"],
    ["Memory Encryption Contexts", "attr", "§A4.6"],
    ["AxREGION and QoS", "attr", "§A4.7–A4.8"],
    ["Transaction IDs and the Unique ID indicator", "order", "§A5.1–A5.2"],
    ["Ordering model: observation, completion, Device vs Normal", "order", "§A5.3"],
    ["Read data interleaving and chunking", "order", "§A5.6"],
    ["Exclusive accesses and the exclusive monitor", "resp", "§A6.3"],
    ["Atomic transactions (AtomicStore, Load, Swap, Compare)", "resp", "§A6.4"],
    ["Request opcodes, AWSNOOP and ARSNOOP", "resp", "Chapter A7"],
    ["Domains and Shareable lines", "cache", "§A8.3, §A8.5"],
    ["Cache stashing and deallocating reads", "cache", "§A8.7–A8.8"],
    ["Cache maintenance operations and persistence", "cache", "Chapter A9"],
    ["NSAID, PBHA, Subsystem ID, compression", "qual", "Chapter A10"],
    ["WriteZero and WriteDeferrable", "qual", "Chapter A11"],
    ["MPAM, MTE, trace, loopback, user signals", "qual", "Chapter A12"],
    ["Untranslated transactions (SMMU side)", "mmu", "Chapter A13"],
    ["DVM messages and DVM Sync", "mmu", "Chapter A15"],
    ["Wakeup signals and gating credited interfaces", "pwr", "Chapter A14"],
    ["Poison and parity check signals", "pwr", "Chapter A16"],
    ["Full signal list and interface classes", "sig", "Chapters B1–B2"],
    ["What changed between H.c, J, K and L", "sig", "Chapter B4"],
    ["AXI-Stream signals and byte types", "axis", "IHI 0051B"]
  ];
  var tb = document.getElementById("tbody-topics");
  if (tb) T.forEach(function (t) {
    var u = url(t[1]), tr = document.createElement("tr");
    tr.innerHTML = "<td>" + e(t[0]) + "</td><td>" + (u ? "<a href=\"" + u + "\" target=\"_blank\" rel=\"noopener\">" + e(name(t[1])) + "</a>" : "<span class=\"soonl\">" + e(name(t[1])) + " (soon)</span>") + "</td><td>" + e(t[2]) + "</td>";
    tb.appendChild(tr);
  });
})();
