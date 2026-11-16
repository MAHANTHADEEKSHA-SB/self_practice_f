(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  function at(n, s, labels) { var a = []; for (var i = 0; i < n; i++) a.push(""); labels.forEach(function (l, k) { a[s + k] = l; }); return a; }

  window.PAGE = {
    CW: 50,
    dirName: { lp: "Manager", pl: "Subordinate", cfg: "Property", tie: "Tie-off (Manager input)" },
    dirCls: { cfg: "sb", tie: "sb" },
    groups: [["all", "All"], ["dom", "Domain"], ["stash", "Stash"], ["cmo", "CMO"], ["tie", "Tie-offs"], ["prop", "Properties"]],
    sigs: [
      ["dom", "AWDOMAIN, ARDOMAIN [1:0]", "lp", "bus", "Shareability Domain", "00 Non-shareable, 01/10 Shareable (10 recommended), 11 System. Present when Shareable_Transactions is True.", "Tables A8.4–A8.5, p.135"],
      ["stash", "AWSTASHNID [10:0], AWSTASHNIDEN", "lp", "bus", "Target node (physical interface) for a stash", "NIDEN LOW ⇒ NID must be 0; LOW on all non-stash requests.", "Table A8.16, p.146"],
      ["stash", "AWSTASHLPID [4:0], AWSTASHLPIDEN", "lp", "bus", "Logical processor within the target", "LPIDEN LOW ⇒ LPID must be 0; LOW on all non-stash requests.", "Table A8.16, p.146"],
      ["cmo", "AWCMO [AWCMO_WIDTH-1:0]", "lp", "bus", "CMO type for CMO, WritePtlCMO, WriteFullCMO", "000 CI, 001 CS, 010 CSP, 011 CSDP, 100 CIPA, 101 CIS. Width 0, 2 or 3.", "Tables A9.5–A9.7, p.158–159"],
      ["cmo", "BCOMP", "pl", "level", "This B is the Completion response", "With a PCMO: once per transaction, ordered like normal responses.", "Table A9.14, p.166 · §A3.3.1, p.61"],
      ["cmo", "BPERSIST", "pl", "level", "This B is the Persist response", "Once per CSP/CSDP; no ordering requirements; may be combined with BCOMP in one transfer.", "Table A9.14, p.166"],
      ["tie", "BROADCASTSHAREABLE", "tie", "tie-off", "Issue Shareable transactions", "LOW: convert to Non-shareable equivalents (Table A8.13).", "Table A8.12, p.140"],
      ["tie", "BROADCASTCACHEMAINT", "tie", "tie-off", "Issue CMOs", "LOW with BROADCASTSHAREABLE LOW: CS/CI/MI not issued; write+CMO become plain writes.", "Table A9.2, p.157"],
      ["tie", "BROADCASTPERSIST, BROADCASTCMOPOPA, BROADCASTSTORAGE", "tie", "tie-off", "Issue CSP/CSDP, CIPA, CIS", "LOW: downgrade or suppress those CMOs.", "Tables A9.13, A9.16, A9.19, p.165–171"],
      ["prop", "Cache_Line_Size", "cfg", "16…2048", "Line size in bytes", "Default 64 (required for CHI compatibility). A line must fit in ≤ 16 transfers.", "§A8.2, p.133"],
      ["prop", "Shareable_Transactions", "cfg", "bool", "Shareable Domain and AxDOMAIN present", "Default False.", "Table A8.3, p.135"],
      ["prop", "Shareable_Cache_Support", "cfg", "bool", "ReadShared, ReadClean, WriteBackFull, WriteEvictFull", "Default False; must be False on I/O coherent interfaces.", "Table A8.10, p.140 · §A8.4, p.137"],
      ["prop", "Cache_Stash_Transactions", "cfg", "True/Basic/False", "Stash Opcodes", "Basic = StashOnceShared only, no targets.", "Table A8.19, p.148"],
      ["prop", "CMO_On_Write, CMO_On_Read, Write_Plus_CMO", "cfg", "bool", "Where CMOs travel", "Write channels recommended for new designs.", "Tables A9.3, A9.8, A9.10, p.158–163"],
      ["prop", "Persist_CMO, Storage_CMO, RME_Support", "cfg", "bool", "CSP/CSDP, CIS, CIPA", "Storage_CMO needs CMO_On_Write.", "Tables A9.12, A9.17, p.164–170"],
      ["prop", "Prefetch_Transaction, DeAllocation_Transactions, InvalidateHint_Transaction", "cfg", "bool", "Hint Opcodes", "Prefetch needs RRESP_WIDTH 3 for PREFETCHED.", "Tables A8.14, A8.22, A8.23, p.143–152"]
    ],

    wgroups: [["all", "All"], ["dom", "Domains"], ["line", "Cache lines"], ["hint", "Hints"], ["cmo", "CMOs"]],

    scenarios: [
      {
        id: "cmo", tab: "CMO on W channels", title: "Stand-alone CleanShared on the write channels",
        desc: "A non-coherent DMA's driver needs a buffer written by the CPU to reach memory. It issues a Shareable CleanShared CMO: AW only (no W data), one B when every copy is clean and the writes are observable.",
        ref: "§A9.1, p.154 · §A9.2, p.155 · §A9.5, p.158–159",
        n: 12, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(12, [[1, 1]]) },
          { name: "AWSNOOP / AWCMO", d: "lp", t: "bus", v: at(12, 1, ["CMO / CS"]) },
          { name: "AWDOMAIN", d: "lp", t: "bus", v: at(12, 1, ["SH"]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(12, []) },
          { name: "interconnect", d: "sb", t: "note", v: seq([["", 2], ["snoop dirty copies", 3], ["write back", 3], ["", 4]]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(12, [[9, 9]]) },
          { name: "BRESP", d: "pl", t: "bus", v: at(12, 9, ["OKAY"]) }
        ],
        steps: [
          { r: [1, 1], t: "A data-less write-channel request", x: "AWSNOOP 0b0110 (CMO) with AWCMO 0b001 (CleanShared). Cache line sized and Regular; Domain Non-shareable or Shareable, never System; no W beats.", s: "Table A9.4, p.158 · Table A9.7, p.159 · §A9.3, p.156" },
          { r: [2, 7], t: "Look up, snoop, write back", x: "A cache looks up the line; a coherent interconnect snoops caches that might hold it Dirty; dirty data is written back, and all of that completes.", s: "§A9.2, p.155" },
          { r: [9, 9], t: "One response", x: "CleanShared and CleanInvalid have a single B transfer. If a downstream cache might hold the line and an observer sits beyond it, the CMO must be forwarded and its response passed back.", w: "Recommended for new designs: CMOs on the write channels. The read-channel versions exist for legacy components.", s: "§A9.5, p.159 · §A9.4, p.157 · §A9.1, p.154" }
        ]
      },
      {
        id: "pcmo", tab: "Write + persist", title: "WriteFullCMO with CleanSharedPersist: two responses",
        desc: "A storage driver writes a full 64-byte line to persistent memory and needs to know when it has reached the Point of Persistence. One request carries both. The Completion response (BCOMP) frees tracking early; the Persist response (BPERSIST) comes when the data is persistent.",
        ref: "§A9.6, p.160–161 · §A9.8.4, p.165–166",
        n: 14, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(14, [[1, 1]]) },
          { name: "AWSNOOP / AWCMO", d: "lp", t: "bus", v: at(14, 1, ["WriteFullCMO / CSP"]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(14, [[1, 4]]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(14, [[7, 7], [12, 12]]) },
          { name: "BCOMP", d: "pl", t: "bit", v: bits(14, [[7, 7]]) },
          { name: "BPERSIST", d: "pl", t: "bit", v: bits(14, [[12, 12]]) },
          { name: "meaning", d: "sb", t: "note", v: at(14, 7, ["observable", "", "", "", "", "persistent"]) }
        ],
        steps: [
          { r: [1, 4], t: "Write and CMO in one transaction", x: "AWSNOOP 0b1011 (WriteFullCMO), AWCMO 0b010 (CleanSharedPersist). Cache line sized, Regular, all strobes set. The CMO part is always treated as cacheable and Shareable.", s: "§A9.6.1, p.161 · Table A9.7, p.159" },
          { r: [7, 7], t: "Completion response", x: "BCOMP HIGH, BPERSIST LOW: the write is observable. It follows normal response ordering, and if AWIDUNQ was set the ID can be reused once it arrives.", s: "§A9.8.4 and Table A9.14, p.166" },
          { r: [12, 12], t: "Persist response", x: "BPERSIST HIGH, BCOMP LOW: the data has reached the PoP. It has no ordering requirements and may even come first. A Subordinate may instead send one transfer with both HIGH.", w: "Committing to persistent media can take microseconds. Splitting the responses lets the interconnect release the transaction's tracking entry long before then.", s: "§A9.8.4, p.165–166 · §A9.6.3, p.161" }
        ]
      },
      {
        id: "stash", tab: "StashOnce", title: "StashOnceShared: a data-less hint answered at once",
        desc: "A NIC tells the system that a CPU will soon read a descriptor line. StashOnceShared with a target NID. The interconnect can't stash (no stash support on that path), so it answers immediately without propagating, which is safe because StashOnce uses an ID no other write uses.",
        ref: "§A8.7, p.144–148",
        n: 9, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "AWSNOOP", d: "lp", t: "bus", v: at(9, 1, ["StashOnceShared"]) },
          { name: "AWSTASHNIDEN", d: "lp", t: "bit", v: bits(9, [[1, 1]]) },
          { name: "AWSTASHNID", d: "lp", t: "bus", v: at(9, 1, ["0x012"]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(9, [[3, 3]]) },
          { name: "BRESP", d: "pl", t: "bus", v: at(9, 3, ["OKAY"]) }
        ],
        steps: [
          { r: [1, 1], t: "A hint, not an access", x: "StashOnceShared (AWSNOOP 0b1100): fetch this line into a particular cache, other copies may stay. Cache line sized and Regular, Modifiable, not exclusive, no MTE, not atomic. The target IDs are optional and the enable bits say which are valid.", s: "§A8.7.1–A8.7.4, p.144–146" },
          { r: [3, 3], t: "Immediate response", x: "A component that doesn't support stashing may drop a StashOnce and respond at once. StashOnce IDs can't be shared with outstanding non-StashOnce writes, so answering early can't break any ordering.", w: "Stashing is purely a performance hint; ignoring it must always be safe and cheap.", s: "§A8.7.5, p.147 · Table A8.21, p.148" }
        ]
      },
      {
        id: "pf", tab: "Prefetch", title: "Prefetch, then a read that hits it",
        desc: "A video decoder knows it will read a reference block soon. It sends a Prefetch (AW only, one B). The memory controller fetches the line into its buffer. The later read gets RRESP PREFETCHED, which the Manager can use to tune how much it prefetches.",
        ref: "§A8.6, p.142–143",
        n: 14, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(14, [[1, 1]]) },
          { name: "AWSNOOP", d: "lp", t: "bus", v: at(14, 1, ["Prefetch 0x8000"]) },
          { name: "BVALID / BRESP", d: "pl", t: "bus", v: at(14, 3, ["OKAY"]) },
          { name: "controller", d: "sb", t: "note", v: seq([["", 2], ["fetch line from DRAM", 5], ["held", 7]]) },
          { name: "ARVALID", d: "lp", t: "bit", v: bits(14, [[9, 9]]) },
          { name: "AR", d: "lp", t: "bus", v: at(14, 9, ["ReadNoSnoop 0x8000"]) },
          { name: "RRESP", d: "pl", t: "bus", v: at(14, 10, ["PREFETCHED", "PREFETCHED", "PREFETCHED", "PREFETCHED"]) }
        ],
        steps: [
          { r: [1, 3], t: "Prefetch: AW and B only", x: "AWSNOOP 0b01111, cache line sized and Regular, Normal (AWCACHE[1] = 1), Non-shareable or Shareable, unique ID. Any level may act on it or just answer OKAY.", s: "§A8.6.1, p.142" },
          { r: [4, 8], t: "Data prepared", x: "The controller opens the DRAM row and buffers the line. Prefetch is not ordered with CMOs, so it must never be used to put data into a managed or visible cache.", s: "§A8.6, p.142" },
          { r: [9, 13], t: "PREFETCHED", x: "RRESP 0b100 means valid data from a prefetched source. Recommended: all beats of a line or none. Needs RRESP_WIDTH 3, never for exclusive reads, and can go to a Manager that didn't send the prefetch itself.", s: "§A8.6.2, p.143" }
        ]
      },
      {
        id: "sw", tab: "Software coherency", title: "Handing a buffer to a non-coherent agent and back (Figure A9.3)",
        desc: "The five stages of sharing data with a non-coherent DMA using CMOs. Between the clean (stage 2) and the invalidate (stage 4), the coherent side's view of the line is UNPREDICTABLE.",
        ref: "§A9.11.1 and Figure A9.3, p.172–173",
        n: 15, gaps: [], unit: "phase columns",
        sig: [
          { name: "stage", d: "sb", t: "note", v: seq([["1 coherent access", 3], ["2 clean", 3], ["3 DMA access", 3], ["4 invalidate", 3], ["5 coherent access", 3]]) },
          { name: "CPU traffic", d: "lp", t: "bus", v: seq([["writes buffer", 3], ["CleanShared", 3], ["", 3], ["CleanInvalid", 3], ["reads result", 3]]) },
          { name: "DMA traffic", d: "lp", t: "bus", v: seq([["", 6], ["reads, writes", 3], ["", 6]]) },
          { name: "CPU view", d: "sb", t: "note", v: seq([["defined", 3], ["", 1], ["UNPREDICTABLE", 7], ["", 1], ["defined", 3]]) }
        ],
        steps: [
          { r: [0, 2], t: "Coherent side owns the data", x: "CPUs read and write the buffer freely; it may be Dirty in their caches.", s: "§A9.11.1, p.172" },
          { r: [3, 5], t: "Clean", x: "CleanShared (or CleanInvalid) pushes dirty lines to memory so the non-coherent agent will see them.", s: "§A9.11.1, p.172" },
          { r: [6, 8], t: "Non-coherent access", x: "The DMA reads and writes memory directly. A CPU looking at the line now might see stale, new or changing values.", s: "§A9.11.1, p.172" },
          { r: [9, 11], t: "Invalidate", x: "CleanInvalid or MakeInvalid removes any stale copies the coherent side may have picked up, so the next read fetches the DMA's data.", s: "§A9.11.1, p.172" },
          { r: [12, 14], t: "Coherent access again", x: "The result is now defined. Any CPU access between stages 2 and 4 could have pulled the line back into a cache, which is why the invalidate comes after the DMA finishes.", w: "This is the software-coherency contract that the Non-shareable Domain relies on; the bus can't detect if software gets it wrong.", s: "§A9.11.1, p.172–173 · §A8.3.2, p.134" }
        ]
      }
    ]
  };
})();
