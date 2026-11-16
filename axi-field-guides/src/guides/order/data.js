(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  function at(n, s, labels) { var a = []; for (var i = 0; i < n; i++) a.push(""); labels.forEach(function (l, k) { a[s + k] = l; }); return a; }

  window.PAGE = {
    CW: 46,
    dirName: { lp: "Manager", pl: "Subordinate", cfg: "Property" },
    dirCls: { cfg: "sb" },
    groups: [["all", "All"], ["id", "IDs"], ["unq", "Unique ID"], ["chunk", "Read chunking"], ["prop", "Properties"]],
    sigs: [
      ["id", "AWID [ID_W_WIDTH-1:0]", "lp", "bus", "Write transaction ID", "Same AWID ⇒ responses in request order. Interconnects append bits per Manager port.", "Table A5.1, p.90 · §A5.4, p.99"],
      ["id", "BID [ID_W_WIDTH-1:0]", "pl", "bus", "Write response ID", "Must equal the AWID of the request it answers.", "Table A5.1, p.90 · §A5.5, p.100"],
      ["id", "ARID [ID_R_WIDTH-1:0]", "lp", "bus", "Read transaction ID", "Same ARID ⇒ data in request order; different ARIDs may return in any order and interleave.", "Table A5.1, p.90 · §A5.6, p.101"],
      ["id", "RID [ID_R_WIDTH-1:0]", "pl", "bus", "Read data ID", "Must equal the ARID of the request; may change beat to beat when interleaving.", "Table A5.1, p.90 · §A5.6, p.101"],
      ["unq", "AWIDUNQ, ARIDUNQ", "lp", "level", "This ID is unique among my in-flight requests", "No outstanding same-ID request on that channel; no reuse of the ID until this one completes.", "Table A5.4, p.91"],
      ["unq", "BIDUNQ, RIDUNQ", "pl", "level", "Echo of the request's xIDUNQ", "BIDUNQ on the Completion response; RIDUNQ on every beat. For Atomics, RIDUNQ follows AWIDUNQ.", "§A5.2, p.91–92"],
      ["chunk", "ARCHUNKEN", "lp", "level", "Subordinate may return 128-bit chunks in any order", "Only for unique-ID, 16-byte-aligned, full-width (or 1-beat) INCR/WRAP reads of the listed opcodes.", "Table A5.10, p.102 · §A5.6.2.2, p.103"],
      ["chunk", "RCHUNKV", "pl", "level", "RCHUNKNUM and RCHUNKSTRB are valid", "Same value on every beat of the transaction; 0 if ARCHUNKEN was 0.", "Table A5.10, p.102 · §A5.6.2.2, p.103–104"],
      ["chunk", "RCHUNKNUM", "pl", "bus", "Which chunk this beat carries", "0 to ARLEN when valid.", "Table A5.10, p.102 · Table A5.11, p.103"],
      ["chunk", "RCHUNKSTRB", "pl", "bus", "Which 128-bit slices of RDATA are valid", "Never 0 when valid; LSB = lowest 128 bits. Chunks below an unaligned ARADDR are never sent.", "Table A5.10, p.102 · p.104"],
      ["prop", "ID_W_WIDTH, ID_R_WIDTH", "cfg", "0…32", "ID widths", "0 = no ID signals. A Subordinate without IDs can't serve a Manager with IDs.", "Table A5.2, p.90"],
      ["prop", "Unique_ID_Support", "cfg", "bool", "xIDUNQ signals present", "Default False.", "Table A5.3, p.91"],
      ["prop", "Read_Interleaving_Disabled", "cfg", "bool", "No interleaved read data", "Default False. Every Manager issuing multiple IDs must still be able to accept interleaving.", "Table A5.8, p.101"],
      ["prop", "Read_Data_Chunking", "cfg", "bool", "Chunking signals present", "Default False.", "Table A5.9, p.102"],
      ["prop", "Device_Normal_Independence", "cfg", "bool", "Device and Normal NC may pass each other", "Default False (ordered). Manager False + Subordinate True is incompatible.", "Tables A5.5–A5.6, p.97"],
      ["prop", "Ordered_Write_Observation", "cfg", "bool", "Same-ID writes observed in order, whatever the address", "Default False. Helps bridges from producer–consumer protocols such as PCIe.", "Table A5.7, p.98"]
    ],

    wgroups: [["all", "All"], ["id", "IDs"], ["model", "Ordering model"], ["early", "Early responses"], ["data", "Data ordering"], ["opt", "Options"]],

    scenarios: [
      {
        id: "ooo", tab: "Out of order", title: "Different IDs: the fast one finishes first",
        desc: "Read a (ARID 0) goes to slow DDR; read b (ARID 1) to fast SRAM through the same interconnect. b's data comes back first. Legal, because the IDs differ.",
        ref: "§A5.1, p.90 · §A5.3, p.93 · §A5.6, p.101",
        n: 13, gaps: [],
        sig: [
          { name: "ARVALID", d: "lp", t: "bit", v: bits(13, [[1, 2]]) },
          { name: "ARID", d: "lp", t: "bus", v: seq([["", 1], ["0 → DDR", 1], ["1 → SRAM", 1], ["", 10]]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(13, [[4, 5], [9, 10]]) },
          { name: "RID", d: "pl", t: "bus", v: at(13, 4, ["1", "1", "", "", "", "0", "0"]) },
          { name: "RLAST", d: "pl", t: "bit", v: bits(13, [[5, 5], [10, 10]]) }
        ],
        steps: [
          { r: [1, 2], t: "Two IDs, two destinations", x: "The Manager issues a then b without waiting. Different IDs carry no ordering promise between them.", w: "One physical port behaves like several logical ports, one per ID, each in order. That is what lets a CPU overlap a cache miss with other traffic.", s: "§A5.1, p.90 · §A5.3, p.93" },
          { r: [4, 5], t: "b returns first", x: "SRAM answers in two cycles; its RID 1 data reaches the Manager before DDR has produced anything for a.", s: "§A5.6, p.101" },
          { r: [9, 10], t: "a returns later", x: "DDR's data for ID 0 arrives. The Manager matched each beat by RID, so the order didn't matter.", s: "§A5.6, p.101" }
        ]
      },
      {
        id: "same", tab: "Same ID, two targets", title: "Same ID to two Subordinates: the interconnect must keep order",
        desc: "Read a (ARID 2) to slow S0, then read b (ARID 2) to fast S1. The Manager must see a's data first. A common implementation: hold b at the interconnect until a's data has returned.",
        ref: "§A5.6, p.101 · §A5.3.6, p.96",
        n: 15, gaps: [],
        sig: [
          { name: "M ARVALID", d: "lp", t: "bit", v: bits(15, [[1, 2]]) },
          { name: "M AR", d: "lp", t: "bus", v: seq([["", 1], ["a ID2→S0", 1], ["b ID2→S1", 1], ["", 12]]) },
          { name: "S0 ARVALID", d: "lp", t: "bit", v: bits(15, [[2, 2]]) },
          { name: "S1 ARVALID", d: "lp", t: "bit", v: bits(15, [[10, 10]]) },
          { name: "S0 RVALID", d: "pl", t: "bit", v: bits(15, [[8, 9]]) },
          { name: "S1 RVALID", d: "pl", t: "bit", v: bits(15, [[12, 13]]) },
          { name: "M RVALID", d: "pl", t: "bit", v: bits(15, [[9, 10], [13, 14]]) },
          { name: "M RDATA", d: "pl", t: "bus", v: at(15, 9, ["a0", "a1", "", "", "b0", "b1"]) },
          { name: "interconnect", d: "sb", t: "note", v: seq([["", 3], ["holds b: ID 2 busy at S0", 7], ["", 5]]) }
        ],
        steps: [
          { r: [1, 2], t: "Same ID, different Subordinates", x: "Both reads use ARID 2. The interconnect forwards a to S0 at once.", s: "§A5.3, p.93" },
          { r: [3, 9], t: "b is held back", x: "If b went to S1 now, S1 would answer first and the interconnect would have to buffer b's data. Many interconnects instead block a same-ID request to a different Subordinate until the earlier one completes.", w: "The rule is only that the Manager receives same-ID data in request order. Holding the request is the cheapest way to guarantee it; reorder buffers are the fast way.", s: "§A5.6, p.101 · §A5.3.6, p.96 · design choice is background" },
          { r: [10, 14], t: "b goes, data stays in order", x: "Once a1 (RLAST) has passed, b is released to S1 and its data follows. The Manager sees a0, a1, b0, b1.", s: "§A5.6, p.101" }
        ]
      },
      {
        id: "intl", tab: "Read interleaving", title: "Read data from two IDs, interleaved beat by beat",
        desc: "Two 4-beat reads, ARID 0 and ARID 1. The Subordinate alternates beats. RID tells the Manager which buffer each beat goes to; RLAST appears once per transaction.",
        ref: "§A5.6.1, p.101",
        n: 12, gaps: [],
        sig: [
          { name: "ARVALID", d: "lp", t: "bit", v: bits(12, [[1, 2]]) },
          { name: "ARID", d: "lp", t: "bus", v: at(12, 1, ["0", "1"]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(12, [[3, 10]]) },
          { name: "RID", d: "pl", t: "bus", v: at(12, 3, ["0", "1", "0", "1", "0", "0", "1", "1"]) },
          { name: "beat", d: "sb", t: "note", v: at(12, 3, ["A0", "B0", "A1", "B1", "A2", "A3", "B2", "B3"]) },
          { name: "RLAST", d: "pl", t: "bit", v: bits(12, [[8, 8], [10, 10]]) }
        ],
        steps: [
          { r: [3, 6], t: "Alternating beats", x: "Different IDs may interleave. This includes Atomic transactions with multiple read beats.", w: "A memory controller can return whichever bank's data is ready, so one slow bank doesn't block another transaction's beats.", s: "§A5.6.1, p.101 · Table B4.2, p.309" },
          { r: [7, 8], t: "A finishes", x: "A3 carries RLAST for ID 0.", s: "§A3.2.2, p.55" },
          { r: [9, 10], t: "B finishes", x: "B3 carries RLAST for ID 1. Within each ID, beats were in order the whole time.", w: "A Manager that can't handle this can say so with Read_Interleaving_Disabled, but every Manager that issues several IDs must be designed to accept interleaving.", s: "§A5.6.1, p.101" }
        ]
      },
      {
        id: "chunk", tab: "Read chunking", title: "Read data chunking: a WRAP read returned chunk by chunk (Figure A5.4)",
        desc: "128-bit channel, ARADDR 0x10, Length 4, WRAP, ARCHUNKEN = 1, unique ID. The Subordinate uses the start address as a hint and sends 0x10 first, then the other chunks in whatever order is convenient.",
        ref: "§A5.6.2, p.102–106 · Figure A5.4, p.106",
        n: 9, gaps: [],
        sig: [
          { name: "ARVALID", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "AR", d: "lp", t: "bus", v: at(9, 1, ["0x10 L4 W CHUNKEN"]) },
          { name: "ARIDUNQ", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(9, [[3, 6]]) },
          { name: "RCHUNKV", d: "pl", t: "bit", v: bits(9, [[3, 6]]) },
          { name: "data address", d: "sb", t: "note", v: at(9, 3, ["0x10", "0x30", "0x00", "0x20"]) },
          { name: "RLAST", d: "pl", t: "bit", v: bits(9, [[6, 6]]) }
        ],
        steps: [
          { r: [1, 1], t: "Eligible request", x: "Size = 128-bit channel width, 16-byte aligned, WRAP, a ReadNoSnoop-type opcode, and the ID is unique in flight (ARIDUNQ asserted if present).", s: "§A5.6.2.2, p.103" },
          { r: [3, 6], t: "Chunks in Subordinate order", x: "RCHUNKV is HIGH on every beat. RCHUNKNUM names the chunk in each beat; this Subordinate sends 0x10, 0x30, 0x00, 0x20. RLAST marks only the final transfer, whatever chunk it carries.", w: "An AXI-to-CHI bridge or a cache can forward chunks as they arrive instead of buffering the whole line to put it back in order.", s: "§A5.6.2.2, p.104 · Figure A5.4, p.106" },
          { r: [6, 8], t: "Same bytes, maybe more beats", x: "The total bytes are the same as without chunking. On wider channels, chunks can make a transaction use more beats than ARLEN implies.", s: "§A5.6.2.2, p.104" }
        ]
      },
      {
        id: "wid", tab: "AXI3 WID vs AXI4", title: "Write data interleaving: allowed in AXI3, gone in AXI4",
        desc: "Left: an AXI3 Manager interleaves the W beats of writes A and B, using WID to say which is which. Right: the same writes on AXI4 or AXI5 Valid-Ready, where W must follow AW order with no interleaving.",
        ref: "H.c §A5.2.2, p.A5-81 · §A5.5, p.100",
        n: 16, gaps: [7],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(16, [[1, 2], [9, 10]]) },
          { name: "AWID", d: "lp", t: "bus", v: seq([["", 1], ["A", 1], ["B", 1], ["", 6], ["A", 1], ["B", 1], ["", 5]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(16, [[2, 5], [10, 13]]) },
          { name: "WID (AXI3 only)", d: "lp", t: "bus", v: seq([["", 2], ["A", 1], ["B", 1], ["A", 1], ["B", 1], ["", 10]]) },
          { name: "beat", d: "sb", t: "note", v: seq([["", 2], ["A0", 1], ["B0", 1], ["A1", 1], ["B1", 1], ["", 4], ["A0", 1], ["A1", 1], ["B0", 1], ["B1", 1], ["", 2]]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(16, [[4, 5], [11, 11], [13, 13]]) }
        ],
        steps: [
          { r: [1, 5], t: "AXI3: beats tagged with WID", x: "Write data of different IDs may interleave; WID carries the ID of each beat. The Subordinate needs a reassembly buffer per outstanding write.", s: "H.c Table A5-1 and §A5.2.2, p.A5-81" },
          { r: [9, 13], t: "AXI4 and later: in AW order", x: "There is no WID. W beats must come in the same order as the requests, one transaction at a time.", w: "Almost no Manager produced interleaved write data, yet every Subordinate had to pay for reassembly. Dropping it saved area and verification effort.", s: "§A5.5, p.100 · H.c p.A5-81" },
          { r: [10, 13], t: "The one exception today", x: "On a credited interface, write data on different Resource Planes may be interleaved and may even overtake each other. See the next tab.", s: "§A5.5, p.100 · §A2.4.2, p.35" }
        ]
      },
      {
        id: "rp", tab: "RP interleaving", title: "Write data across two Resource Planes (Figure A5.1)",
        desc: "Credited interface with two planes. ID0 and ID2 use RP0; ID1 uses RP1. Within each plane, data follows request order; across planes it may interleave and overtake. The beat-to-ID assignment below is one legal reading of the figure.",
        ref: "§A5.5 and Figure A5.1, p.100",
        n: 11, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(11, [[1, 3]]) },
          { name: "AWID", d: "lp", t: "bus", v: at(11, 1, ["ID0", "ID1", "ID2"]) },
          { name: "AWRP", d: "lp", t: "bus", v: at(11, 1, ["RP0", "RP1", "RP0"]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(11, [[2, 7]]) },
          { name: "WRP", d: "lp", t: "bus", v: at(11, 2, ["RP1", "RP0", "RP1", "RP0", "RP0", "RP1"]) },
          { name: "belongs to", d: "sb", t: "note", v: at(11, 2, ["ID1", "ID0", "ID1", "ID0", "ID2", "ID1"]) }
        ],
        steps: [
          { r: [1, 3], t: "Three requests, two planes", x: "The AW and W transfers of a transaction share a plane.", s: "§A2.4.2, p.35" },
          { r: [2, 2], t: "ID1's data first", x: "ID1's first beat goes before ID0's, although ID0 was requested first: they are on different planes.", s: "§A5.5, p.100" },
          { r: [3, 7], t: "Interleaved across planes, ordered within", x: "RP0 carries ID0, ID0, ID2 in request order; RP1 carries ID1's beats in between.", w: "Planes exist so traffic classes can't block each other. Requiring global W order would bring that blocking back.", s: "§A5.5, p.100" }
        ]
      }
    ]
  };
})();
