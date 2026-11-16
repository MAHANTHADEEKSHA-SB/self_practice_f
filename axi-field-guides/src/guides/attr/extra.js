(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  if (!$("mt-bits")) return;
  var T = {
    DevNB: ["Device Non-bufferable", "Response and read data from the final destination; Non-modifiable; no prefetch; no write merging."],
    DevB: ["Device Bufferable", "Write response may come from an intermediate point, write must reach the destination in a timely manner; read data from the final destination; Non-modifiable; no prefetch; no merging."],
    NNCNB: ["Normal Non-cacheable Non-bufferable", "Response and read data from the final destination; Modifiable; writes may merge."],
    NNCB: ["Normal Non-cacheable Bufferable", "Early write response allowed, timely visibility; read data from the destination or from the newest in-flight write (not cached for later); Modifiable; writes may merge."],
    WTNA: ["Write-Through No-Allocate", "Early write response, timely visibility; reads may hit an intermediate cached copy; Modifiable; prefetch and merge allowed; cache lookup required; allocation not recommended."],
    WTRA: ["Write-Through Read-Allocate", "As Write-Through No-Allocate; allocation recommended for reads, not for writes."],
    WTWA: ["Write-Through Write-Allocate", "As Write-Through No-Allocate; allocation recommended for writes, not for reads."],
    WTRWA: ["Write-Through Read and Write-Allocate", "As Write-Through No-Allocate; allocation recommended for reads and writes."],
    WBNA: ["Write-Back No-Allocate", "Early write response; writes need not reach the final destination; reads may hit a cached copy; Modifiable; prefetch and merge allowed; lookup required; allocation not recommended."],
    WBRA: ["Write-Back Read-Allocate", "As Write-Back No-Allocate; allocation recommended for reads, not for writes."],
    WBWA: ["Write-Back Write-Allocate", "As Write-Back No-Allocate; allocation recommended for writes, not for reads."],
    WBRWA: ["Write-Back Read and Write-Allocate", "As Write-Back No-Allocate; allocation recommended for reads and writes."]
  };
  var AR = { "0000": [["DevNB"]], "0001": [["DevB"]], "0010": [["NNCNB"]], "0011": [["NNCB"]], "1010": [["WTNA"], ["WTWA"]], "1110": [["WTRA"], ["WTRWA"]], "0110": [["WTRA", 1]], "1011": [["WBNA"], ["WBWA"]], "1111": [["WBRA"], ["WBRWA"]], "0111": [["WBRA", 1]] };
  var AW = { "0000": [["DevNB"]], "0001": [["DevB"]], "0010": [["NNCNB"]], "0011": [["NNCB"]], "0110": [["WTNA"], ["WTRA"]], "1110": [["WTWA"], ["WTRWA"]], "1010": [["WTWA", 1]], "0111": [["WBNA"], ["WBRA"]], "1111": [["WBWA"], ["WBRWA"]], "1011": [["WBWA", 1]] };
  var bitsEl = $("mt-bits"), ch = "AR", v = [0, 0, 0, 0];
  function draw() {
    var key = "" + v[3] + v[2] + v[1] + v[0];
    var map = ch === "AR" ? AR : AW, hit = map[key];
    var allocBit = ch === "AR" ? 2 : 3, otherBit = ch === "AR" ? 3 : 2;
    Array.prototype.forEach.call(bitsEl.querySelectorAll("button"), function (b) {
      var i = +b.getAttribute("data-b");
      b.setAttribute("aria-pressed", v[i] ? "true" : "false");
      b.querySelector(".v").textContent = v[i];
      var nm = i === 0 ? "Bufferable" : i === 1 ? "Modifiable" : (i === allocBit ? "Allocate" : "Other Allocate");
      b.querySelector(".n").textContent = nm;
    });
    var h = "<p class=\"mono\" style=\"margin:0\">" + ch + "CACHE = 0b" + key + "</p>";
    if (!hit) h += "<p style=\"color:var(--bad);margin:4px 0 0\"><strong>Reserved.</strong> Not a memory type in Table A4.4.</p>";
    else hit.forEach(function (m) {
      h += "<div class=\"mt-hit\"><strong>" + T[m[0]][0] + "</strong>" + (m[1] ? " <span class=\"pill\">permitted, not preferred</span>" : "") + "<p>" + T[m[0]][1] + "</p></div>";
    });
    if (hit && hit.length > 1) h += "<p class=\"note-s\">On " + ch + " this encoding stands for both types: the hint bit that differs between them is about the other direction, so it has no effect on this request.</p>";
    var look = (v[3] || v[2]);
    h += "<ul class=\"tight\" style=\"font-size:14px\"><li>Cache lookup " + (look ? "required (AxCACHE[3:2] ≠ 0b00)" : "not required (AxCACHE[3:2] = 0b00)") + ".</li>" +
      "<li>" + (v[1] ? "Modifiable: may be split, merged, widened or prefetched." : "Non-modifiable: Size, Length, Burst, address and protection fixed; only Bufferable→Non-bufferable, ID and QoS may change.") + "</li></ul>";
    h += "<p class=\"note-s\">AXI3 reading of the same bits: [0] Bufferable, [1] Cacheable, [2] Read-Allocate, [3] Write-Allocate on both channels (H.c Table A4-1, p.A4-63).</p>";
    $("mt-out").innerHTML = h;
  }
  Array.prototype.forEach.call(bitsEl.querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () { var i = +b.getAttribute("data-b"); v[i] = v[i] ? 0 : 1; draw(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ch]"), function (b) {
    b.addEventListener("click", function () {
      ch = b.getAttribute("data-ch");
      Array.prototype.forEach.call(document.querySelectorAll("[data-ch]"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      draw();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-mt]"), function (b) {
    b.addEventListener("click", function () { var k = b.getAttribute("data-mt"); v = [+k[3], +k[2], +k[1], +k[0]]; draw(); });
  });
  draw();

  /* protection decoder */
  function prot() {
    var mode = $("pr-mode").value, out = "";
    var P = ["Secure", "Non-secure", "Root", "Realm", "System Agent", "Non-secure Protected", "reserved", "reserved"];
    var need = ["-", "-", "RME_Support", "RME_Support", "GDI_Support", "GDI_Support", "-", "-"];
    if (mode === "prot") {
      var p = parseInt($("pr-prot").value, 2), nse = $("pr-nse").checked ? 1 : 0;
      var pas = ((p >> 1) & 1) | (nse << 1);
      out = "<li>" + ((p & 1) ? "Privileged" : "Unprivileged") + " (AxPROT[0])</li><li>" + ((p & 4) ? "Instruction" : "Data") + " access, a hint (AxPROT[2])</li><li>PAS: <strong>" + P[pas] + "</strong> (AxPROT[1] = " + ((p >> 1) & 1) + ", AxNSE = " + nse + ")" + (need[pas] !== "-" ? " · needs " + need[pas] : "") + "</li>";
    } else {
      var pa = parseInt($("pr-pas").value, 10);
      out = "<li>" + ($("pr-priv").checked ? "Privileged" : "Unprivileged") + " (AxPRIV)</li><li>" + ($("pr-inst").checked ? "Instruction" : "Data") + " access (AxINST)</li><li>PAS: <strong>" + P[pa] + "</strong> (AxPAS = 0b" + ("00" + pa.toString(2)).slice(-3) + ")" + (need[pa] !== "-" ? " · needs " + need[pa] : "") + (pa > 5 ? " · reserved value" : "") + "</li>";
    }
    $("pr-out").innerHTML = out;
    $("pr-a").style.display = mode === "prot" ? "" : "none";
    $("pr-b").style.display = mode === "prot" ? "none" : "";
  }
  ["pr-mode", "pr-prot", "pr-nse", "pr-pas", "pr-priv", "pr-inst"].forEach(function (id) { $(id).addEventListener("change", prot); });
  prot();
})();
