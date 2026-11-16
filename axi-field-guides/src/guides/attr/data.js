(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  function at(n, s, labels) { var a = []; for (var i = 0; i < n; i++) a.push(""); labels.forEach(function (l, k) { a[s + k] = l; }); return a; }

  window.PAGE = {
    CW: 50,
    dirName: { lp: "Manager", pl: "Subordinate", ic: "Interconnect", cfg: "Property" },
    dirCls: { ic: "sb", cfg: "sb" },
    groups: [["all", "All"], ["cache", "Memory attributes"], ["prot", "Protection"], ["rme", "RME and MEC"], ["reg", "Region and QoS"]],
    sigs: [
      ["cache", "AWCACHE, ARCACHE [3:0]", "lp", "bus", "Memory type of the request", "[0] Bufferable, [1] Modifiable; [2]/[3] Allocate and Other Allocate, swapped between AR and AW. Default 0x0 (Device Non-bufferable).", "Table A4.1, p.68"],
      ["cache", "CACHE_Present", "cfg", "bool", "AxCACHE signals exist", "Default True. Clarified in Issue K.", "Table A4.2, p.68 · Table B4.2, p.309"],
      ["prot", "AWPROT, ARPROT [2:0]", "lp", "bus", "[0] privileged, [1] Non-secure, [2] instruction", "Default 0b000. Superseded in Issue L by AxPRIV, AxINST and AxPAS; an interface uses one set or the other.", "Table A4.5, p.77 · §A4.5.2, p.78"],
      ["prot", "AWPRIV, ARPRIV", "lp", "level", "Privileged access", "Same meaning as AxPROT[0]. Present when INSTPRIV_Present.", "Table A4.5, p.77"],
      ["prot", "AWINST, ARINST", "lp", "level", "Instruction access (a hint)", "Same meaning as AxPROT[2]. Recommended LOW unless known to be an instruction fetch.", "Table A4.5, p.77 · §A4.5.2, p.78"],
      ["prot", "AWPAS, ARPAS [PAS_WIDTH-1:0]", "lp", "bus", "Physical address space", "0 Secure, 1 Non-secure, 2 Root, 3 Realm, 4 System Agent, 5 Non-secure Protected. Default all zeros (Secure).", "Table A4.5, p.77 · Table A4.7, p.79"],
      ["rme", "AWNSE, ARNSE", "lp", "level", "Extends AxPROT[1] to Root and Realm", "Only with RME_Support and PROT_Present.", "Table A4.5, p.77 · Table A4.7, p.79"],
      ["rme", "AWMECID, ARMECID [15:0]", "lp", "bus", "Memory Encryption Context ID", "Must be 0 for Secure, Non-secure and Root; any value for Realm, SA and NSP. Preserved by components that pass requests on.", "Table A4.11, p.81 · Table A4.14, p.82 · §A4.6.2, p.83"],
      ["rme", "RME_Support, GDI_Support, MEC_Support", "cfg", "bool", "Which RME extensions an interface carries", "All default False. GDI needs RME and PAS_WIDTH 3; MEC needs RME.", "Tables A4.8–A4.10, p.79–81"],
      ["reg", "AWREGION, ARREGION [3:0]", "ic", "bus", "Which of up to 16 decoded regions", "Produced by an interconnect's address decode; constant within any 4 KB space. Default 0x0.", "Table A4.16, p.84 · §A4.7.2, p.84–85"],
      ["reg", "AWQOS, ARQOS [3:0]", "lp", "bus", "QoS identifier, higher is more important (recommended)", "Interconnects often overwrite it from registers. Default 0x0.", "Table A4.17, p.86"],
      ["reg", "VAWQOSACCEPT, VARQOSACCEPT [3:0]", "pl", "bus", "Lowest QoS accepted without delay", "Not tied to any channel handshake. Requests below it may wait a long time, but not forever (recommended).", "Table A4.19, p.87"]
    ],

    wgroups: [["all", "All"], ["buf", "Bufferable"], ["mod", "Modifiable"], ["alloc", "Allocation & types"], ["err", "Errors & changes"], ["prot", "Protection"], ["qos", "Region & QoS"]],

    scenarios: [
      {
        id: "devb", tab: "Device B + NB", title: "Making Device Bufferable writes visible: end with a Device Non-bufferable write",
        desc: "A driver posts two Device Bufferable writes to a peripheral, then one Device Non-bufferable write with the same AWID to the same peripheral. An interconnect buffer answers the Bufferable ones early. The last response only comes from the peripheral, and AXI ordering means it implies the first two have landed.",
        ref: "§A4.3.1, p.71 · §A4.3.5, p.75",
        n: 16, gaps: [],
        sig: [
          { name: "M AWVALID", d: "lp", t: "bit", v: bits(16, [[1, 3]]) },
          { name: "M AWCACHE", d: "lp", t: "bus", v: seq([["", 1], ["0001 DevB", 1], ["0001 DevB", 1], ["0000 DevNB", 1], ["", 12]]) },
          { name: "M BVALID", d: "sb", t: "bit", v: bits(16, [[3, 4], [13, 13]]) },
          { name: "B from", d: "sb", t: "note", v: at(16, 3, ["buffer", "buffer", "", "", "", "", "", "", "", "", "peripheral"]) },
          { name: "S AWVALID", d: "lp", t: "bit", v: bits(16, [[5, 5], [7, 7], [9, 9]]) },
          { name: "S AW", d: "lp", t: "bus", v: at(16, 5, ["w1", "", "w2", "", "w3"]) },
          { name: "S BVALID", d: "pl", t: "bit", v: bits(16, [[7, 7], [9, 9], [12, 12]]) },
          { name: "visible at peripheral", d: "sb", t: "note", v: at(16, 7, ["w1", "", "w2", "", "", "w3"]) }
        ],
        steps: [
          { r: [1, 3], t: "Two posted writes, then a fence-like write", x: "w1 and w2 are Device Bufferable (AWCACHE 0b0001); w3 is Device Non-bufferable (0b0000). All three use the same AWID and target the same peripheral.", s: "Table A4.4, p.71 · §A4.3.5, p.75" },
          { r: [3, 4], t: "Early responses for w1 and w2", x: "An interconnect write buffer accepts w1 and w2 and returns BRESP immediately. That is allowed: a Bufferable write may get its response from an intermediate point. The driver now knows nothing about when the peripheral sees them.", w: "Early responses let the CPU retire stores to slow peripherals without stalling for the full round trip.", s: "§A4.2.1, p.68 · §A4.3.1, p.71" },
          { r: [5, 12], t: "The buffer drains in order", x: "The buffer must push Bufferable writes to the final destination in a timely manner. w3 cannot be answered early, so it is forwarded too, behind w1 and w2 (same ID, same Subordinate).", s: "§A4.3.1, p.71 · §A4.3.4, p.74" },
          { r: [13, 13], t: "One response that covers all three", x: "The response to w3 comes from the peripheral. Because same-ID writes to the same Subordinate are ordered, w1 and w2 are visible there too. This works only for writes with the same ID to the same device.", w: "This is the AXI way to know a posted register write has really landed, for example before enabling an interrupt that depends on it.", s: "§A4.3.5, p.75" }
        ]
      },
      {
        id: "merge", tab: "Modifiable merge", title: "An interconnect merges two Modifiable writes",
        desc: "A Manager writes 0x100–0x10F and then 0x110–0x11F as two Normal Non-cacheable Bufferable bursts. A write-combining buffer merges them into one 32-byte burst. A Device write behind them passes through untouched.",
        ref: "§A4.2.2, p.69–70 · §A4.3.1, p.72",
        n: 13, gaps: [],
        sig: [
          { name: "M AWVALID", d: "lp", t: "bit", v: bits(13, [[1, 3]]) },
          { name: "M AW", d: "lp", t: "bus", v: seq([["", 1], ["0x100 16B", 1], ["0x110 16B", 1], ["0x200 Dev", 1], ["", 9]]) },
          { name: "M AWCACHE", d: "lp", t: "bus", v: seq([["", 1], ["0011", 2], ["0000", 1], ["", 9]]) },
          { name: "S AWVALID", d: "lp", t: "bit", v: bits(13, [[6, 6], [8, 8]]) },
          { name: "S AW", d: "lp", t: "bus", v: at(13, 6, ["0x100 32B", "", "0x200 Dev"]) },
          { name: "S AWCACHE", d: "lp", t: "bus", v: at(13, 6, ["0011", "", "0000"]) },
          { name: "buffer", d: "sb", t: "note", v: seq([["", 2], ["combine", 3], ["drain", 2], ["pass", 2], ["", 4]]) }
        ],
        steps: [
          { r: [1, 2], t: "Two adjacent Modifiable writes", x: "AWCACHE 0b0011 is Normal Non-cacheable Bufferable. Modifiable means the system may split, merge, widen or prefetch.", s: "Table A4.4, p.71 · §A4.2.2, p.69–70" },
          { r: [6, 6], t: "One burst downstream", x: "The buffer emits one 32-byte write. Address, Size, Length and Burst may all change; AxLOCK and the protection attributes may not. It must not create an access to another 4 KB space, nor split a single-copy-atomic access.", w: "Merging cuts request traffic and DRAM overhead, which is why frame buffers and DMA destinations are mapped Normal Non-cacheable rather than Device.", s: "§A4.2.2, p.70" },
          { r: [3, 8], t: "Device passes as it is", x: "The Device write (0b0000) is Non-modifiable: no split, no merge, same Size, Length, Burst, address and protection. Only Bufferable → Non-bufferable, the ID and QoS may change.", s: "§A4.2.2 and Table A4.3, p.69" },
          { r: [2, 5], t: "Merging must not hold writes forever", x: "A merging buffer must not let new writes reset its drain timer. Otherwise a CPU polling-writes one address could keep it in the buffer indefinitely.", s: "§A4.3.4, p.75" }
        ]
      },
      {
        id: "fwd", tab: "Read from a write", title: "Normal Non-cacheable Bufferable read served from a write in flight",
        desc: "A write to 0x400 sits in an interconnect buffer. A read to the same address arrives. With Bufferable reads (ARCACHE 0b0011) the buffer may return the newest buffered data; with 0b0010 it must go to memory.",
        ref: "§A4.2.1, p.69 · §A4.3.1, p.72 · §A4.3.4, p.74–75",
        n: 12, gaps: [],
        sig: [
          { name: "M AW (0x400)", d: "lp", t: "bit", v: bits(12, [[1, 1]]) },
          { name: "M BVALID", d: "sb", t: "bit", v: bits(12, [[2, 2]]) },
          { name: "M AR (0x400)", d: "lp", t: "bit", v: bits(12, [[3, 3], [7, 7]]) },
          { name: "M ARCACHE", d: "lp", t: "bus", v: at(12, 3, ["0011", "", "", "", "0010"]) },
          { name: "M RVALID", d: "sb", t: "bit", v: bits(12, [[4, 4], [10, 10]]) },
          { name: "R from", d: "sb", t: "note", v: at(12, 4, ["buffer", "", "", "", "", "", "memory"]) },
          { name: "S AR", d: "lp", t: "bit", v: bits(12, [[8, 8]]) },
          { name: "S AW (drain)", d: "lp", t: "bit", v: bits(12, [[6, 6]]) }
        ],
        steps: [
          { r: [1, 2], t: "A buffered write", x: "The write is accepted and answered by an intermediate buffer.", s: "§A4.3.1, p.72" },
          { r: [3, 4], t: "Bufferable read: forwarded from the buffer", x: "ARCACHE 0b0011 lets the read be served by a write still progressing to its destination, as long as it is the most recent version. The data must not be cached for a later read, and getting it does not mean the write has reached memory.", s: "§A4.2.1, p.69 · §A4.3.1, p.72" },
          { r: [6, 10], t: "Non-bufferable read: must go to memory", x: "ARCACHE 0b0010 requires read data from the final destination. The read is sent to memory, after the buffered write drains to it.", w: "This is how software asks for a value that reflects what memory holds, not what is still in flight.", s: "§A4.2.1, p.69 · §A4.3.1, p.72" },
          { r: [3, 10], t: "Forwarding can't last forever", x: "A buffer that forwards reads must make sure the read eventually goes to its destination; repeatedly reading the data must not reset its timeout.", s: "§A4.3.4, p.75" }
        ]
      },
      {
        id: "qos", tab: "QoS accept", title: "A memory controller raises its QoS accept level",
        desc: "The controller's low-priority queue fills, so it raises VARQOSACCEPT to 8. A Manager with two requests waiting sends the QoS 12 one first; the QoS 2 request waits until the level drops.",
        ref: "§A4.8.1, p.86 · §A4.8.2, p.87",
        n: 13, gaps: [],
        sig: [
          { name: "VARQOSACCEPT", d: "pl", t: "bus", v: seq([["0", 2], ["8", 7], ["0", 4]]) },
          { name: "ARVALID", d: "lp", t: "bit", v: bits(13, [[3, 3], [10, 10]]) },
          { name: "ARREADY", d: "pl", t: "bit", v: bits(13, [[0, 12]]) },
          { name: "ARQOS", d: "lp", t: "bus", v: at(13, 3, ["12", "", "", "", "", "", "", "2"]) },
          { name: "Manager queue", d: "sb", t: "note", v: seq([["", 2], ["QoS12, QoS2", 1], ["QoS2 waits", 7], ["", 3]]) }
        ],
        steps: [
          { r: [2, 3], t: "Accept level rises; the Manager picks the high-QoS request", x: "VARQOSACCEPT = 8 means requests with QoS 8 or more will be accepted without delay. The Manager issues QoS 12 first.", w: "Without the hint, the Manager might put QoS 2 on the bus and block the AR channel while the controller stalls it.", s: "§A4.8.2, p.87" },
          { r: [4, 9], t: "Low-QoS request held back", x: "QoS 2 is below the accept level, so it may be stalled for a long time; the Manager keeps it queued instead. It is still allowed to send it, for example to avoid starvation.", s: "§A4.8.2, p.87" },
          { r: [10, 10], t: "Level drops", x: "VARQOSACCEPT returns to 0 and the QoS 2 request goes out. The QoS accept signals are synchronous to ACLK but tied to no channel handshake.", s: "§A4.8.2, p.87" }
        ]
      },
      {
        id: "region", tab: "Region", title: "One Subordinate port, two logical interfaces",
        desc: "A peripheral has registers at 0x4000_0000 and a data window at 0x9000_0000, both through one AXI port. The interconnect's decoder drives AWREGION so the peripheral never decodes high address bits.",
        ref: "§A4.7.2, p.84–85",
        n: 9, gaps: [],
        sig: [
          { name: "M AWVALID", d: "lp", t: "bit", v: bits(9, [[1, 1], [3, 3]]) },
          { name: "M AWADDR", d: "lp", t: "bus", v: at(9, 1, ["0x4000_0010", "", "0x9000_0200"]) },
          { name: "S AWVALID", d: "lp", t: "bit", v: bits(9, [[2, 2], [4, 4]]) },
          { name: "S AWREGION", d: "sb", t: "bus", v: at(9, 2, ["0 regs", "", "1 data"]) },
          { name: "S AWADDR[11:0]", d: "sb", t: "bus", v: at(9, 2, ["0x010", "", "0x200"]) }
        ],
        steps: [
          { r: [1, 2], t: "Register access", x: "The decoder matches 0x4000_0000 and drives AWREGION 0. The peripheral uses AWREGION and the low address bits only.", s: "§A4.7.2, p.84" },
          { r: [3, 4], t: "Data window access", x: "0x9000_0200 decodes to AWREGION 1. The region must stay constant within any 4 KB space, so a burst never changes region midway.", w: "AxREGION is not a new address space; it only saves the Subordinate a decode. It must appear only downstream of an address decode.", s: "§A4.7.2, p.84–85" },
          { r: [5, 8], t: "Unsupported regions", x: "If the peripheral implements fewer than 16 regions it must still respond correctly to the others, for example with an error response or by aliasing. Same-ID responses across regions must stay in order.", s: "§A4.7.2, p.84–85" }
        ]
      }
    ]
  };
})();
