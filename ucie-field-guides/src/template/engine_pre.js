(function () {
  "use strict";
  var P = window.PAGE || {};
  function $(id) { return document.getElementById(id); }

  /* ---------- signal / field table ---------- */
  (function () {
    var chipsEl = $("sigchips"), bodyEl = $("sigbody");
    if (!chipsEl || !bodyEl || !P.sigs) return;
    var dirName = P.dirName || { lp: "Upper", pl: "Lower", both: "both" };
    var dirCls = P.dirCls || {};
    var active = "all";
    function drawTable() {
      var html = "";
      P.sigs.forEach(function (r) {
        if (active !== "all" && r[0] !== active) return;
        var dirTxt = dirName[r[2]] || r[2];
        var cls = dirCls[r[2]] !== undefined ? dirCls[r[2]] : (r[2] === "both" ? "" : r[2]);
        html += "<tr><td class=\"sig " + cls + "\">" + r[1] + "</td><td class=\"dir " + cls + "\">" + dirTxt +
          "</td><td><span class=\"pill\">" + r[3] + "</span></td><td>" + r[4] + "</td><td>" + r[5] + "</td><td class=\"ref\">" + (r[6] || "") + "</td></tr>";
      });
      bodyEl.innerHTML = html;
    }
    P.groups.forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = g[1];
      b.setAttribute("aria-pressed", g[0] === active ? "true" : "false");
      b.addEventListener("click", function () {
        active = g[0];
        Array.prototype.forEach.call(chipsEl.children, function (c) { c.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        drawTable();
      });
      chipsEl.appendChild(b);
    });
    drawTable();
  })();

  /* ---------- rationale filter ---------- */
  (function () {
    var wchips = $("whychips");
    if (!wchips || !P.wgroups) return;
    var wcards = document.querySelectorAll(".wcard");
    var wactive = "all";
    P.wgroups.forEach(function (g) {
      var count = 0;
      Array.prototype.forEach.call(wcards, function (c) { if (g[0] === "all" || c.getAttribute("data-g") === g[0]) count++; });
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = g[1] + " · " + count;
      b.setAttribute("aria-pressed", g[0] === wactive ? "true" : "false");
      b.addEventListener("click", function () {
        wactive = g[0];
        Array.prototype.forEach.call(wchips.children, function (c) { c.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        Array.prototype.forEach.call(wcards, function (c) { c.hidden = !(wactive === "all" || c.getAttribute("data-g") === wactive); });
      });
      wchips.appendChild(b);
    });
  })();

  /* ---------- waveform engine ---------- */
  var CW = P.CW || 34, LW = P.LW || 196, RH = 28, TOP = 20;
