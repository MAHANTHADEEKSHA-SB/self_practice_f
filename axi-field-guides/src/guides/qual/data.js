(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  function at(n, s, labels) { var a = []; for (var i = 0; i < n; i++) a.push(""); labels.forEach(function (l, k) { a[s + k] = l; }); return a; }

  window.PAGE = {
    CW: 50,
    dirName: { lp: "Manager", pl: "Subordinate", cfg: "Property" },
    dirCls: { cfg: "sb" },
    groups: [["all", "All"], ["q", "Qualifiers"], ["mpam", "MPAM"], ["mte", "MTE"], ["dbg", "Trace, loop, user"], ["prop", "Properties"]],
    sigs: [
      ["q", "AWNSAID, ARNSAID [3:0]", "lp", "bus", "Non-secure access identifier", "Any value for Non-secure PAS; 0 for other spaces. Checked by an MPU: none / RO / WO / RW.", "Table A10.2, p.175"],
      ["q", "AWPBHA, ARPBHA [3:0]", "lp", "bus", "Page-based hardware attributes", "4 bits from the translation table; use IMPLEMENTATION DEFINED; may degrade through the system.", "Table A10.3, p.177"],
      ["q", "AWSUBSYSID, ARSUBSYSID", "lp", "bus", "Which subsystem a request came from", "0–8 bits. For firewalls, snoop filtering, profiling.", "Tables A10.5–A10.6, p.178"],
      ["q", "AWACTV / AWACT, ARACTV / ARACT", "lp", "bus", "Arm Compression Technology request and payload", "AxSNOOP 0 with ACTV HIGH = WriteACT/ReadACT. Payload 16–32 bits. AXI5 only.", "Tables A10.9–A10.10, p.180"],
      ["mpam", "AWMPAM, ARMPAM", "lp", "bus", "Partition ID, monitor group, security", "11, 12, 14 or 15 bits depending on MPAM_9_1/MPAM_12_1 and RME. Sampled with AxVALID.", "Tables A12.2–A12.6, p.187–188"],
      ["mte", "AWTAGOP, ARTAGOP [1:0]", "lp", "bus", "Tag operation", "W: Invalid, Transfer, Update, Match. R: Invalid, Transfer, Fetch.", "Tables A12.9–A12.12, p.191–194"],
      ["mte", "WTAG, RTAG", "lp", "bus", "4-bit Allocation Tag per 128 data bits", "ceil(DATA_WIDTH/128)×4 bits. RTAG is driven by the Subordinate. Invalid tags recommended 0.", "Table A12.9, p.191"],
      ["mte", "WTAGUPDATE", "lp", "bus", "Which tags to write on Update", "One bit per tag; deasserted outside the container and for non-Update ops.", "Table A12.9, p.191 · §A12.2.6, p.194"],
      ["mte", "BTAGMATCH [1:0]", "pl", "bus", "Tag match result", "00 None, 01 Separate, 10 Fail, 11 Pass.", "Table A12.14, p.196"],
      ["dbg", "AWTRACE, WTRACE, BTRACE, ARTRACE, RTRACE", "lp", "level", "Trace this transaction", "Responses recommended to echo the request's trace bit. R and B versions driven by the Subordinate.", "Table A12.17, p.199"],
      ["dbg", "AWLOOP / BLOOP, ARLOOP / RLOOP", "lp", "bus", "Index reflected from request to response", "0–8 bits. BLOOP = AWLOOP, RLOOP = ARLOOP (Atomics: RLOOP = AWLOOP). Need not survive end to end.", "Tables A12.19–A12.20, p.200–201"],
      ["dbg", "AxUSER, WUSER, BUSER, RUSER", "lp", "bus", "User-defined extensions", "Avoid if possible. RUSER = data part + response part.", "Tables A12.21–A12.22, p.202"],
      ["prop", "NSAccess_Identifiers, PBHA_Support, SUBSYSID_WIDTH, ACT_Support", "cfg", "-", "A10 feature switches", "All default off.", "p.175–179"],
      ["prop", "WriteZero_Transaction, WriteDeferrable_Transaction", "cfg", "bool", "A11 Opcodes", "Manager True + Subordinate False is not connectable.", "Tables A11.1–A11.2, p.183–184"],
      ["prop", "MPAM_Support, MTE_Support", "cfg", "-", "MPAM_9_1 / MPAM_12_1; MTE Basic / Simplified / Standard", "MTE needs DATA_WIDTH &gt; 32.", "Table A12.1, p.187 · Table A12.7, p.190"],
      ["prop", "Trace_Signals, Loopback_Signals, USER_*_WIDTH", "cfg", "-", "Debug and user extensions", "USER widths 0–128 / 0–512 / 0–16 (guidance).", "Tables A12.16–A12.21, p.199–202"]
    ],

    wgroups: [["all", "All"], ["q", "Qualifiers"], ["wr", "Other writes"], ["mte", "MTE & MPAM"], ["dbg", "Debug & user"]],

    scenarios: [
      {
        id: "wz", tab: "WriteZero", title: "WriteZero: a whole line of zeros with no data beats",
        desc: "An OS zeroes a freshly allocated 64-byte line. WriteZero does it with one AW and one B: no W transfers at all.",
        ref: "§A11.1, p.183",
        n: 9, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "AWSNOOP", d: "lp", t: "bus", v: at(9, 1, ["WriteZero 0x9000"]) },
          { name: "AWIDUNQ", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(9, []) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(9, [[4, 4]]) },
          { name: "memory", d: "sb", t: "note", v: seq([["old", 4], ["64 × 0x00", 5]]) }
        ],
        steps: [
          { r: [1, 1], t: "One request", x: "AWSNOOP 0b0111 (or 0b00111 with a 5-bit field), line sized and Regular, not exclusive, no tag op, unique in-flight ID. Any Domain; Shareable acts like WriteUniqueFull with zero data.", s: "§A11.1, p.183" },
          { r: [2, 4], t: "No data, one response", x: "Functionally identical to a full-strobe write of zeros, without spending W bandwidth or power.", w: "Zeroing is one of the most common write patterns from CPUs. Making it data-less saves the whole W channel traffic for it.", s: "§A11.1, p.183" }
        ]
      },
      {
        id: "wd", tab: "WriteDeferrable", title: "WriteDeferrable: queue full, DEFER, retry",
        desc: "A CPU submits a 64-byte work descriptor to an accelerator's shared queue across a chip-to-chip link. The queue is full, so the first attempt returns DEFER and nothing is written; the retry succeeds.",
        ref: "§A11.2, p.184–186",
        n: 16, gaps: [7],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(16, [[1, 1], [9, 9]]) },
          { name: "AW", d: "lp", t: "bus", v: at(16, 1, ["WriteDeferrable 64B", "", "", "", "", "", "", "", "retry"]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(16, [[1, 1], [9, 9]]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(16, [[5, 5], [13, 13]]) },
          { name: "BRESP", d: "pl", t: "bus", v: at(16, 5, ["DEFER", "", "", "", "", "", "", "", "OKAY"]) },
          { name: "queue", d: "sb", t: "note", v: seq([["full", 7], ["", 1], ["slot free", 8]]) }
        ],
        steps: [
          { r: [1, 1], t: "A 64-byte atomic store", x: "AWSNOOP 0b10000 (needs 5-bit AWSNOOP and 3-bit BRESP), System Domain, Device or Normal Non-cacheable, 64-byte aligned, all strobes, unique ID. Must never be split or merged.", s: "§A11.2.2, p.184–185" },
          { r: [5, 5], t: "DEFER", x: "The queue is full: the write is not performed but might succeed later. UNSUPPORTED would mean the target can't take this type at all.", w: "This maps directly to PCIe Gen5 Deferrable Memory Write (DMWr), a non-posted write that can be refused, so accelerators can be shared without software locks.", s: "Table A11.3, p.185 · §A11.2, p.184" },
          { r: [9, 13], t: "Retry succeeds", x: "Software resubmits; a slot is free and BRESP is OKAY.", s: "Table A11.3, p.185" }
        ]
      },
      {
        id: "mte", tab: "MTE Match", title: "Write with tag Match: two responses, Fail",
        desc: "A store with a Physical Tag to 0x5000_0040. The memory stores the data anyway and checks the tag; the Completion and the Match result return separately. Here the tags differ.",
        ref: "§A12.2.6, p.194–197",
        n: 13, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(13, [[1, 1]]) },
          { name: "AWTAGOP", d: "lp", t: "bus", v: at(13, 1, ["Match"]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(13, [[1, 1]]) },
          { name: "WTAG", d: "lp", t: "bus", v: at(13, 1, ["0x7"]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(13, [[5, 5], [9, 9]]) },
          { name: "BCOMP", d: "pl", t: "bit", v: bits(13, [[5, 5]]) },
          { name: "BTAGMATCH", d: "pl", t: "bus", v: at(13, 5, ["01 Separate", "", "", "", "10 Fail"]) },
          { name: "memory", d: "sb", t: "note", v: seq([["old data, tag 0x3", 5], ["new data, tag 0x3", 8]]) }
        ],
        steps: [
          { r: [1, 1], t: "Store with a Physical Tag", x: "AWTAGOP Match; WTAG holds the pointer's tag (0x7) for the 16-byte granule. The transaction is to Normal Write-Back memory, physically addressed, unique ID.", s: "§A12.2.4, p.192 · Table A12.12, p.194" },
          { r: [5, 5], t: "Completion response", x: "BCOMP HIGH, BTAGMATCH 01: the write is observable. Normal ordering; the ID can be reused after it.", s: "§A12.2.6, p.196" },
          { r: [9, 9], t: "Match response: Fail", x: "BCOMP LOW, BTAGMATCH 10. The data was still written; the CPU raises a tag-check fault. A one-part combined response with BCOMP HIGH and 10/11 is also allowed.", w: "Separate responses let a memory with separate data and tag storage answer each when ready.", s: "§A12.2.6, p.194–197 · Table A12.15, p.197" }
        ]
      },
      {
        id: "loop", tab: "Loopback", title: "Loopback: the response brings back its own table index",
        desc: "A DMA stores per-request state in a 16-entry table and puts the entry number on AWLOOP. The Subordinate returns it on BLOOP, so the DMA can index the table directly instead of searching by ID.",
        ref: "§A12.4, p.200–201",
        n: 12, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(12, [[1, 2]]) },
          { name: "AWID", d: "lp", t: "bus", v: at(12, 1, ["3", "3"]) },
          { name: "AWLOOP", d: "lp", t: "bus", v: at(12, 1, ["0xA", "0x4"]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(12, [[6, 7]]) },
          { name: "BLOOP", d: "pl", t: "bus", v: at(12, 6, ["0xA", "0x4"]) },
          { name: "DMA table", d: "sb", t: "note", v: at(12, 6, ["free [10]", "free [4]"]) }
        ],
        steps: [
          { r: [1, 2], t: "Two writes, same ID, different loop values", x: "Loop values need not be unique; here they are table indices.", s: "§A12.4, p.200–201" },
          { r: [6, 7], t: "Reflected", x: "BLOOP equals the request's AWLOOP. With BCOMP present, BLOOP only has to match on the Completion response.", w: "Matching by ID would need a CAM or per-ID queue; the loop value is a direct index, which is faster and smaller.", s: "§A12.4, p.201" },
          { r: [3, 5], t: "Intermediates may substitute", x: "An interconnect may store the incoming AWLOOP, send its own value downstream, and restore the original on the way back.", s: "§A12.4, p.201" }
        ]
      },
      {
        id: "trace", tab: "Trace", title: "Trace: follow one transaction through the system",
        desc: "A debugger marks one read with ARTRACE so that every component can log it. The Subordinate echoes RTRACE on every data beat.",
        ref: "§A12.3, p.199",
        n: 10, gaps: [],
        sig: [
          { name: "ARVALID", d: "lp", t: "bit", v: bits(10, [[1, 2]]) },
          { name: "ARTRACE", d: "lp", t: "bit", v: bits(10, [[2, 2]]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(10, [[4, 7]]) },
          { name: "RTRACE", d: "pl", t: "bit", v: bits(10, [[6, 7]]) },
          { name: "beat", d: "sb", t: "note", v: at(10, 4, ["a0", "a1", "b0", "b1"]) }
        ],
        steps: [
          { r: [1, 2], t: "Only b is traced", x: "ARTRACE HIGH on the second request.", s: "§A12.3, p.199" },
          { r: [4, 7], t: "Echo on every beat of b", x: "Recommended: RTRACE HIGH on every response transfer of a traced read and LOW for untraced ones. Pass-through components preserve the bit.", w: "One bit, coordinated system-wide, lets trace and performance tools follow a single transaction through several interconnect hops.", s: "§A12.3, p.199 · Table B4.3, p.312" }
        ]
      }
    ]
  };
})();
