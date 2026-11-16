(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  if (!$("ex-log")) return;
  var mon = {}, log = [];
  function gran() { return parseInt($("ex-gran").value, 10); }
  function base(a) { var g = gran(); return Math.floor(a / g) * g; }
  function hx(n) { return "0x" + n.toString(16).toUpperCase(); }
  function monStr() {
    var k = Object.keys(mon).sort();
    return k.length ? k.map(function (x) { return x + " → " + hx(mon[x]) + (gran() > 1 ? "+" + gran() : ""); }).join(", ") : "none";
  }
  function apply(m, id, op, addr) {
    var sup = $("ex-sup").checked, key = m + ":ID" + id, b = base(addr), resp = "OKAY", upd = "-", note = "";
    if (op === "ExRd") {
      if (!sup) { note = "Subordinate has no monitor: data valid, nothing monitored"; }
      else { mon[key] = b; resp = "EXOKAY"; note = "monitor for " + key + " now holds " + hx(b); }
    } else if (op === "ExWr") {
      if (!sup) { upd = "yes"; note = "no monitor: an exclusive write always updates"; }
      else if (mon[key] === b) {
        resp = "EXOKAY"; upd = "yes"; note = "monitor still held: success";
        Object.keys(mon).forEach(function (k) { if (mon[k] === b) delete mon[k]; });
      } else { upd = "no"; note = mon[key] === undefined ? "no monitor for " + key : "monitor for " + key + " holds " + hx(mon[key]) + ", not this address"; }
    } else if (op === "Wr") {
      upd = "yes"; var cl = [];
      Object.keys(mon).forEach(function (k) { if (mon[k] === b) { cl.push(k); delete mon[k]; } });
      note = cl.length ? "clears " + cl.join(", ") : "no monitor affected";
    } else { note = "reads never change a monitor"; }
    log.push([m + " ID" + id, op, hx(addr), resp, upd, note, monStr()]);
  }
  var OPN = { ExRd: "exclusive read", ExWr: "exclusive write", Wr: "write", Rd: "read" };
  function draw() {
    $("ex-log").innerHTML = log.length ? log.map(function (r, i) {
      var cls = r[3] === "EXOKAY" ? "pl" : (r[1] === "ExWr" ? "bad" : "");
      return "<tr><td class=\"num\">" + (i + 1) + "</td><td class=\"mono\">" + r[0] + "</td><td>" + OPN[r[1]] + "</td><td class=\"mono\">" + r[2] + "</td><td class=\"mono " + cls + "\" style=\"" + (cls === "bad" ? "color:var(--bad)" : "") + "\">" + r[3] + "</td><td>" + r[4] + "</td><td style=\"font-size:13px;color:var(--muted)\">" + r[5] + "</td><td class=\"mono\" style=\"font-size:12px\">" + r[6] + "</td></tr>";
    }).join("") : "<tr><td colspan=\"8\" style=\"color:var(--muted)\">Add events or pick a preset.</td></tr>";
  }
  function reset() { mon = {}; log = []; }
  var P = {
    ok: [["M0", 0, "ExRd", 0x100], ["M0", 0, "ExWr", 0x100]],
    clash: [["M0", 0, "ExRd", 0x100], ["M1", 0, "Wr", 0x100], ["M0", 0, "ExWr", 0x100]],
    race: [["M0", 0, "ExRd", 0x100], ["M1", 0, "ExRd", 0x100], ["M1", 0, "ExWr", 0x100], ["M0", 0, "ExWr", 0x100]],
    rearm: [["M0", 0, "ExRd", 0x100], ["M0", 0, "ExRd", 0x200], ["M0", 0, "ExWr", 0x100]],
    nb: [["M0", 0, "ExRd", 0x100], ["M1", 0, "Wr", 0x108], ["M0", 0, "ExWr", 0x100]],
    twoid: [["M0", 0, "ExRd", 0x100], ["M0", 1, "ExRd", 0x200], ["M0", 1, "ExWr", 0x200], ["M0", 0, "ExWr", 0x100]]
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-ex]"), function (b) {
    b.addEventListener("click", function () { reset(); P[b.getAttribute("data-ex")].forEach(function (e) { apply(e[0], e[1], e[2], e[3]); }); draw(); });
  });
  $("ex-add").addEventListener("click", function () {
    var a = parseInt($("ex-addr").value.replace(/^0x/i, ""), 16);
    if (isNaN(a)) return;
    apply($("ex-m").value, parseInt($("ex-id").value, 10), $("ex-op").value, a); draw();
  });
  $("ex-reset").addEventListener("click", function () { reset(); draw(); });
  $("ex-gran").addEventListener("change", function () { reset(); draw(); });
  $("ex-sup").addEventListener("change", function () { reset(); draw(); });
  draw();
})();
