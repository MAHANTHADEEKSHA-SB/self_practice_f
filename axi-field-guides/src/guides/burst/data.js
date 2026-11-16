(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  /* beats: array of labels placed one per cycle starting at cycle s; padded to n */
  function at(n, s, labels) { var a = []; for (var i = 0; i < n; i++) a.push(""); labels.forEach(function (l, k) { a[s + k] = l; }); return a; }

  window.PAGE = {
    CW: 50,
    dirName: { lp: "Manager", pl: "Subordinate", cfg: "Property", both: "both" },
    dirCls: { cfg: "sb", both: "" },
    groups: [["all", "All"], ["req", "Request fields"], ["data", "Data channels"], ["prop", "Properties"]],
    sigs: [
      ["req", "AWADDR, ARADDR [ADDR_WIDTH-1:0]", "lp", "bus", "Address of the first transfer", "Only the start address is sent; the Subordinate works out the rest. May be unaligned for INCR and FIXED.", "Table A3.15, p.49 · §A3.1, p.43"],
      ["req", "AWLEN, ARLEN [7:0]", "lp", "bus", "Number of transfers minus one", "Length = AxLEN + 1, so 0x00 is one beat and 0xFF is 256. WRAP needs 2, 4, 8 or 16; FIXED up to 16. Tie to 0x00 if absent.", "Table A3.4, p.44"],
      ["req", "AWSIZE, ARSIZE [2:0]", "lp", "bus", "Maximum bytes per transfer, 2^AxSIZE", "0b000 = 1 byte … 0b111 = 128 bytes. Never wider than the data channel. Tie to log2(DATA_WIDTH/8) if absent.", "Tables A3.1–A3.2, p.43"],
      ["req", "AWBURST, ARBURST [1:0]", "lp", "bus", "How the address moves between transfers", "0b00 FIXED, 0b01 INCR, 0b10 WRAP, 0b11 reserved. Tie to 0b01 if absent.", "Tables A3.8–A3.9, p.46"],
      ["data", "WDATA [DATA_WIDTH-1:0]", "lp", "bus", "Write data", "Only the lanes chosen by address and size carry data. Inactive lanes recommended 0.", "Table A3.20, p.53"],
      ["data", "WSTRB [DATA_WIDTH/8-1:0]", "lp", "bus", "One strobe per byte lane", "Inside the transaction container any pattern, even all LOW; outside it all LOW. Can be absent if every write is full width (then tied HIGH).", "Table A3.22, p.54"],
      ["data", "WLAST", "lp", "level", "Last write beat", "HIGH on beat Length, even if the last beats have no strobes set.", "Table A3.20, p.53 · §A3.1.2, p.44"],
      ["data", "RDATA [DATA_WIDTH-1:0]", "pl", "bus", "Read data", "Size bytes must be valid on the lanes for that beat. Inactive lanes recommended 0.", "Table A3.24, p.55 · §A3.1.1, p.43"],
      ["data", "RLAST", "pl", "level", "Last read beat", "HIGH on beat Length. The Subordinate always sends every beat.", "Table A3.24, p.55 · §A3.1.2, p.44"],
      ["prop", "DATA_WIDTH", "cfg", "8…1024", "Bits on RDATA and WDATA", "8, 16, 32, 64, 128, 256, 512 or 1024.", "Table A3.19, p.53"],
      ["prop", "ADDR_WIDTH", "cfg", "1…64", "Bits on AxADDR (and ACADDR)", "Default 32. Different widths meet through an aligned window.", "Table A3.16, p.49"],
      ["prop", "Max_Transaction_Bytes", "cfg", "64…4096", "Largest Size × Length, and the boundary not to cross", "Default 4096. Manager value must not exceed the Subordinate's.", "Tables A3.6–A3.7, p.45"],
      ["prop", "Regular_Transactions_Only", "cfg", "bool", "Only Regular transactions issued/supported", "Default False. A True Subordinate behind a False Manager is not compatible.", "Tables A3.17–A3.18, p.52"],
      ["prop", "Fixed_Burst_Disable", "cfg", "bool", "FIXED neither generated nor supported", "Default False. Added in Issue K.", "Tables A3.13–A3.14, p.48 · Table B4.2, p.309"],
      ["prop", "Wrap_CLS_Modifiable", "cfg", "bool", "WRAP must be cache-line sized and Modifiable", "Default False. Added in Issue L. Not applied to a wrapping AtomicCompare.", "Tables A3.11–A3.12, p.47 · Table B4.3, p.311"],
      ["prop", "SIZE_, LEN_, BURST_, WSTRB_Present", "cfg", "bool", "Whether those signals exist", "Default True. When absent, the Subordinate input is tied to the documented value.", "Tables A3.3, A3.5, A3.10, A3.23, p.44–54"]
    ],

    wgroups: [["all", "All"], ["len", "Length & 4 KB"], ["type", "Burst types"], ["lane", "Lanes & strobes"], ["addr", "Addresses"], ["prop", "Properties"]],

    scenarios: [
      {
        id: "narrow", tab: "Narrow INCR", title: "Five 8-bit transfers on a 32-bit channel (Figure A3.1)",
        desc: "AWADDR 0x0, AWSIZE 0b000 (1 byte), AWLEN 4 (5 beats), INCR. Each beat uses the next byte lane, wrapping round to lane 0 on beat 5 at address 0x4.",
        ref: "§A3.2.3 and Figure A3.1, p.55–56 · §A3.1.6, p.50",
        n: 9, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "AWREADY", d: "pl", t: "bit", v: bits(9, [[0, 8]]) },
          { name: "AW payload", d: "lp", t: "bus", v: seq([["", 1], ["0x0 S1 L5", 1], ["", 7]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(9, [[2, 6]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(9, [[0, 8]]) },
          { name: "WSTRB[3:0]", d: "lp", t: "bus", v: at(9, 2, ["0001", "0010", "0100", "1000", "0001"]) },
          { name: "WDATA lane", d: "lp", t: "bus", v: at(9, 2, ["[7:0]", "[15:8]", "[23:16]", "[31:24]", "[7:0]"]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(9, [[6, 6]]) },
          { name: "beat address", d: "sb", t: "note", v: at(9, 2, ["0x0", "0x1", "0x2", "0x3", "0x4"]) }
        ],
        steps: [
          { r: [1, 1], t: "One request describes five transfers", x: "Only the start address 0x0 is sent, with Size 1 byte and Length 5. The Subordinate must compute addresses 0x1 to 0x4 itself.", w: "Sending one address per burst keeps the request channel narrow and lets one request cover up to 4 KB.", s: "§A3.1, p.43" },
          { r: [2, 5], t: "Each beat moves to the next lane", x: "Address_N = Aligned_Addr + (N − 1) × Size gives 0x1, 0x2, 0x3. The byte lane is the address modulo 4 (the channel is 4 bytes wide), so the strobe walks 0001 → 0010 → 0100 → 1000.", s: "§A3.1.6, p.50 · §A3.2.3, p.55" },
          { r: [6, 6], t: "Back to lane 0", x: "Beat 5 is address 0x4, which is lane 0 of the next 32-bit word. WLAST marks it.", w: "Byte k of memory always rides lane (k mod bus bytes). That is byte invariance in practice: a byte never changes wires depending on the access size.", s: "§A3.2.3, p.55 · §A3.2.4, p.56" }
        ]
      },
      {
        id: "unal", tab: "Unaligned INCR", title: "Unaligned start: 0x07, 4-byte transfers, 5 beats (Figure A3.6, 4th case)",
        desc: "32-bit channel. The first transfer only reaches the end of its 4-byte word, so it carries one byte; the rest are aligned and full. Container 0x04–0x17; 17 bytes move, not Size × Length = 20.",
        ref: "§A3.2.5 and Figure A3.6, p.58–59 · §A3.1.2, p.44 · §A3.1.6, p.50",
        n: 9, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "AWREADY", d: "pl", t: "bit", v: bits(9, [[0, 8]]) },
          { name: "AW payload", d: "lp", t: "bus", v: seq([["", 1], ["0x7 S4 L5", 1], ["", 7]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(9, [[2, 6]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(9, [[0, 8]]) },
          { name: "WSTRB[3:0]", d: "lp", t: "bus", v: at(9, 2, ["1000", "1111", "1111", "1111", "1111"]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(9, [[6, 6]]) },
          { name: "beat address", d: "sb", t: "note", v: at(9, 2, ["0x07", "0x08", "0x0C", "0x10", "0x14"]) },
          { name: "bytes", d: "sb", t: "note", v: at(9, 2, ["1", "4", "4", "4", "4"]) }
        ],
        steps: [
          { r: [2, 2], t: "First beat: from 0x07 to the end of the word", x: "Aligned_Addr = INT(0x07 / 4) × 4 = 0x04. Lower_Byte_Lane = 3, Upper_Byte_Lane = 0x04 + 3 − 0x04 = 3. Only lane 3 (address 0x07) is used.", w: "AXI moves whole Size-aligned slots per beat. Starting mid-slot just means fewer useful bytes in the first one; nothing else in the burst changes.", s: "§A3.1.6, p.50 · §A3.1.7, p.51" },
          { r: [3, 6], t: "Every later beat is aligned", x: "Address_2 = Aligned_Addr + Size = 0x08, then 0x0C, 0x10, 0x14. All four lanes are active.", s: "§A3.1.6, p.50" },
          { r: [2, 6], t: "Strobes and address must agree", x: "The Manager could instead have sent 0x04 with WSTRB 1000 on the first beat. Either way, the low address bits and the strobes must tell the same story. The Subordinate does not need to act on alignment at all.", s: "§A3.2.5, p.58" }
        ]
      },
      {
        id: "wrap", tab: "WRAP", title: "Wrapping burst: 0x04, 4 × 4 bytes on a 64-bit channel (Figure A3.8)",
        desc: "Size × Length = 16, so the wrap boundary is INT(0x04 / 16) × 16 = 0x00 and the container is 0x00–0x0F. The address runs 0x04, 0x08, 0x0C, then wraps to 0x00.",
        ref: "§A3.1.4, p.47 · §A3.1.6, p.50 · Figure A3.8, p.60",
        n: 8, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(8, [[1, 1]]) },
          { name: "AWREADY", d: "pl", t: "bit", v: bits(8, [[0, 7]]) },
          { name: "AW payload", d: "lp", t: "bus", v: seq([["", 1], ["0x4 S4 L4 W", 1], ["", 6]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(8, [[2, 5]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(8, [[0, 7]]) },
          { name: "WSTRB[7:0]", d: "lp", t: "bus", v: at(8, 2, ["0xF0", "0x0F", "0xF0", "0x0F"]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(8, [[5, 5]]) },
          { name: "beat address", d: "sb", t: "note", v: at(8, 2, ["0x04", "0x08", "0x0C", "0x00"]) }
        ],
        steps: [
          { r: [1, 1], t: "Legal WRAP", x: "Start 0x04 is aligned to Size (4) and Length is 4, one of 2, 4, 8 or 16. Both are required for WRAP.", s: "§A3.1.4, p.47" },
          { r: [2, 4], t: "Increment like INCR", x: "0x04 on lanes 4–7 (strobe 0xF0), 0x08 on lanes 0–3, 0x0C on lanes 4–7.", s: "§A3.1.6, p.50" },
          { r: [5, 5], t: "Wrap at the container top", x: "The next address would be 0x10 = Wrap_Boundary + Size × Length, so it becomes Wrap_Boundary, 0x00. Any further beat would use Aligned_Addr + (N − 1) × Size − Size × Length.", w: "A cache line fill wants the word the CPU is waiting for first and the rest of the line after it. WRAP gives exactly that order with one request.", s: "§A3.1.6, p.50 · Table B4.3, p.311" }
        ]
      },
      {
        id: "cl", tab: "Cache line fill", title: "Critical word first: a 64-byte line on a 128-bit channel",
        desc: "A CPU misses on 0x1038. It reads the whole 64-byte line with ARADDR 0x1030, ARSIZE 16 bytes, ARLEN 3, WRAP. The beat holding 0x1038 comes back first.",
        ref: "§A3.1.4, p.47 · §A3.1.6, p.50 · §A3.1.8, p.52",
        n: 9, gaps: [],
        sig: [
          { name: "ARVALID", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "ARREADY", d: "pl", t: "bit", v: bits(9, [[0, 8]]) },
          { name: "AR payload", d: "lp", t: "bus", v: seq([["", 1], ["0x1030 S16 L4 W", 1], ["", 7]]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(9, [[4, 7]]) },
          { name: "RREADY", d: "lp", t: "bit", v: bits(9, [[0, 8]]) },
          { name: "RDATA", d: "pl", t: "bus", v: at(9, 4, ["line[3]", "line[0]", "line[1]", "line[2]"]) },
          { name: "RLAST", d: "pl", t: "bit", v: bits(9, [[7, 7]]) },
          { name: "beat address", d: "sb", t: "note", v: at(9, 4, ["0x1030", "0x1000", "0x1010", "0x1020"]) }
        ],
        steps: [
          { r: [1, 1], t: "Request the line, starting at the needed beat", x: "The Manager aligns the miss address 0x1038 down to Size, 0x1030, and asks for a 4-beat WRAP. The wrap boundary is INT(0x1030 / 64) × 64 = 0x1000.", s: "§A3.1.4, p.47 · §A3.1.6, p.50" },
          { r: [4, 4], t: "Critical beat first", x: "The beat containing 0x1038 arrives first. The CPU can restart the load now instead of waiting for the full line.", w: "With INCR the Manager would have to start at 0x1000 and wait for beat 4, or issue two requests. WRAP turns 'critical word first' into a protocol feature.", s: "§A3.1.4, p.47" },
          { r: [5, 7], t: "Wrap and finish the line", x: "0x1040 would leave the container, so the address wraps to 0x1000, then 0x1010 and 0x1020. This request is also Regular: Length 4, Size = channel width, WRAP aligned to Size.", s: "§A3.1.6, p.50 · §A3.1.8, p.52" }
        ]
      },
      {
        id: "fixed", tab: "FIXED", title: "FIXED burst into a FIFO register",
        desc: "Four 32-bit writes to the same address 0x40, a peripheral's TX FIFO. The active lanes never change; within them, strobes may differ per beat.",
        ref: "§A3.1.4, p.47–48 · Table A3.13, p.48",
        n: 8, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(8, [[1, 1]]) },
          { name: "AWREADY", d: "pl", t: "bit", v: bits(8, [[0, 7]]) },
          { name: "AW payload", d: "lp", t: "bus", v: seq([["", 1], ["0x40 S4 L4 F", 1], ["", 6]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(8, [[2, 5]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(8, [[0, 7]]) },
          { name: "WSTRB[3:0]", d: "lp", t: "bus", v: at(8, 2, ["1111", "1111", "0011", "1111"]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(8, [[5, 5]]) },
          { name: "beat address", d: "sb", t: "note", v: at(8, 2, ["0x40", "0x40", "0x40", "0x40"]) }
        ],
        steps: [
          { r: [1, 1], t: "Same address, up to 16 beats", x: "FIXED keeps the address for every transfer. Length may be at most 16. It may only be used with the WriteNoSnoop and ReadNoSnoop opcodes, the plain read and write.", s: "§A3.1.4, p.47–48" },
          { r: [2, 5], t: "Constant lanes, varying strobes", x: "All four beats use lanes 0–3. Beat 3 sets only WSTRB 0011, for example a 16-bit push into a FIFO that accepts halfwords.", w: "FIXED exists for things with side effects at one address: FIFOs, data ports. Few Managers use it, which is why Issue K added Fixed_Burst_Disable so a Subordinate can declare it unsupported.", s: "§A3.1.4, p.47 · Table A3.13, p.48 · Table B4.2, p.309" }
        ]
      },
      {
        id: "strb", tab: "No early stop", title: "Changing your mind mid-burst: strobes off, beats still sent",
        desc: "A 4-beat INCR write where the Manager decides after beat 2 that it doesn't need to write the rest. It can't shorten the burst; it sends beats 3 and 4 with every strobe LOW.",
        ref: "§A3.1.2, p.44 · §A3.2.1.1, p.54",
        n: 8, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(8, [[1, 1]]) },
          { name: "AWREADY", d: "pl", t: "bit", v: bits(8, [[0, 7]]) },
          { name: "AW payload", d: "lp", t: "bus", v: seq([["", 1], ["0x100 S4 L4 I", 1], ["", 6]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(8, [[2, 5]]) },
          { name: "WREADY", d: "pl", t: "bit", v: bits(8, [[0, 7]]) },
          { name: "WSTRB[3:0]", d: "lp", t: "bus", v: at(8, 2, ["1111", "1111", "0000", "0000"]) },
          { name: "WLAST", d: "lp", t: "bit", v: bits(8, [[5, 5]]) },
          { name: "beat address", d: "sb", t: "note", v: at(8, 2, ["0x100", "0x104", "0x108", "0x10C"]) }
        ],
        steps: [
          { r: [2, 3], t: "Two useful beats", x: "Beats 1 and 2 write 0x100–0x107.", s: "§A3.1.6, p.50" },
          { r: [4, 5], t: "Two empty beats, still sent", x: "Early termination is not supported by any component. The Manager sends the remaining beats with WSTRB 0000, which write nothing, and WLAST on beat 4. A read is the same: the Manager may discard data but must accept every beat.", w: "Every component between Manager and Subordinate counts beats against AxLEN. A burst that ended early would leave them all waiting for beats that never come.", s: "§A3.1.2, p.44 · §A3.2.1.1, p.54" }
        ]
      }
    ]
  };
})();
