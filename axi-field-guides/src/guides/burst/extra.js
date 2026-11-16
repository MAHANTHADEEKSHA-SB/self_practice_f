(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  if (!$("c-addr")) return;
  function hex(b, w) { var s = b.toString(16).toUpperCase(); while (w && s.length < w) s = "0" + s; return "0x" + s; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function run() {
    var out = $("c-out"), chk = $("c-checks");
    var raw = $("c-addr").value.trim().replace(/_/g, "");
    var start;
    try { start = BigInt(/^0x/i.test(raw) ? raw : "0x" + raw); } catch (e) { chk.innerHTML = "<li class=\"bad\">Address must be hexadecimal, for example 0x1F08.</li>"; out.innerHTML = ""; return; }
    var lenField = parseInt($("c-len").value, 10);
    if (isNaN(lenField) || lenField < 0 || lenField > 255) { chk.innerHTML = "<li class=\"bad\">AxLEN must be 0 to 255 (8 bits).</li>"; out.innerHTML = ""; return; }
    var L = lenField + 1;
    var sizeEnc = parseInt($("c-size").value, 10), S = 1 << sizeEnc;
    var burst = $("c-burst").value;
    var DB = parseInt($("c-width").value, 10) / 8;
    var isWrite = $("c-dir").value === "w";
    var Sb = BigInt(S), Lb = BigInt(L), DBb = BigInt(DB);

    var checks = [];
    function ok(c, t, r) { checks.push([c ? "ok" : "bad", t, r]); }
    function info(t, r) { checks.push(["info", t, r]); }

    ok(S <= DB, "Size " + S + " B " + (S <= DB ? "fits" : "is wider than") + " the " + DB * 8 + "-bit channel", "§A3.1.1, p.43");
    if (burst === "WRAP") {
      ok([2, 4, 8, 16].indexOf(L) >= 0, "WRAP Length " + L + (([2, 4, 8, 16].indexOf(L) >= 0) ? " is 2, 4, 8 or 16" : " must be 2, 4, 8 or 16"), "§A3.1.4, p.47");
      ok(start % Sb === 0n, "WRAP start " + (start % Sb === 0n ? "is" : "is not") + " aligned to Size", "§A3.1.4, p.47");
    }
    if (burst === "FIXED") ok(L <= 16, "FIXED Length " + L + (L <= 16 ? " ≤ 16" : " exceeds 16"), "§A3.1.4, p.47");
    var aligned0 = (start / Sb) * Sb;
    var cont = Sb * Lb;
    var first = start, last;
    if (burst === "INCR") last = aligned0 + cont - 1n;
    else if (burst === "WRAP") { var lb = (start / cont) * cont; first = lb; last = lb + cont - 1n; }
    else last = aligned0 + Sb - 1n;
    ok((first >> 12n) === (last >> 12n), "Bytes " + hex(first) + "–" + hex(last) + ((first >> 12n) === (last >> 12n) ? " stay inside one 4 KB page" : " cross a 4 KB boundary at " + hex((last >> 12n) << 12n)), "§A3.1, p.43");
    ok(S * L <= 4096, "Size × Length = " + S * L + " B" + (S * L <= 4096 ? " ≤ 4096" : " exceeds 4 KB"), "§A3.1.3, p.45");
    var mtb = null;
    [64, 128, 256, 512, 1024, 2048, 4096].some(function (m) { var mb = BigInt(m); if (S * L <= m && (first / mb) === (last / mb)) { mtb = m; return true; } return false; });
    info(mtb ? "Allowed by Max_Transaction_Bytes ≥ " + mtb : "Not allowed by any Max_Transaction_Bytes value", "§A3.1.3, Table A3.6, p.45");
    var regular = [1, 2, 4, 8, 16].indexOf(L) >= 0 && (L === 1 || S === DB) && burst !== "FIXED" &&
      ((burst === "INCR" && start % cont === 0n) || (burst === "WRAP" && start % Sb === 0n));
    info(regular ? "Regular transaction" : "Not Regular (a Regular_Transactions_Only Subordinate would not accept it)", "§A3.1.8, p.52");
    if (burst === "FIXED") info("FIXED: only with WriteNoSnoop / ReadNoSnoop; a Fixed_Burst_Disable Subordinate rejects it", "§A3.1.4, p.48");
    if (burst === "WRAP") info("If Wrap_CLS_Modifiable is True, WRAP must also be cache-line sized and Modifiable", "Table A3.11, p.47");

    chk.innerHTML = checks.map(function (c) {
      var ic = c[0] === "ok" ? "✓" : (c[0] === "bad" ? "✗" : "•");
      return "<li class=\"" + c[0] + "\"><span class=\"ic\">" + ic + "</span> " + esc(c[1]) + " <span class=\"ref\">" + esc(c[2]) + "</span></li>";
    }).join("");

    /* beats, following the pseudocode of §A3.1.7 */
    var addr = start, aligned = aligned0 === addr, lw = 0n, uw = 0n;
    if (burst === "WRAP") { lw = (addr / cont) * cont; uw = lw + cont; }
    var rows = [], total = 0, showN = Math.min(L, 64);
    for (var n = 1; n <= L; n++) {
      var lower = addr - (addr / DBb) * DBb, upper;
      if (aligned) upper = lower + Sb - 1n; else upper = aligned0 + Sb - 1n - (addr / DBb) * DBb;
      var lo = Number(lower), up = Number(upper);
      total += up - lo + 1;
      if (n <= showN) rows.push([n, addr, lo, up]);
      if (burst !== "FIXED") {
        if (aligned) { addr = addr + Sb; if (burst === "WRAP" && addr >= uw) addr = lw; }
        else { addr = aligned0 + Sb; aligned = true; }
      }
    }
    var cell = DB > 32 ? 6 : (DB > 16 ? 12 : 22);
    var html = "<p class=\"note-s\" style=\"margin:0 0 8px\">Aligned_Addr " + hex(aligned0) + " · container " + (burst === "WRAP" ? hex(lw) + "–" + hex(uw - 1n) : hex(aligned0) + "–" + hex(aligned0 + cont - 1n)) +
      " · Size × Length " + S * L + " B · bytes actually on the lanes " + total + (burst === "WRAP" ? " · Wrap_Boundary " + hex(lw) : "") + "</p>";
    html += "<div class=\"tbl-wrap\"><table class=\"calc-t\"><thead><tr><th class=\"num\">Beat</th><th>Address_N</th><th class=\"num\">Lanes</th>" + (isWrite ? "<th>WSTRB (max)</th>" : "<th>Valid bytes</th>") + "<th>Byte lanes (lane 0 on the right)</th></tr></thead><tbody>";
    rows.forEach(function (r) {
      var mask = 0n; for (var k = r[2]; k <= r[3]; k++) mask |= (1n << BigInt(k));
      var grid = "<div class=\"lanes\" style=\"grid-template-columns:repeat(" + DB + "," + cell + "px)\">";
      for (var j = DB - 1; j >= 0; j--) grid += "<i class=\"" + (j >= r[2] && j <= r[3] ? "on" : "") + "\" title=\"lane " + j + "\"></i>";
      grid += "</div>";
      html += "<tr><td class=\"num\">" + r[0] + "</td><td class=\"mono\">" + hex(r[1]) + "</td><td class=\"num mono\">" + r[3] + ":" + r[2] + "</td><td class=\"mono\">" + (isWrite ? hex(mask, Math.ceil(DB / 4)) : (r[3] - r[2] + 1) + " B") + "</td><td>" + grid + "</td></tr>";
    });
    html += "</tbody></table></div>";
    if (L > showN) html += "<p class=\"note-s\">Showing the first " + showN + " of " + L + " beats.</p>";
    out.innerHTML = html;
  }
  ["c-addr", "c-len", "c-size", "c-burst", "c-width", "c-dir"].forEach(function (id) { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) {
    b.addEventListener("click", function () {
      var p = b.getAttribute("data-preset").split(",");
      $("c-addr").value = p[0]; $("c-len").value = p[1]; $("c-size").value = p[2]; $("c-burst").value = p[3]; $("c-width").value = p[4]; $("c-dir").value = p[5];
      run();
    });
  });
  run();
})();
