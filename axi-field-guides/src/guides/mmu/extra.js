(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  if (!$("d-op") || typeof BigInt === "undefined") return;

  // [label, type, exc, sec, vmidv, asidv, leaf, stage, addr, arch]
  var OPS = [
    ["Guest OS TLBI by ASID and VA", 0, 2, 3, 1, 1, 0, 0, 1, "v7"],
    ["Guest OS TLBI by ASID and VA, Leaf only", 0, 2, 3, 1, 1, 1, 0, 1, "v8"],
    ["Guest OS TLBI by ASID", 0, 2, 3, 1, 1, 0, 0, 0, "v7"],
    ["Guest OS TLBI by IPA", 0, 2, 3, 1, 0, 0, 2, 1, "v8"],
    ["Guest OS TLBI all, Stage 1 and 2", 0, 2, 3, 1, 0, 0, 0, 0, "v7"],
    ["All OS TLBI all", 0, 2, 3, 0, 0, 0, 0, 0, "v7"],
    ["Hypervisor TLBI by VA", 0, 3, 3, 0, 0, 0, 0, 1, "v7"],
    ["EL3 TLBI all", 0, 1, 2, 0, 0, 0, 0, 0, "v8"],
    ["Realm Guest OS TLBI by ASID and VA", 0, 2, 0, 1, 1, 0, 0, 1, "v9.2"],
    ["GPT TLBI all", 0, 1, 2, 0, 0, 0, 3, 0, "v9.2"],
    ["BPI all", 1, 0, 0, 0, 0, 0, 0, 0, "v7"],
    ["Sync", 4, 0, 0, 0, 0, 0, 0, 0, "v7"]
  ];
  var sel = $("d-op");
  sel.innerHTML = OPS.map(function (o, i) { return "<option value=\"" + i + "\">" + o[0] + "</option>"; }).join("");

  function hex(v, d) { var s = v.toString(16).toUpperCase(); while (s.length < d) s = "0" + s; return "0x" + s; }
  function big(s) { s = (s || "").trim().replace(/^0x/i, "").replace(/_/g, ""); if (!/^[0-9a-f]+$/i.test(s)) return null; return BigInt("0x" + s); }
  function fld(v, lo, hi) { return (v >> BigInt(lo)) & ((1n << BigInt(hi - lo + 1)) - 1n); }
  function put(acc, val, lo) { return acc | (BigInt(val) << BigInt(lo)); }

  function run() {
    var o = OPS[+sel.value], type = o[1], exc = o[2], sec = o[3], vmidv = o[4], asidv = o[5], leaf = o[6], stage = o[7], addr = o[8];
    var isTlbi = type === 0, gpt = stage === 3;
    var rangeOk = isTlbi && addr === 1 && !gpt;
    $("d-rng").disabled = !rangeOk; if (!rangeOk) $("d-rng").checked = false;
    var range = $("d-rng").checked ? 1 : 0;
    ["d-sc", "d-num"].forEach(function (k) { $(k).disabled = !range; });
    ["d-va", "d-tg", "d-ttl"].forEach(function (k) { $(k).disabled = !(isTlbi && addr); });
    $("d-asid").disabled = !asidv; $("d-vmid").disabled = !vmidv;

    var notes = [], errs = [];
    var asid = asidv ? big($("d-asid").value) : 0n, vmid = vmidv ? big($("d-vmid").value) : 0n, va = (isTlbi && addr) ? big($("d-va").value) : 0n;
    if (asid === null || asid > 0xFFFFn) { errs.push("ASID must be up to 16 bits of hex."); asid = 0n; }
    if (vmid === null || vmid > 0xFFFFn) { errs.push("VMID must be up to 16 bits of hex."); vmid = 0n; }
    if (va === null || va >= (1n << 57n)) { errs.push("VA must fit in 57 bits."); va = 0n; }
    var tg = +$("d-tg").value, ttl = +$("d-ttl").value, scale = +$("d-sc").value, num = Math.max(0, Math.min(31, parseInt($("d-num").value, 10) || 0));

    var p1 = 0n, x1 = 0n, p2 = null, x2 = null;
    if (!isTlbi) {
      p1 = put(p1, type === 4 ? 1 : 0, 15); p1 = put(p1, type, 12);
    } else {
      p1 = put(p1, exc, 10); p1 = put(p1, sec, 8); p1 = put(p1, range, 7); p1 = put(p1, vmidv, 6); p1 = put(p1, asidv, 5);
      p1 = put(p1, stage, 2); p1 = put(p1, addr, 0);
      p1 |= fld(asid, 8, 15) << 32n; p1 |= fld(vmid, 0, 7) << 24n; p1 |= fld(asid, 0, 7) << 16n;
      x1 = fld(vmid, 8, 11);
      if (!addr) {
        p1 |= fld(vmid, 12, 15) << 40n;
      } else {
        p1 = put(p1, leaf, 4);
        p1 |= fld(va, 53, 56) << 44n; p1 |= fld(va, 45, 48) << 40n;
        p2 = 0n;
        p2 |= fld(va, 49, 52) << 44n; p2 |= fld(va, 41, 44) << 40n; p2 |= fld(va, 12, 39) << 12n; p2 |= fld(va, 40, 40) << 3n;
        p2 = put(p2, tg, 10); p2 = put(p2, ttl, 8);
        if (range) { p2 = put(p2, scale, 6); p2 = put(p2, (num >> 3) & 3, 4); p2 = put(p2, num & 7, 0); }
        x2 = fld(vmid, 12, 15);
      }
    }

    // bitfield for part 1 [15:0]
    var names = { 15: "Cmp", 14: "Type", 13: "Type", 12: "Type", 11: "Exc", 10: "Exc", 9: "Sec", 8: "Sec", 7: "Rng", 6: "VMIDV", 5: "ASIDV", 4: "Leaf", 3: "Stg", 2: "Stg", 1: "0", 0: "Addr" };
    var cls = { Cmp: "lp", Type: "lp", Exc: "pl", Sec: "pl", Stg: "pl", Leaf: "pl", VMIDV: "sb", ASIDV: "sb", Rng: "sb", Addr: "sb", "0": "" };
    var cells = "";
    for (var b = 15; b >= 0; b--) {
      var n = names[b];
      cells += "<div><span class=\"bn\">" + b + "</span><span class=\"f " + cls[n] + "\">" + Number(fld(p1, b, b)) + "</span><span class=\"bn\">" + n + "</span></div>";
    }
    $("d-bits").innerHTML = cells;

    var lines = [];
    lines.push("<strong>AC transfer 1</strong>: ACADDR = <span class=\"mono\">" + hex(p1, 12) + "</span>" + (isTlbi ? " · ACVMIDEXT = <span class=\"mono\">" + hex(x1, 1) + "</span>" : ""));
    if (p2 !== null) lines.push("<strong>AC transfer 2</strong>: ACADDR = <span class=\"mono\">" + hex(p2, 12) + "</span> · ACVMIDEXT = <span class=\"mono\">" + hex(x2, 1) + "</span> <span class=\"note-s\">(sent straight after transfer 1)</span>");

    if (type === 4) notes.push("Completion = 1: every receiver must later send a DVM Complete on AR.");
    if (addr) notes.push("VA[11:0] isn't carried: invalidations work on whole pages. In the first part ACADDR[47:40] carries VA[56:53] and VA[48:45]; VMID[15:12] moves to the second part's ACVMIDEXT.");
    else if (isTlbi && vmidv) notes.push("One-part message: VMID[15:12] goes in ACADDR[43:40], VMID[11:8] in ACVMIDEXT.");
    if (isTlbi && vmid > 0xFFn) notes.push("VMID wider than 8 bits needs ACVMIDEXT, so DVM_v8.1 or later. An 8-bit-VMID receiver ignores the upper byte and over-invalidates.");
    if (isTlbi && asid > 0xFFn) notes.push("16-bit ASID: an 8-bit-ASID receiver ignores ASID[15:8] and over-invalidates.");
    if (range) {
      var gb = [0, 4096, 16384, 65536][tg];
      if (!gb) errs.push("TG 00 is reserved for range invalidations.");
      else {
        var bytes = BigInt(num + 1) * (1n << BigInt(5 * scale + 1)) * BigInt(gb);
        var align = tg === 2 ? 2 : tg === 3 ? 4 : 0;
        if (align && fld(va, 12, 11 + align) !== 0n) errs.push("With a " + (tg === 2 ? "16KB" : "64KB") + " granule, VA[" + (11 + align) + ":12] must be zero.");
        var sz = bytes >= (1n << 30n) ? (bytes >> 30n) + " GB" : bytes >= (1n << 20n) ? (bytes >> 20n) + " MB" : (bytes >> 10n) + " KB";
        notes.push("Range: (Num+1) × 2^(5×Scale+1) × granule = " + (num + 1) + " × 2^" + (5 * scale + 1) + " × " + (gb >> 10) + "KB = <strong>" + sz + "</strong> from the base VA. Needs DVM_v8.4.");
      }
    }
    if (o[9] === "v9.2") notes.push("Needs DVM_v9.2 (Armv9.2: Realm and GPT messages).");
    if (!asidv && isTlbi) notes.push("ASIDV = 0, so ASID is driven as zero.");
    if (!vmidv && isTlbi) notes.push("VMIDV = 0, so VMID is driven as zero.");

    $("d-out").innerHTML = (errs.length ? "<span style=\"color:var(--bad)\">" + errs.join(" ") + "</span><br>" : "") + lines.join("<br>") +
      "<ul class=\"tight\" style=\"margin:8px 0 0;font-size:14px\">" + notes.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
  }
  ["d-op", "d-asid", "d-vmid", "d-va", "d-rng", "d-tg", "d-ttl", "d-sc", "d-num"].forEach(function (k) { $(k).addEventListener("input", run); $(k).addEventListener("change", run); });
  run();
})();
