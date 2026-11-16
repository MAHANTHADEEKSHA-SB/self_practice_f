(function () {
  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function bits(n, ranges) { var a = []; for (var i = 0; i < n; i++) a.push("0"); (ranges || []).forEach(function (r) { for (var k = r[0]; k <= r[1]; k++) a[k] = "1"; }); return a.join(""); }
  function at(n, s, labels) { var a = []; for (var i = 0; i < n; i++) a.push(""); labels.forEach(function (l, k) { a[s + k] = l; }); return a; }

  window.PAGE = {
    CW: 54,
    dirName: { lp: "Manager", pl: "Subordinate", cfg: "Property" },
    dirCls: { cfg: "sb" },
    groups: [["all", "All"], ["mmu", "Untranslated"], ["dvm", "DVM (snoop channels)"], ["con", "Coherency connection"], ["prop", "Properties"]],
    sigs: [
      ["mmu", "AxMMUVALID", "lp", "level", "Address is virtual and needs translation", "Default 1. LOW = physical address; other AxMMU* fields don't apply. v3 and later.", "Table A13.2, p.207 · §A13.7, p.217"],
      ["mmu", "AxMMUSECSID [SECSID_WIDTH-1:0]", "lp", "bus", "Security of the virtual address space", "00 Non-secure, 01 Secure, 10 Realm.", "Table A13.4, p.209"],
      ["mmu", "AxMMUSID [SID_WIDTH-1:0]", "lp", "bus", "StreamID: picks a translation context", "0–32 bits. For PCIe: the Requester ID. Untied upper bits LOW.", "§A13.4.2, p.210 · §A13.5, p.212"],
      ["mmu", "AxMMUSSIDV, AxMMUSSID [SSID_WIDTH-1:0]", "lp", "bus", "SubstreamID: per-process space within a stream", "0–20 bits. For PCIe: the PASID. SSID 0 when SSIDV LOW.", "§A13.4.3, p.210"],
      ["mmu", "AxMMUFLOW [1:0] / AxMMUATST", "lp", "bus", "What the SMMU does on a translation fault", "00 Stall, 01 ATST, 10 NoStall, 11 PRI (v2+). v1 used ATST only.", "Tables A13.2, A13.8, p.207–214"],
      ["mmu", "AxMMUPM, AxMMUPASUNKNOWN", "lp", "level", "Protected Mode; no PAS expectation", "v4 only: GDI NSP access and PCIe XT mode.", "Table A13.2, p.207 · §A13.4.4–A13.5.1, p.211–212"],
      ["mmu", "AWSNOOP 0b01110 / 0b10001", "lp", "bus", "StashTranslation / UnstashTranslation hints", "AW and B only. OKAY means accepted, not done. Unstash needs AWSNOOP_WIDTH 5 and a unique ID.", "§A13.9–A13.10, p.219–221"],
      ["dvm", "ACVALID, ACREADY, ACADDR, ACVMIDEXT, ACTRACE", "pl", "bus", "DVM message request, interconnect → Manager", "Opposite direction to normal requests. Two-part messages go back to back.", "Table A15.17, p.249 · §A15.4, p.248"],
      ["dvm", "CRVALID, CRREADY, CRTRACE", "lp", "level", "DVM message response, Manager → interconnect", "Only acknowledges receipt; in order (no reordering on AC/CR).", "Table A15.18, p.249–250"],
      ["dvm", "ACPENDING/ACCRDT, CRPENDING/CRCRDT", "pl", "pulse", "Credited snoop channels", "One Resource Plane, no shared credits. The Manager answers only after a request.", "Tables A15.17–A15.18, p.249 · §A15.4.3, p.250"],
      ["dvm", "ACTIVATEREQD, ACTIVATEACKD, ASKSTOPD", "pl", "level", "Credit control for credited snoop channels", "REQD from the Subordinate; ACKD, ASKSTOPD from the Manager (roles swapped versus A14.2). Independent of the main channels and of SYSCOREQ.", "§A15.7 and Table A15.27, p.263"],
      ["dvm", "ACWAKEUP", "pl", "level", "A DVM message is coming", "Recommended one cycle before ACVALID; held until the AC handshake.", "§A14.1.3, p.224"],
      ["con", "SYSCOREQ", "lp", "level", "Manager wants DVM messages", "Four-phase handshake; LOW in reset.", "Table A15.25, p.260"],
      ["con", "SYSCOACK", "pl", "level", "Interconnect will send DVM messages", "Changes only when SYSCOREQ is at the opposite level.", "Table A15.25, p.260 · §A15.6.1, p.261"],
      ["con", "AWAKEUP", "lp", "level", "Keeps the interconnect awake for the handshake", "Needed to guarantee a SYSCOACK change; once raised mid-handshake, held until SYSCOACK follows.", "§A14.1.2, p.224"],
      ["prop", "Untranslated_Transactions", "cfg", "v1–v4", "Untranslated version", "v2+ adds TRANSFAULT (3-bit xRESP); v3 AxMMUVALID; v4 PM/PASUNKNOWN for GDI and PCIe XT.", "Tables A13.1, A13.3, p.206–208"],
      ["prop", "DVM_Message_Support, DVM_v8 … DVM_v9.2", "cfg", "Receiver / False", "DVM on AC/CR, Complete on AR/R", "Bidirectional deprecated. Receiver needs Shareable_Transactions.", "Tables A15.1–A15.2, p.233"],
      ["prop", "Coherency_Connection_Signals", "cfg", "bool", "SYSCOREQ/ACK present", "No defaults: both sides must have them or neither.", "Table A15.24, p.260"]
    ],

    wgroups: [["all", "All"], ["mmu", "Untranslated"], ["fault", "Fault flows"], ["dvm", "DVM"], ["con", "Connection"]],

    scenarios: [
      {
        id: "va", tab: "VA through SMMU", title: "A device read with a virtual address, translated by the SMMU",
        desc: "A GPU issues a read with ARMMUVALID HIGH, StreamID 0x40 and SubstreamID 7 (a process). The SMMU misses its TLB, walks the tables, and sends the read downstream with the physical address.",
        ref: "§A13.1, p.205 · §A13.3–A13.4, p.207–210",
        n: 14, gaps: [],
        sig: [
          { name: "M ARVALID", d: "lp", t: "bit", v: bits(14, [[1, 1]]) },
          { name: "M ARADDR (VA)", d: "lp", t: "bus", v: at(14, 1, ["0x7F00_1240"]) },
          { name: "M ARMMUVALID", d: "lp", t: "bit", v: bits(14, [[1, 1]]) },
          { name: "M SID / SSID", d: "lp", t: "bus", v: at(14, 1, ["0x40 / 7"]) },
          { name: "SMMU", d: "sb", t: "note", v: seq([["", 2], ["TLB miss: walk tables", 6], ["", 6]]) },
          { name: "S ARVALID", d: "lp", t: "bit", v: bits(14, [[8, 8]]) },
          { name: "S ARADDR (PA)", d: "lp", t: "bus", v: at(14, 8, ["0x8_2311_0240"]) },
          { name: "M RVALID", d: "pl", t: "bit", v: bits(14, [[12, 12]]) }
        ],
        steps: [
          { r: [1, 1], t: "Untranslated request", x: "ARMMUVALID HIGH: the address is virtual. SECSID says which security space, SID picks the device's context (for PCIe, its Requester ID), SSIDV/SSID pick the process (PCIe PASID).", s: "§A13.3, p.207 · §A13.4, p.209–210 · §A13.5, p.212" },
          { r: [2, 7], t: "Translation", x: "The SMMU looks up its TLB and, on a miss, walks the translation tables in memory. DVM TLB invalidations keep this TLB consistent with the CPU's page-table updates.", w: "Translation must happen before the coherent interconnect, because hardware coherency needs one physical address space.", s: "§A13.1, p.205 · §A13.2, p.206" },
          { r: [8, 12], t: "Physical request downstream", x: "The read leaves the SMMU with a PA and goes on as a normal transaction. Translated and untranslated transactions on one interface may not share in-flight IDs.", s: "§A13.7, p.217" }
        ]
      },
      {
        id: "pri", tab: "PRI fault", title: "PRI flow: TRANSFAULT, page request, retry",
        desc: "A PCIe integrated endpoint reads with ARMMUFLOW = PRI. The page isn't mapped, so the SMMU terminates the read with TRANSFAULT on every beat. The device asks for the page through PCIe PRI (not on AXI), then retries.",
        ref: "§A13.6, p.214–216",
        n: 16, gaps: [7],
        sig: [
          { name: "ARVALID", d: "lp", t: "bit", v: bits(16, [[1, 1], [9, 9]]) },
          { name: "ARMMUFLOW", d: "lp", t: "bus", v: at(16, 1, ["PRI", "", "", "", "", "", "", "", "PRI"]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(16, [[3, 4], [12, 13]]) },
          { name: "RRESP", d: "pl", t: "bus", v: at(16, 3, ["TRANSFAULT", "TRANSFAULT", "", "", "", "", "", "", "", "OKAY", "OKAY"]) },
          { name: "device", d: "sb", t: "note", v: seq([["", 5], ["PRI page request", 2], ["", 1], ["retry", 2], ["", 6]]) }
        ],
        steps: [
          { r: [1, 4], t: "Fault reported, not stalled", x: "With PRI the SMMU doesn't stall the transaction. It ends it with TRANSFAULT (0b101), which needs 3-bit RRESP, on every beat; the data isn't valid.", s: "§A13.6.4, p.216 · Table A3.31, p.63" },
          { r: [5, 6], t: "Page request outside AXI", x: "The endpoint uses PCIe's Page Request Interface to ask software to map the page.", w: "Stalling a PCIe device's transaction while software handles a fault can deadlock or time out. PRI moves the wait into the device.", s: "§A13.6.1, p.215 · §A13.6.4, p.216" },
          { r: [9, 13], t: "Retry succeeds", x: "Same request again; translation now works and data returns OKAY. The SMMU may still answer SLVERR if the translation genuinely fails.", s: "§A13.6.4, p.216" }
        ]
      },
      {
        id: "stash", tab: "StashTranslation", title: "StashTranslation: warm the SMMU's TLB before the burst arrives",
        desc: "A network controller knows it will DMA into a receive buffer soon. It sends a StashTranslation for the buffer's VA so the SMMU walks the tables early. It has no data; the B response only says the hint was accepted.",
        ref: "§A13.9, p.219",
        n: 14, gaps: [],
        sig: [
          { name: "AWVALID", d: "lp", t: "bit", v: bits(14, [[1, 1], [9, 9]]) },
          { name: "AWSNOOP / AWID", d: "lp", t: "bus", v: at(14, 1, ["01110 / 7", "", "", "", "", "", "", "", "write / 2"]) },
          { name: "WVALID", d: "lp", t: "bit", v: bits(14, [[9, 10]]) },
          { name: "SMMU", d: "sb", t: "note", v: seq([["", 2], ["walk tables, fill TLB", 5], ["", 2], ["TLB hit", 2], ["", 3]]) },
          { name: "BVALID", d: "pl", t: "bit", v: bits(14, [[2, 2], [12, 12]]) },
          { name: "BID / BRESP", d: "pl", t: "bus", v: at(14, 2, ["7 OKAY", "", "", "", "", "", "", "", "", "", "2 OKAY"]) }
        ],
        steps: [
          { r: [1, 2], t: "Hint, answered at once", x: "AWSNOOP 0b01110, no W beats, no stash target, AWATOP and AWTAGOP zero. OKAY means accepted, not that the translation is cached.", s: "§A13.9, p.219" },
          { r: [3, 7], t: "Walk in the background", x: "The SMMU may fetch and cache the table entry. With AWMMUVALID LOW (RME systems), it would cache the Granule Protection Table entry for a PA instead.", s: "§A13.9, p.219" },
          { r: [9, 12], t: "Real DMA hits", x: "The write that follows finds the translation already in the TLB. StashTranslation used ID 7, not shared with any outstanding ordinary write, so it never had to wait for or hold up other traffic.", w: "Separate IDs remove all ordering between the hint and real writes, so a Subordinate that ignores hints can answer immediately.", s: "§A13.9, p.219" }
        ]
      },
      {
        id: "dvm", tab: "TLBI + Sync", title: "DVM: TLB invalidate by address, then Sync and Complete",
        desc: "The CPU changes a page table entry for a device. The interconnect sends the SMMU a two-part TLBI on AC, then a DVM Sync. When the SMMU has finished, it issues DVM Complete on its AR channel; the interconnect answers on R.",
        ref: "§A15.4, p.248–250 · §A15.5, p.258–259",
        n: 16, gaps: [], cw: 68,
        sig: [
          { name: "ACVALID", d: "pl", t: "bit", v: bits(16, [[1, 2], [6, 6]]) },
          { name: "AC message", d: "pl", t: "bus", v: at(16, 1, ["TLBI 1", "TLBI 2", "", "", "", "Sync"]) },
          { name: "CRVALID", d: "lp", t: "bit", v: bits(16, [[3, 4], [7, 7]]) },
          { name: "SMMU", d: "sb", t: "note", v: seq([["", 3], ["invalidate TLB entries, drain old-translation traffic", 8], ["", 5]]) },
          { name: "ARVALID", d: "lp", t: "bit", v: bits(16, [[11, 11]]) },
          { name: "AR", d: "lp", t: "bus", v: at(16, 11, ["Complete"]) },
          { name: "RVALID", d: "pl", t: "bit", v: bits(16, [[13, 13]]) }
        ],
        steps: [
          { r: [1, 4], t: "Two-part TLBI", x: "A DVM message with an address needs two transactions, sent back to back on AC with nothing in between. The Manager acknowledges each on CR; the acknowledgement only means received.", s: "§A15.4, p.248 · Table A15.18, p.249–250" },
          { r: [6, 7], t: "DVM Sync", x: "The CR response to the Sync must not depend on progress of any AR or AW transaction.", s: "§A15.5, p.258" },
          { r: [8, 11], t: "DVM Complete on AR", x: "When the invalidation is done (old translations unusable and every transaction that used them complete), the SMMU sends DVM Complete: ARSNOOP 0b1110, ARADDR 0, INCR, Length 1, Shareable, ARCACHE 0b0010, and an ARID not used by any outstanding read other than a DVM Complete. It must be sent in a timely manner even if more DVM messages keep arriving.", w: "Draining old traffic can take a long time, which is why completion is a separate later transaction and the CR acknowledgement never waits for it.", s: "§A15.5, p.258 · Table A15.23, p.259" },
          { r: [13, 13], t: "R response", x: "The interconnect answers DVM Complete on R; the data isn't valid. Now the CPU's TLBI can be reported done.", s: "§A15.5, p.258" }
        ]
      },
      {
        id: "con", tab: "Coherency connection", title: "SYSCOREQ / SYSCOACK: connect, then disconnect before power-down",
        desc: "An SMMU powers up and asks to receive DVM messages; later it asks to stop before it is powered down. A four-phase handshake that is safe across clock domains.",
        ref: "§A15.6, p.260–262 · Figure A15.4, p.261",
        n: 16, gaps: [],
        sig: [
          { name: "SYSCOREQ", d: "lp", t: "bit", v: bits(16, [[2, 10]]) },
          { name: "SYSCOACK", d: "pl", t: "bit", v: bits(16, [[5, 13]]) },
          { name: "AWAKEUP", d: "lp", t: "bit", v: bits(16, [[2, 5], [11, 13]]) },
          { name: "state", d: "sb", t: "note", v: seq([["Disabled", 2], ["Connect", 3], ["Enabled", 6], ["Disconnect", 3], ["Disabled", 2]]) },
          { name: "AC traffic", d: "pl", t: "bus", v: seq([["", 6], ["DVM messages", 4], ["", 6]]) }
        ],
        steps: [
          { r: [0, 1], t: "Disabled", x: "Both LOW. The interconnect sends no DVM messages and treats DVM Syncs as complete for this Manager; the Manager must not use DVM-managed translations.", s: "Table A15.26, p.261" },
          { r: [2, 4], t: "Connect", x: "The Manager raises SYSCOREQ (and AWAKEUP, if present, so the interconnect is awake to answer). It must already be able to receive and answer DVM messages, because SYSCOACK and the first ACVALID can race. It must not use DVM-managed translations until SYSCOACK.", s: "Table A15.26, p.261–262 · §A14.1.2, p.224" },
          { r: [5, 10], t: "Enabled", x: "SYSCOACK HIGH: DVM messages may arrive. A Manager may only change SYSCOREQ when SYSCOACK has the same level; a Subordinate may only change SYSCOACK when SYSCOREQ has the opposite level.", w: "Four phases mean each side only ever reacts to a stable level, which is what makes it safe across asynchronous clock domains.", s: "§A15.6.1, p.260–261" },
          { r: [11, 15], t: "Disconnect, then power down", x: "SYSCOREQ falls. The interconnect stops sending, finishes any two-part message it started and waits for every outstanding CR response, then drops SYSCOACK. Only then can the SMMU switch off its DVM logic. A DVM Complete still owed for an earlier Sync must be sent even after the disconnect.", s: "Table A15.26, p.262 · §A15.6.1, p.262" }
        ]
      }
    ]
  };
})();
