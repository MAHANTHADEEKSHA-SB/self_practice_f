(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  if (!$("m-sup")) return;
  function run() {
    var sup = $("m-sup").value, rme = $("m-rme").checked;
    var pw = sup === "12" ? 12 : 9, sw = rme ? 2 : 1, width = sw + pw + 1;
    var partid = parseInt($("m-part").value, 10) || 0, pmg = parseInt($("m-pmg").value, 10) || 0, sp = parseInt($("m-sp").value, 10) || 0;
    var errs = [];
    if (partid < 0 || partid >= (1 << pw)) errs.push("PARTID must fit in " + pw + " bits (0–" + ((1 << pw) - 1) + ").");
    if (pmg < 0 || pmg > 1) errs.push("PMG is 1 bit.");
    if (sp < 0 || sp >= (1 << sw)) errs.push((rme ? "MPAM_SP" : "MPAM_NS") + " is " + sw + " bit" + (sw > 1 ? "s" : "") + ".");
    $("m-spl").textContent = rme ? "MPAM_SP (2 bits)" : "MPAM_NS (1 bit)";
    var val = (pmg << (sw + pw)) | ((partid & ((1 << pw) - 1)) << sw) | (sp & ((1 << sw) - 1));
    var cells = "";
    for (var b = width - 1; b >= 0; b--) {
      var f = b === width - 1 ? "PMG" : (b >= sw ? "PARTID" : (rme ? "SP" : "NS"));
      var cls = f === "PMG" ? "sb" : f === "PARTID" ? "lp" : "pl";
      cells += "<div><span class=\"bn\">" + b + "</span><span class=\"f " + cls + "\">" + ((val >> b) & 1) + "</span><span class=\"bn\">" + f + "</span></div>";
    }
    $("m-bits").innerHTML = cells;
    var tbl = { "9": { false: "Table A12.3", true: "Table A12.4" }, "12": { false: "Table A12.5", true: "Table A12.6" } }[sup][rme];
    $("m-out").innerHTML = (errs.length ? "<span style=\"color:var(--bad)\">" + errs.join(" ") + "</span><br>" : "") +
      "MPAM_WIDTH = <strong>" + width + "</strong> · AxMPAM = <span class=\"mono\">0x" + val.toString(16).toUpperCase() + "</span> · layout from " + tbl + " (p.188)" +
      (rme ? "<br><span class=\"note-s\">With RME, MPAM_SP carries the physical address space instead of a 1-bit security flag.</span>" : "");
  }
  ["m-sup", "m-rme", "m-part", "m-pmg", "m-sp"].forEach(function (k) { $(k).addEventListener("input", run); $(k).addEventListener("change", run); });
  run();
})();
