(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  function at(n, s, labels) { var a = []; for (var i = 0; i < n; i++) a.push(""); labels.forEach(function (l, k) { a[s + k] = l; }); return a; }

  window.PAGE = {
    CW: 48,
    dirName: { lp: "Manager", pl: "Subordinate", cfg: "Property" },
    dirCls: { cfg: "sb" },
    groups: [["all", "All"], ["resp", "Responses"], ["ex", "Exclusive"], ["atom", "Atomic"], ["op", "Opcodes"], ["prop", "Properties"]],
    sigs: [
      ["resp", "BRESP [BRESP_WIDTH-1:0]", "pl", "bus", "Result of a write-channel transaction", "One Completion response per transaction (plus a second for Persist or MTE Match). 2 or 3 bits; absent means OKAY.", "Tables A3.26–A3.28, p.61–62"],
      ["resp", "BCOMP", "pl", "level", "This B transfer is the Completion response", "Present only with features that give two write responses; HIGH on exactly one response per transaction.", "Table A3.26, p.61"],
      ["resp", "RRESP [RRESP_WIDTH-1:0]", "pl", "bus", "Result of each read data beat", "May differ beat to beat. Every beat is still sent, whatever the response.", "Tables A3.29–A3.31, p.62–63"],
      ["resp", "BBUSY, RBUSY [1:0]", "pl", "bus", "How busy the Subordinate is", "Higher = busier. Valid on every R beat and on the Completion B. Use is IMPLEMENTATION DEFINED.", "Table A3.35, p.65"],
      ["ex", "AWLOCK, ARLOCK", "lp", "level", "Exclusive access", "1 bit. Present when Exclusive_Accesses is True (the default).", "Table A6.2, p.110"],
      ["atom", "AWATOP [5:0]", "lp", "bus", "Atomic type, endianness and operation", "0 = not atomic; 01exxx AtomicStore, 10exxx AtomicLoad, 110000 Swap, 110001 Compare.", "Tables A6.7–A6.9, p.117–118"],
      ["atom", "BROADCASTATOMIC", "lp", "tie-off", "Manager input: may issue Atomics", "Default 1. Tie LOW when the system can't handle Atomics.", "Table A6.11, p.121"],
      ["op", "AWSNOOP [AWSNOOP_WIDTH-1:0]", "lp", "bus", "Write-channel Opcode", "With AWDOMAIN selects WriteNoSnoop, WriteUniquePtl, CMO, WriteZero, stash and so on. 0 for plain writes, Atomics and exclusives.", "Table A7.1, p.124 · Table A7.3, p.126–128"],
      ["op", "ARSNOOP [ARSNOOP_WIDTH-1:0]", "lp", "bus", "Read-channel Opcode", "With ARDOMAIN selects ReadNoSnoop, ReadOnce, ReadShared, CMOs, DVM Complete. 0 for plain reads and exclusives.", "Table A7.1, p.124 · Table A7.4, p.129–130"],
      ["prop", "BRESP_WIDTH, RRESP_WIDTH", "cfg", "0, 2, 3", "Response widths", "3 needed for DEFER/UNSUPPORTED, TRANSFAULT, PREFETCHED, OKAYDIRTY.", "Tables A3.27, A3.30, p.61–63"],
      ["prop", "Consistent_DECERR", "cfg", "bool", "DECERR on all or no beats per cache line", "Lets a Manager check one beat. Manager True + Subordinate False is not compatible.", "Tables A3.32–A3.33, p.64"],
      ["prop", "Busy_Support", "cfg", "bool", "BBUSY/RBUSY present", "Default False.", "Table A3.34, p.65"],
      ["prop", "Exclusive_Accesses", "cfg", "bool", "Exclusive accesses issued / supported", "Default True. Manager True + Subordinate False: exclusives keep failing but no deadlock.", "Tables A6.3–A6.4, p.110"],
      ["prop", "Atomic_Transactions", "cfg", "bool", "Atomics supported", "Default False. Supporting means all operations, sizes and endianness.", "Table A6.10, p.121"],
      ["prop", "Multi_Copy_Atomicity", "cfg", "bool", "System is multi-copy atomic", "Default False in the table, but required True from Issue G on.", "Table A6.1, p.109"]
    ],

    wgroups: [["all", "All"], ["resp", "Responses"], ["ex", "Exclusive"], ["atom", "Atomic"], ["sys", "System"]],

    scenarios: [
      {
        id: "exok", tab: "Exclusive success", title: "Exclusive read, then exclusive write: EXOKAY",
        desc: "Manager 0 does a load-exclusive / store-exclusive pair on 0x100 with ID 3. Nobody else writes 0x100 in between, so the monitor still holds it and the write succeeds.",
        ref: "§A6.3.1, p.110–111 · §A6.3.4, p.112",
        n: 13, gaps: [],
        sig: [
          { name: "M0 ARVALID", d: "lp", t: "bit", v: bits(13, [[1, 1]]) },
          { name: "M0 AR", d: "lp", t: "bus", v: at(13, 1, ["ID3 0x100 LOCK"]) },
          { name: "M0 RRESP", d: "pl", t: "bus", v: at(13, 3, ["EXOKAY"]) },
          { name: "monitor (ID3)", d: "sb", t: "note", v: seq([["", 2], ["0x100 armed", 7], ["cleared", 4]]) },
          { name: "M0 AWVALID", d: "lp", t: "bit", v: bits(13, [[6, 6]]) },
          { name: "M0 AW", d: "lp", t: "bus", v: at(13, 6, ["ID3 0x100 LOCK"]) },
          { name: "M0 BRESP", d: "pl", t: "bus", v: at(13, 9, ["EXOKAY"]) },
          { name: "memory 0x100", d: "sb", t: "note", v: seq([["old", 9], ["new", 4]]) }
        ],
        steps: [
          { r: [1, 3], t: "Exclusive read", x: "ARLOCK HIGH. The Subordinate records address 0x100 against ARID 3 and answers EXOKAY on every beat, meaning \"I am monitoring this\".", s: "§A6.3.2, p.111 · §A6.3.4, p.112" },
          { r: [4, 5], t: "The Manager computes", x: "The CPU increments the value in a register. The read part must be complete before the write part starts.", s: "§A6.3.2, p.111" },
          { r: [6, 9], t: "Exclusive write succeeds", x: "AWLOCK HIGH, AWID 3 = the read's ARID, same address and attributes. The monitor still holds 0x100 for ID 3, so memory is updated and BRESP is EXOKAY.", w: "The pair never locks the bus. Other Managers keep running; the monitor only notices whether one of them wrote 0x100 in the meantime.", s: "§A6.3.1, p.110 · §A6.3.4, p.112" }
        ]
      },
      {
        id: "exfail", tab: "Exclusive fail", title: "Another Manager writes in between: OKAY, no update",
        desc: "Same sequence, but Manager 1 writes 0x100 between Manager 0's exclusive read and exclusive write. The monitor is cleared; the exclusive write returns OKAY and memory keeps Manager 1's value. Software retries.",
        ref: "§A6.3.1, p.110–111 · §A6.3.4, p.112",
        n: 14, gaps: [],
        sig: [
          { name: "M0 ARVALID", d: "lp", t: "bit", v: bits(14, [[1, 1]]) },
          { name: "M0 RRESP", d: "pl", t: "bus", v: at(14, 3, ["EXOKAY"]) },
          { name: "M1 AWVALID", d: "lp", t: "bit", v: bits(14, [[5, 5]]) },
          { name: "M1 AW", d: "lp", t: "bus", v: at(14, 5, ["0x100 write"]) },
          { name: "monitor (M0 ID3)", d: "sb", t: "note", v: seq([["", 2], ["0x100 armed", 4], ["cleared by M1", 8]]) },
          { name: "M0 AWVALID", d: "lp", t: "bit", v: bits(14, [[8, 8]]) },
          { name: "M0 AW", d: "lp", t: "bus", v: at(14, 8, ["ID3 0x100 LOCK"]) },
          { name: "M0 BRESP", d: "pl", t: "bus", v: at(14, 11, ["OKAY"]) },
          { name: "memory 0x100", d: "sb", t: "note", v: seq([["old", 6], ["M1 value", 8]]) }
        ],
        steps: [
          { r: [1, 3], t: "Exclusive read", x: "The monitor arms 0x100 for Manager 0, ID 3.", s: "§A6.3.4, p.112" },
          { r: [5, 6], t: "Someone else writes", x: "Manager 1's ordinary write to 0x100 reaches the Subordinate. Any write to a monitored location clears that monitor.", s: "§A6.3.4, p.112" },
          { r: [8, 11], t: "Exclusive write fails", x: "The address is no longer monitored for ID 3, so the write must not update memory and BRESP is OKAY instead of EXOKAY. For an exclusive, OKAY means failed.", w: "Software sees the failure (STXR returns 1 on Arm) and retries the whole read–modify–write, now on Manager 1's value. Nothing is lost.", s: "§A6.3.2, p.111 · Table A3.28, p.62" }
        ]
      },
      {
        id: "aload", tab: "AtomicLoad", title: "AtomicLoad ADD: the operation travels to the data",
        desc: "A CPU increments a shared counter at 0x2000 with AtomicLoad ADD (AWATOP 0b100000, little-endian), 4 bytes. One request, one data beat out, the old value back on R, one B.",
        ref: "§A6.4.1, p.113 · §A6.4.6–A6.4.7, p.117–119 · §A6.4.9, p.120",
        n: 12, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(12, [[1, 1]]) },
          { name: "AW", d: "lp", t: "bus", v: at(12, 1, ["ID7 0x2000 S4 ATOP=0x20"]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(12, [[1, 1]]) },
          { name: "WDATA", d: "lp", t: "bus", v: at(12, 1, ["+1"]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(12, [[6, 6]]) },
          { name: "RID / RDATA", d: "pl", t: "bus", v: at(12, 6, ["ID7 old=41"]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(12, [[7, 7]]) },
          { name: "BID / BRESP", d: "pl", t: "bus", v: at(12, 7, ["ID7 OKAY"]) },
          { name: "memory 0x2000", d: "sb", t: "note", v: seq([["41", 6], ["42", 6]]) }
        ],
        steps: [
          { r: [1, 1], t: "Request and operand together", x: "AW carries AWATOP 0b10_0_000: AtomicLoad (10), little-endian (e = 0), ADD (000). One W beat carries the operand. AWLOCK is LOW and AWSNOOP 0; Atomics are never exclusive.", s: "Tables A6.8–A6.9, p.117–118 · §A6.4.5, p.117" },
          { r: [2, 5], t: "The Subordinate does the read–modify–write", x: "The memory controller or system cache reads 41, adds 1, writes 42, all as one atomic update of the whole location.", w: "Compared with an exclusive pair, the location is busy for a few cycles at the memory, not for a full round trip to the CPU and back. Under contention that is the difference between scaling and livelock.", s: "§A6.4, p.113" },
          { r: [6, 6], t: "Old value on R, same ID", x: "RID = AWID = 7. AtomicLoad returns the original value. RVALID only had to wait for the AW handshake; a Subordinate may even send R before taking the W data.", s: "§A6.4.4, p.116 · §A6.4.7, p.118 · §A6.4.9, p.120" },
          { r: [7, 7], t: "One B, after all W and the result is observable", x: "Either response may be used as \"visible to all required observers\"; the read response counts from its first beat.", s: "§A6.4.7, p.118 · §A6.4.8, p.119" }
        ]
      },
      {
        id: "acmp", tab: "AtomicCompare", title: "AtomicCompare: read data may come before write data is accepted",
        desc: "Compare-and-swap of an 8-byte lock word at 0x3000 on a 128-bit channel: AWSIZE 16 bytes (compare + swap), INCR because AWADDR points to the lower half. This Subordinate returns the old value before it accepts the W beat; both are legal orders.",
        ref: "§A6.4.3, p.114–115 · Figure A6.2, p.116 · §A6.4.7, p.118 · §A6.4.9, p.120",
        n: 12, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(12, [[1, 1]]) },
          { name: "AW", d: "lp", t: "bus", v: at(12, 1, ["ID9 0x3000 S16 CMP"]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(12, [[2, 6]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(12, [[6, 6]]) },
          { name: "WDATA", d: "lp", t: "bus", v: at(12, 2, ["cmp | swap", "cmp | swap", "cmp | swap", "cmp | swap", "cmp | swap"]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(12, [[4, 4]]) },
          { name: "RDATA", d: "pl", t: "bus", v: at(12, 4, ["old (8 B)"]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(12, [[8, 8]]) }
        ],
        steps: [
          { r: [1, 1], t: "Sizes and alignment", x: "Outbound is 16 bytes (8 compare + 8 swap), so AWSIZE = 16 and AWADDR must be aligned to half that, 8 bytes. Here AWADDR = 0x3000, the lower half of the 16-byte window, so the compare value goes first and AWBURST is INCR. Had AWADDR been 0x3008 (upper half), the swap value would go first and AWBURST would be WRAP.", s: "§A6.4.3, p.115 · Figure A6.2, p.116" },
          { r: [2, 4], t: "Old value before the W beat is taken", x: "The Subordinate is allowed to send all read data before accepting any write data, so the Manager must be able to take R while its W is still waiting.", w: "The two directions can't be allowed to wait on each other in both ways, or an Atomic could deadlock itself. The spec lets the Subordinate choose either order and makes the Manager handle both.", s: "§A6.4.7, p.118 · §A6.4.9, p.120" },
          { r: [6, 8], t: "W accepted, then B", x: "WREADY rises in cycle 6; B follows after all write data and when the result is observable. Nothing says whether the swap happened: the Manager compares the returned old value with its compare value.", s: "§A6.4.7, p.118 · §A6.4.8, p.119" }
        ]
      },
      {
        id: "decerr", tab: "Error response", title: "DECERR on a read: every beat still comes",
        desc: "A 4-beat read to an unmapped address. The interconnect's default Subordinate answers DECERR. All four beats are sent; data isn't valid. With Consistent_DECERR, the Manager can stop looking after one beat.",
        ref: "§A3.3.2, p.62–64",
        n: 10, gaps: [],
        sig: [
          { name: "ARVALID", d: "lp", t: "bit", v: bits(10, [[1, 1]]) },
          { name: "AR", d: "lp", t: "bus", v: at(10, 1, ["0xDEAD0000 L4"]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(10, [[3, 6]]) },
          { name: "RRESP", d: "pl", t: "bus", v: at(10, 3, ["DECERR", "DECERR", "DECERR", "DECERR"]) },
          { name: "RDATA", d: "pl", t: "bus", v: at(10, 3, ["x", "x", "x", "x"]) },
          { name: "RLAST", d: "pl", t: "bit", v: bits(10, [[6, 6]]) }
        ],
        steps: [
          { r: [1, 3], t: "No Subordinate at this address", x: "The interconnect can't route the request, so it terminates it itself with DECERR: the request never reached a point where data exists.", s: "Table A3.31, p.63" },
          { r: [3, 6], t: "All Length beats", x: "All transfers given by Length are completed regardless of the response. RDATA is not valid on error beats, but the Manager might still sample it, so don't rely on the response to hide sensitive data.", w: "Beat counting has to stay consistent everywhere (see Bursts guide). An error changes what the beats mean, never how many there are.", s: "§A3.3.2, p.62–63" },
          { r: [6, 6], t: "Consistent DECERR", x: "Here DECERR is on every beat. With Consistent_DECERR True, a Subordinate promises all or none per cache line, which helps AXI-to-CHI bridges map it to a single Non-data Error.", s: "Table A3.32, p.64" }
        ]
      }
    ]
  };
})();
