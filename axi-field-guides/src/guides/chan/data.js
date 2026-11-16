(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  function list(s) { return s.split(" "); }

  window.PAGE = {
    CW: 46,
    dirName: { lp: "Manager", pl: "Subordinate", tx: "Channel Tx", rx: "Channel Rx", both: "both", sys: "System" },
    dirCls: { tx: "lp", rx: "pl", both: "", sys: "sb" },
    groups: [["all", "All"], ["clk", "Clock & reset"], ["vr", "Valid-Ready"], ["last", "Framing"], ["cr", "Credited transport"]],
    sigs: [
      ["clk", "ACLK", "sys", "clock", "The one clock of the interface", "Every input is sampled on its rising edge; outputs change only after it. No combinational path from any input to any output.", "§A2.1.1, p.27"],
      ["clk", "ARESETn", "sys", "level", "Active-LOW reset", "May assert asynchronously; must deassert on a rising ACLK edge. Signals held LOW in reset stay LOW until the edge after ARESETn is HIGH.", "§A2.1.2, p.27"],
      ["vr", "AWVALID", "lp", "level", "Write request is valid", "LOW in reset. Never waits for AWREADY. Once HIGH, stays HIGH with stable payload until the AW handshake.", "Table A2.2, p.30 · §A2.3, p.29 · §A2.3.2.1, p.31"],
      ["vr", "AWREADY", "pl", "level", "Subordinate can take a write request", "May wait for AWVALID, WVALID or both, or be HIGH early. Recommended default HIGH; then any valid request must be accepted.", "Table A2.2, p.30 · §A2.3, p.30 · §A2.3.2.1, p.31"],
      ["vr", "WVALID", "lp", "level", "Write data is valid", "Never waits for AWREADY or WREADY, for every beat. May come before, with or after AWVALID.", "Table A2.2, p.30 · §A2.3.2.1, p.31 · §A2.6, p.41"],
      ["vr", "WREADY", "pl", "level", "Subordinate can take a write data beat", "May wait for AWVALID, WVALID or both, or be HIGH before either.", "Table A2.2, p.30 · §A2.3.2.1, p.31"],
      ["vr", "BVALID", "pl", "level", "Write response is valid", "Only after AW handshake and the WLAST beat handshake. Never waits for BREADY.", "Table A2.2, p.30 · §A2.3.2.1, p.31"],
      ["vr", "BREADY", "lp", "level", "Manager can take a write response", "May wait for BVALID or be HIGH early. A Manager that has sent request and data must be able to take the response without depending on other transactions.", "Table A2.2, p.30 · §A2.3.2.1, p.31 · §A2.6, p.41"],
      ["vr", "ARVALID", "lp", "level", "Read request is valid", "LOW in reset. Never waits for ARREADY.", "Table A2.2, p.30 · §A2.3.2.2, p.32"],
      ["vr", "ARREADY", "pl", "level", "Subordinate can take a read request", "May wait for ARVALID or be HIGH early. Recommended default HIGH.", "Table A2.2, p.30 · §A2.3, p.30 · §A2.3.2.2, p.32"],
      ["vr", "RVALID", "pl", "level", "Read data beat is valid", "Only after the AR handshake, only in response to a request, and never waits for RREADY.", "Table A2.2, p.30 · §A2.3.2.2, p.32 · §A3.2.2, p.55"],
      ["vr", "RREADY", "lp", "level", "Manager can take a read data beat", "May wait for RVALID. A Manager must be able to take all read data of a request it issued without depending on other transactions.", "Table A2.2, p.30 · §A2.3.2.2, p.32 · §A2.6, p.41"],
      ["last", "WLAST", "lp", "level", "Final write beat of the transaction", "HIGH with the last beat only. BVALID waits for this beat. Can be omitted when WLAST_Present is False.", "Table A3.20, p.53 · §A2.3.2.1, p.31"],
      ["last", "RLAST", "pl", "level", "Final read beat of the transaction", "HIGH with the last beat only. Can be omitted when RLAST_Present is False.", "Table A3.24, p.55"],
      ["cr", "xPENDING (AW, W, B, AR, R)", "tx", "level", "A transfer might occur next cycle", "Must be HIGH the cycle before VALID. May stay HIGH forever, even in reset; default tie-off 0b1.", "Table A2.3, p.33 · §A2.4.4, p.38 · Table A2.9, p.39"],
      ["cr", "AWCRDT, WCRDT [Num_RP_AWW-1:0]", "rx", "pulse", "One credit per bit per cycle, per Resource Plane", "LOW in reset. Driven by the Subordinate (the receiver of AW and W).", "§A2.4.1, p.34 · Table A2.9, p.39"],
      ["cr", "ARCRDT [Num_RP_AR-1:0]", "rx", "pulse", "One AR credit per bit per cycle", "LOW in reset. Driven by the Subordinate.", "§A2.4.1, p.34 · Table A2.9, p.39"],
      ["cr", "BCRDT, RCRDT", "rx", "pulse", "One response credit per cycle", "Driven by the Manager, the receiver of B and R. One Resource Plane only.", "§A2.4.2, p.35 · Table A2.9, p.39"],
      ["cr", "xCRDTSH (AW, W, AR)", "rx", "pulse", "One shared credit, usable on any RP", "Only when Shared_Credits_x is True. May be given without any CRDT.", "§A2.4.3, p.36 · Table A2.9, p.39"],
      ["cr", "xRP (AW, W, AR)", "tx", "bus", "Resource Plane of this transfer", "clog2(Num_RP) bits; absent when Num_RP is 1. AW and W of one transaction use the same RP.", "§A2.4.2, p.35 · Table A2.9, p.39"],
      ["cr", "xSHAREDCRD (AW, W, AR)", "tx", "level", "This transfer spends a shared credit", "Sent with VALID. Recommended only when no dedicated credit for that RP is left.", "§A2.4.3, p.36 · Table A2.9, p.39"]
    ],

    wgroups: [["all", "All"], ["hs", "Handshake"], ["dep", "Dependencies"], ["rst", "Clock & reset"], ["pipe", "Register stages"], ["txn", "Transactions"], ["cr", "Credited transport"]],

    minis: [
      { tag: "Case 1", title: "VALID before READY", text: "The transmitter raises VALID and holds the payload. The receiver takes its time; the transfer happens in the cycle where both are HIGH. Figure A2.2.", ref: "§A2.3 and Figure A2.2, p.29",
        w: { n: 6, aria: "VALID rises at cycle 1, READY at cycle 3, transfer at cycle 3", sig: [
          { name: "INFO", d: "lp", t: "bus", v: seq([["", 1], ["A", 3], ["", 2]]) },
          { name: "VALID", d: "lp", t: "bit", v: bits(6, [[1, 3]]) },
          { name: "READY", d: "pl", t: "bit", v: bits(6, [[3, 3]]) },
          { name: "transfer", d: "sb", t: "note", v: seq([["", 3], ["▲", 1], ["", 2]]) } ] } },
      { tag: "Case 2", title: "READY before VALID", text: "The receiver is ready first, so the transfer takes a single cycle once VALID arrives. This is why the spec recommends READY HIGH by default on request channels. Figure A2.3.", ref: "§A2.3 and Figure A2.3, p.29 · p.30",
        w: { n: 6, aria: "READY rises at cycle 1, VALID at cycle 2, transfer at cycle 2", sig: [
          { name: "INFO", d: "lp", t: "bus", v: seq([["", 2], ["A", 1], ["", 3]]) },
          { name: "VALID", d: "lp", t: "bit", v: bits(6, [[2, 2]]) },
          { name: "READY", d: "pl", t: "bit", v: bits(6, [[1, 3]]) },
          { name: "transfer", d: "sb", t: "note", v: seq([["", 2], ["▲", 1], ["", 3]]) } ] } },
      { tag: "Case 3", title: "VALID with READY", text: "Both rise in the same cycle and the transfer happens there. Nothing waits on anything combinationally; each side decided on its own. Figure A2.4.", ref: "§A2.3 and Figure A2.4, p.30",
        w: { n: 6, aria: "VALID and READY rise together at cycle 1, transfer at cycle 1", sig: [
          { name: "INFO", d: "lp", t: "bus", v: seq([["", 1], ["A", 1], ["", 4]]) },
          { name: "VALID", d: "lp", t: "bit", v: bits(6, [[1, 1]]) },
          { name: "READY", d: "pl", t: "bit", v: bits(6, [[1, 1]]) },
          { name: "transfer", d: "sb", t: "note", v: seq([["", 1], ["▲", 1], ["", 4]]) } ] } },
      { tag: "Legal", title: "READY may drop before VALID", text: "A receiver may raise READY and lower it again while VALID is still LOW. It may not lower VALID: once VALID is HIGH it stays HIGH, with the same payload, until the cycle READY is also HIGH.", ref: "§A2.3, p.29",
        w: { n: 8, aria: "READY pulses at cycles 1 and 2 with VALID low, VALID rises at 3 and holds until READY at 5", sig: [
          { name: "INFO", d: "lp", t: "bus", v: seq([["", 3], ["A", 3], ["B", 1], ["", 1]]) },
          { name: "VALID", d: "lp", t: "bit", v: bits(8, [[3, 6]]) },
          { name: "READY", d: "pl", t: "bit", v: bits(8, [[1, 2], [5, 6]]) },
          { name: "transfer", d: "sb", t: "note", v: seq([["", 5], ["▲A", 1], ["▲B", 1], ["", 1]]) } ] } }
    ],

    scenarios: [
      {
        id: "wr", tab: "Write burst", title: "One write: AW, four W beats, one B",
        desc: "A 4-beat INCR write (AWLEN = 3). The request and the first beat go out together; the Subordinate stalls one data beat; the response waits for both the request and the last beat.",
        ref: "§A2.3, p.29–30 · §A2.3.2.1 and Figure A2.5, p.31 · §A3.2.1, p.53",
        n: 11, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(11, [[1, 2]]) },
          { name: "AWREADY", d: "pl", t: "bit", v: bits(11, [[2, 10]]) },
          { name: "AW payload", d: "lp", t: "bus", v: seq([["", 1], ["0x1000 len 3", 2], ["", 8]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(11, [[2, 6]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(11, [[2, 3], [5, 6]]) },
          { name: "WDATA", d: "lp", t: "bus", v: seq([["", 2], ["D0", 1], ["D1", 1], ["D2", 2], ["D3", 1], ["", 4]]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(11, [[6, 6]]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(11, [[8, 9]]) },
          { name: "BREADY", d: "lp", t: "bit", v: bits(11, [[9, 10]]) },
          { name: "BRESP", d: "pl", t: "bus", v: seq([["", 8], ["OKAY", 2], ["", 1]]) },
          { name: "handshakes", d: "sb", t: "note", v: seq([["", 2], ["AW+W0", 1], ["W1", 1], ["", 1], ["W2", 1], ["W3", 1], ["", 2], ["B", 1], ["", 1]]) }
        ],
        steps: [
          { r: [1, 1], t: "The request goes out; the Subordinate is not ready yet", x: "AWVALID rises with the address, ID and length. AWREADY is LOW for one cycle, which the Subordinate is allowed to do. The Manager holds AWVALID and the payload exactly as they are.", w: "VALID that could drop would let a transmitter withdraw a request the receiver had already started acting on. Holding it makes 'VALID and READY both HIGH' an unambiguous point of transfer.", s: "§A2.3, p.29 · §A2.3.2.1, p.31" },
          { r: [2, 2], t: "Request and first data beat in the same cycle", x: "AWREADY rises and so does WVALID with D0. Both channels handshake in cycle 2. The Manager did not wait for AWREADY before starting write data; data could even have come first.", w: "If a Manager could wait for AWREADY before WVALID, and a Subordinate (legally) waits for WVALID before AWREADY, both wait forever. The rule removes one side of that cycle.", s: "§A2.3.2.1, p.31 · §A2.6, p.41" },
          { r: [3, 5], t: "A stalled beat", x: "D1 moves in cycle 3. In cycle 4 WREADY is LOW, so D2 stays on WDATA with WVALID HIGH; it moves in cycle 5. The Subordinate decides beat by beat.", s: "§A2.3, p.29" },
          { r: [6, 6], t: "Last beat carries WLAST", x: "D3 is the fourth beat of AWLEN = 3, so WLAST is HIGH with it. The Subordinate now has everything it needs to respond.", s: "§A3.2.1, p.53" },
          { r: [7, 9], t: "Response: after AW and WLAST, never after BREADY", x: "BVALID rises in cycle 8, after both the AW handshake and the WLAST handshake. The Manager holds BREADY LOW for a cycle (it may wait for BVALID); BVALID and BRESP stay put and the response moves in cycle 9.", w: "BVALID must never wait for BREADY, for the same reason as every VALID: the receiver is allowed to wait for VALID, so the transmitter must not wait for READY.", s: "§A2.3.2.1, p.31" }
        ]
      },
      {
        id: "wfirst", tab: "Data before address", title: "Write data arrives before the request",
        desc: "Legal and common when the AW path has more register stages than the W path. The Subordinate takes the data early but must hold its response until it has also accepted the request. AXI3 did not require that.",
        ref: "§A2.6, p.41 · §A2.3.2.1, p.31 · H.c §A3.3.1, p.A3-45–A3-46",
        n: 12, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(12, [[5, 6]]) },
          { name: "AWREADY", d: "pl", t: "bit", v: bits(12, [[6, 6]]) },
          { name: "AW payload", d: "lp", t: "bus", v: seq([["", 5], ["0x2040 len 1", 2], ["", 5]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(12, [[1, 2]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(12, [[1, 2]]) },
          { name: "WDATA", d: "lp", t: "bus", v: seq([["", 1], ["D0", 1], ["D1", 1], ["", 9]]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(12, [[2, 2]]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(12, [[7, 7]]) },
          { name: "BREADY", d: "lp", t: "bit", v: bits(12, [[0, 11]]) },
          { name: "BRESP", d: "pl", t: "bus", v: seq([["", 7], ["OKAY", 1], ["", 4]]) },
          { name: "rule", d: "sb", t: "note", v: seq([["", 3], ["AXI3 could respond here", 2], ["", 1], ["AW ok", 1], ["B", 1], ["", 4]]) }
        ],
        steps: [
          { r: [1, 2], t: "Two beats arrive with no request", x: "WVALID rises before any AWVALID. The Subordinate may raise WREADY before AWVALID, and does. D1 carries WLAST.", w: "AXI fixes no timing between channels, so each channel can be registered independently. The price is that receivers must cope with any arrival order.", s: "§A2.6, p.41 · §A2.3.2.1, p.31 · §A2.5, p.40" },
          { r: [3, 4], t: "All data is in, but no response yet", x: "The Subordinate has the whole burst. In AXI4 and AXI5 it must still wait for AWVALID and AWREADY before BVALID. An AXI3 Subordinate was allowed to respond here.", w: "By responding, a Subordinate takes responsibility for hazard checking this write against every later transaction. Without the address it cannot do that check.", s: "§A2.3.2.1, p.31 · H.c §A3.3.1, p.A3-46" },
          { r: [5, 6], t: "The request turns up", x: "AWVALID rises in cycle 5; the Subordinate accepts it in cycle 6. An interconnect in the path would have had to hold the W beats until it had decoded this address, so it knew which Subordinate to show them to.", s: "§A2.6, p.41" },
          { r: [7, 7], t: "Response in one cycle", x: "BVALID rises and BREADY was already HIGH (a Manager may assert BREADY before BVALID), so the response completes in a single cycle.", s: "§A2.3.2.1, p.31" }
        ]
      },
      {
        id: "rd", tab: "Read burst", title: "Two outstanding reads, then backpressure on R",
        desc: "Two 2-beat reads with the same ID (a at 0x3000, b at 0x3040, both ARID 2, ARLEN 1), issued back to back. Read data follows in request order (same ID). The Manager throttles the second burst with RREADY.",
        ref: "§A2.3.2.2 and Figure A2.6, p.32 · §A3.2.2, p.55 · §A2.6, p.41",
        n: 14, gaps: [],
        sig: [
          { name: "ARVALID", d: "lp", t: "bit", v: bits(14, [[1, 2]]) },
          { name: "ARREADY", d: "pl", t: "bit", v: bits(14, [[0, 13]]) },
          { name: "AR payload", d: "lp", t: "bus", v: seq([["", 1], ["a", 1], ["b", 1], ["", 11]]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(14, [[4, 9]]) },
          { name: "RREADY", d: "lp", t: "bit", v: bits(14, [[0, 5], [8, 13]]) },
          { name: "RDATA", d: "pl", t: "bus", v: seq([["", 4], ["a0", 1], ["a1", 1], ["b0", 3], ["b1", 1], ["", 4]]) },
          { name: "RLAST", d: "pl", t: "bit", v: bits(14, [[5, 5], [9, 9]]) },
          { name: "handshakes", d: "sb", t: "note", v: seq([["", 1], ["AR a", 1], ["AR b", 1], ["", 1], ["R a0", 1], ["R a1", 1], ["", 2], ["R b0", 1], ["R b1", 1], ["", 4]]) }
        ],
        steps: [
          { r: [1, 2], t: "Two requests, back to back", x: "ARREADY sits HIGH (the recommended default for request channels), so each ARVALID cycle is one accepted request. The Manager does not wait for the first read to finish before issuing the second.", w: "Multiple outstanding requests are how AXI hides memory latency: the Subordinate can work on b while a's data is still in flight.", s: "§A2.3, p.30 · §A1.1, p.21" },
          { r: [3, 3], t: "Latency", x: "No RVALID yet. RVALID may only follow an accepted AR, and only in response to a request, even for a Subordinate with a single data source.", s: "§A2.3.2.2, p.32 · §A3.2.2, p.55" },
          { r: [4, 5], t: "Burst a returns", x: "a0 and a1 move in consecutive cycles; RLAST marks a1. Same ID, so a's data comes before b's.", s: "§A3.2.2, p.55 · §A2.6, p.41" },
          { r: [6, 8], t: "The Manager throttles", x: "RREADY drops for two cycles. RVALID stays HIGH and b0 stays on RDATA; it moves in cycle 8. The Subordinate did not wait for RREADY to raise RVALID.", w: "A Manager may slow R down, but it must be able to accept all the read data of a request it issued without waiting on any other transaction. Otherwise a slow R channel could block the very traffic that would free it.", s: "§A2.3.2.2, p.32 · §A2.6, p.41" },
          { r: [9, 9], t: "Last beat", x: "b1 with RLAST completes the second read.", s: "§A3.2.2, p.55" }
        ]
      },
      {
        id: "dead", tab: "Deadlock", title: "The classic AW/W deadlock, then the fix",
        desc: "Left of the break: a Manager waits for AWREADY before driving WVALID, while the Subordinate waits for both VALIDs before AWREADY. Nothing ever moves. Right of the break: the same pair with a compliant Manager.",
        ref: "§A2.3.2.1, p.31 · H.c §A3.3.1 Caution, p.A3-46",
        n: 16, gaps: [7],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(16, [[1, 6], [9, 10]]) },
          { name: "AWREADY", d: "pl", t: "bit", v: bits(16, [[10, 10]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(16, [[9, 10]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(16, [[10, 10]]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(16, [[9, 10]]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(16, [[12, 12]]) },
          { name: "BREADY", d: "lp", t: "bit", v: bits(16, [[0, 15]]) },
          { name: "Manager", d: "lp", t: "note", v: seq([["", 1], ["waits for AWREADY before WVALID ✗", 6], ["", 1], ["", 1], ["AW + W, no waiting ✓", 2], ["", 5]]) },
          { name: "Subordinate", d: "pl", t: "note", v: seq([["", 1], ["waits for AWVALID and WVALID (legal)", 6], ["", 3], ["takes both", 1], ["", 1], ["B", 1], ["", 3]]) }
        ],
        steps: [
          { r: [1, 6], t: "Both sides wait, forever", x: "AWVALID is HIGH. The Manager holds WVALID LOW until it sees AWREADY. The Subordinate's design waits for AWVALID and WVALID before it raises AWREADY. Each is waiting for the other, so the bus hangs with no protocol error to point at.", w: "The Subordinate's behaviour is explicitly allowed. The Manager's is explicitly forbidden: it must not wait for AWREADY or WREADY before asserting AWVALID or WVALID. The spec puts the burden on the transmitter so that receivers are free to wait.", s: "§A2.3.2.1, p.31 · H.c §A3.3.1, p.A3-46" },
          { r: [8, 10], t: "The fix: drive both without waiting", x: "A compliant Manager raises AWVALID and WVALID independently. The Subordinate sees both and takes them in cycle 10.", s: "§A2.3.2.1, p.31" },
          { r: [11, 12], t: "Response", x: "BVALID follows the AW and last-W handshakes; BREADY is already HIGH.", s: "§A2.3.2.1, p.31" }
        ]
      },
      {
        id: "reset", tab: "Reset exit", title: "Leaving reset",
        desc: "ARESETn may assert at any time but deasserts on a clock edge. Every VALID (and every CRDT on a credited interface) stays LOW until at least the rising edge after ARESETn is HIGH.",
        ref: "§A2.1.2 and Figure A2.1, p.27 · §A2.3, p.29 · §A2.4.1, p.34 · §A2.4.4, p.38",
        n: 10, gaps: [],
        sig: [
          { name: "ARESETn", d: "sb", t: "bit", v: bits(10, [[4, 9]]) },
          { name: "AWVALID / ARVALID", d: "lp", t: "bit", v: bits(10, [[5, 6]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(10, [[5, 5]]) },
          { name: "RVALID / BVALID", d: "pl", t: "bit", v: bits(10, []) },
          { name: "xREADY", d: "pl", t: "note", v: seq([["any value", 4], ["", 6]]) },
          { name: "xCRDT (credited)", d: "pl", t: "bit", v: bits(10, [[6, 6]]) },
          { name: "xPENDING (credited)", d: "lp", t: "bit", v: bits(10, [[0, 9]]) }
        ],
        steps: [
          { r: [0, 3], t: "In reset", x: "All VALID signals are LOW. On a credited interface every CRDT and CRDTSH is LOW too: the transmitter has no credits and the receiver holds them all. READY and payload signals can be anything. PENDING may sit HIGH, even through reset.", s: "§A2.1.2, p.27 · §A2.3, p.29 · §A2.4.1, p.34 · §A2.4.4, p.38" },
          { r: [4, 4], t: "ARESETn deasserts on an edge", x: "ARESETn goes HIGH synchronously with ACLK. VALIDs are still LOW in this cycle: the earliest a deasserted-in-reset signal may rise is the rising edge after ARESETn is HIGH.", w: "Reset is released to many flops through a tree with skew. One cycle of margin guarantees that both sides have left reset before anything moves, so no transfer is lost into a flop still held in reset.", s: "§A2.1.2 and Figure A2.1, p.27 · Table B4.3, p.311" },
          { r: [5, 6], t: "First traffic", x: "The Manager may now raise AWVALID, ARVALID and WVALID. On a credited link the receiver hands out its first credit; no request can move on a credited channel until one arrives.", s: "§A2.1.2, p.27 · §A2.4.1, p.34" }
        ]
      },
      {
        id: "crdt", tab: "Credits", title: "Credited channel with two credits (Figure A2.7)",
        desc: "An AR channel on a credited interface. The Subordinate (receiver) owns two buffer entries and hands one credit out per entry. PENDING announces each transfer a cycle ahead.",
        ref: "§A2.4.1 and Figure A2.7, p.34 · §A2.4.4, p.38",
        n: 11, gaps: [],
        sig: [
          { name: "ARESETn", d: "sb", t: "bit", v: bits(11, [[1, 10]]) },
          { name: "ARCRDT", d: "pl", t: "bit", v: bits(11, [[3, 4], [7, 7]]) },
          { name: "ARPENDING", d: "lp", t: "bit", v: bits(11, [[3, 4], [7, 7]]) },
          { name: "ARVALID", d: "lp", t: "bit", v: bits(11, [[4, 5], [8, 8]]) },
          { name: "AR payload", d: "lp", t: "bus", v: seq([["", 4], ["r0", 1], ["r1", 1], ["", 2], ["r2", 1], ["", 2]]) },
          { name: "Manager credits", d: "sb", t: "note", v: list("0 0 0 0 1 1 0 0 1 0 0") }
        ],
        steps: [
          { r: [0, 2], t: "No credits", x: "After reset the transmitter has no credits and the receiver has all of them. ARVALID must stay LOW.", s: "§A2.4.1, p.34" },
          { r: [3, 3], t: "First credit", x: "ARCRDT pulses: one credit. It cannot be spent in the same cycle it arrives, because there must be no combinational path between credit signals and the rest of the channel.", w: "That rule is the whole point of credits: both directions are registered, so a credited channel closes timing at high frequency where a READY path that fans out across a die would not.", s: "§A2.4.1, p.34 · §A2.2, p.28" },
          { r: [4, 5], t: "Spend, refill, spend", x: "Cycle 4: the credit is spent on r0 and a second credit arrives. Cycle 5: r1 spends it. ARPENDING was HIGH in the cycle before each ARVALID, so a gated receiver could wake its clock in time.", s: "§A2.4.1, p.34 · §A2.4.4, p.38" },
          { r: [6, 7], t: "Buffer frees, credit returns", x: "The Subordinate drains r0 from its buffer and returns the credit in cycle 7. The Manager has nothing to send until then.", s: "§A2.4.1 and Figure A2.7, p.34" },
          { r: [8, 10], t: "Credit spent again", x: "r2 goes out in cycle 8. The credit spent in cycle 4 is usable again only in cycle 8, a 4-cycle loop. With 2 credits this channel can never carry more than 2 transfers every 4 cycles: credits, not READY, now set the throughput.", w: "Sizing: to stream one transfer every cycle you need at least as many credits as the credit loop's round-trip latency in cycles. The spec caps it at 15 per Resource Plane.", s: "Derived from §A2.4.1, p.34" }
        ]
      },
      {
        id: "rp", tab: "Resource Planes", title: "Three Resource Planes and shared credits (Figure A2.8)",
        desc: "A channel with Num_RP = 3 and shared credits. Each plane has its own credits; a shared credit can carry a transfer on any plane. Count rows show credits held at the start of each cycle.",
        ref: "§A2.4.2, p.35 · §A2.4.3 and Figure A2.8, p.36–37",
        n: 11, gaps: [],
        sig: [
          { name: "CRDT[0]", d: "pl", t: "bit", v: bits(11, [[1, 1], [9, 9]]) },
          { name: "CRDT[1]", d: "pl", t: "bit", v: bits(11, [[1, 1], [3, 3]]) },
          { name: "CRDT[2]", d: "pl", t: "bit", v: bits(11, [[1, 1], [7, 7]]) },
          { name: "CRDTSH", d: "pl", t: "bit", v: bits(11, [[1, 1], [7, 7], [9, 9]]) },
          { name: "VALID", d: "lp", t: "bit", v: bits(11, [[2, 2], [5, 6], [8, 8]]) },
          { name: "SHAREDCRD", d: "lp", t: "bit", v: bits(11, [[6, 6]]) },
          { name: "RP[1:0]", d: "lp", t: "bus", v: seq([["", 2], ["RP1", 1], ["", 2], ["RP2", 2], ["", 1], ["RP0", 1], ["", 2]]) },
          { name: "RP0 credits", d: "sb", t: "note", v: list("0 0 1 1 1 1 1 1 1 0 1") },
          { name: "RP1 credits", d: "sb", t: "note", v: list("0 0 1 0 1 1 1 1 1 1 1") },
          { name: "RP2 credits", d: "sb", t: "note", v: list("0 0 1 1 1 1 0 0 1 1 1") },
          { name: "shared credits", d: "sb", t: "note", v: list("0 0 1 1 1 1 1 0 1 1 2") }
        ],
        steps: [
          { r: [0, 1], t: "One credit per plane, plus one shared", x: "The receiver gives each Resource Plane one dedicated credit and one shared credit in cycle 1. One dedicated credit per RP is the minimum it must be able to give.", s: "§A2.4.2, p.35 · §A2.4.3, p.36" },
          { r: [2, 3], t: "RP1 transfer", x: "A transfer on RP1 spends RP1's dedicated credit. The receiver returns it in cycle 3.", s: "Figure A2.8, p.37" },
          { r: [5, 6], t: "Two RP2 transfers: dedicated, then shared", x: "Cycle 5 spends RP2's only dedicated credit. Cycle 6 sends a second RP2 transfer with SHAREDCRD HIGH, spending the shared credit.", w: "Use dedicated credits first. A shared credit can rescue any plane; spending it when a dedicated one was available could starve a plane later.", s: "§A2.4.3, p.36" },
          { r: [7, 8], t: "Refill and an RP0 transfer", x: "Cycle 7 returns RP2's dedicated credit and the shared credit. Cycle 8 sends on RP0.", s: "Figure A2.8, p.37" },
          { r: [9, 10], t: "Why planes exist", x: "If RP2's consumer stalled, RP2 would run out of credits while RP0 and RP1 kept moving: transfers on different planes must not block one another. That independence is what lets a system put deadlock-sensitive traffic on its own plane.", s: "§A2.4.2, p.35" }
        ]
      },
      {
        id: "slice", tab: "Register slice", title: "A full register slice: one cycle more latency, no lost throughput",
        desc: "A 2-entry slice between Manager and Subordinate on AW. Its READY to the Manager comes from a flop, not from the Subordinate's READY. The Subordinate stalls for two cycles; the slice absorbs it.",
        ref: "§A2.5, p.40 · slice design is background",
        n: 14, gaps: [],
        sig: [
          { name: "M side AWVALID", d: "lp", t: "bit", v: "01111111100000" },
          { name: "M side AWREADY", d: "pl", t: "bit", v: "11111100111111" },
          { name: "M side payload", d: "lp", t: "bus", v: seq([["", 1], ["A", 1], ["B", 1], ["C", 1], ["D", 1], ["E", 1], ["F", 3], ["", 5]]) },
          { name: "S side AWVALID", d: "lp", t: "bit", v: "00111111110000" },
          { name: "S side AWREADY", d: "pl", t: "bit", v: "11111001111111" },
          { name: "S side payload", d: "lp", t: "bus", v: seq([["", 2], ["A", 1], ["B", 1], ["C", 1], ["D", 3], ["E", 1], ["F", 1], ["", 4]]) },
          { name: "slice entries", d: "sb", t: "note", v: list("0 0 1 1 1 1 2 2 1 1 0 0 0 0") }
        ],
        steps: [
          { r: [1, 4], t: "Streaming: +1 cycle, full rate", x: "A enters the slice in cycle 1 and appears on the Subordinate side in cycle 2. Every cycle one request goes in and one comes out.", w: "Because AXI ties no channel to another, the spec lets you put any number of register stages on VALID, READY and CRDT paths. This is how long wires across a big SoC meet timing.", s: "§A2.5, p.40" },
          { r: [5, 7], t: "Subordinate stalls; the slice fills", x: "S side AWREADY is LOW in cycles 5 and 6. D waits on the S side, E still enters, and the slice now holds two entries. Only then does M side AWREADY drop (cycles 6 and 7), so F waits on the Manager side.", w: "The Manager-facing READY comes from the slice's own state, so there is no combinational path from the Subordinate's READY through the slice. A single-entry slice would need one, or lose every other cycle.", s: "§A2.1.1, p.27 · §A2.5, p.40 · design is background" },
          { r: [7, 9], t: "Drain", x: "The Subordinate is ready again; D, E and F leave one per cycle (cycles 7 to 9), and the slice accepts F from the Manager in cycle 8.", s: "§A2.5, p.40" },
          { r: [11, 13], t: "What the spec requires of the slice", x: "VALID is delayed by the same number of cycles as its payload; a credited channel would also delay RP and SHAREDCRD with it and keep PENDING one cycle ahead of VALID.", s: "§A2.5, p.40" }
        ]
      }
    ]
  };
})();
