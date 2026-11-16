(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  if (!$("w-type")) return;
  function which() {
    var t = $("w-type").value, d = $("w-dom").value, k = $("w-kind").value, out, ok = true, ref;
    if (k === "n") {
      ref = "Table A8.7, p.136 · §A8.3.1, p.134";
      if (t === "dev") { if (d === "SYS") out = "No caches. Device requests must use the System Domain."; else { ok = false; out = "Illegal: Device requests are required to use the System Domain."; } }
      else if (t === "nc") { out = d === "NSH" ? "No caches." : d === "SH" ? "Peer caches. Permitted but not expected; some implementations don't look up peer caches for Non-cacheable accesses." : "No caches (System is the recommended Domain for Normal Non-cacheable)."; }
      else { if (d === "SYS") { ok = false; out = "Illegal: System Domain requests must be Non-cacheable."; } else out = d === "NSH" ? "In-line caches (those the request passes through towards memory)." : "In-line and peer caches (peer caches need a coherent protocol such as CHI to snoop)."; }
    } else {
      ref = "Table A9.1, p.156 · §A9.3, p.156";
      if (d === "SYS" || t === "dev") { ok = false; out = "Illegal for a CMO: System Domain (and so Device) is not permitted. A processor CMO on a Device location is issued as Normal Cacheable Shareable instead (§A9.11, p.172)."; }
      else if (t === "nc") out = d === "NSH" ? "No caches." : "Peer caches.";
      else out = d === "NSH" ? "In-line caches." : "Peer caches and in-line caches.";
    }
    $("w-out").innerHTML = "<span style=\"color:" + (ok ? "var(--pl)" : "var(--bad)") + ";font-weight:600\">" + (ok ? "✓ " : "✗ ") + "</span>" + out + " <span class=\"ref\">" + ref + "</span>";
  }
  var H = {
    rd: { NSH: ["Permitted", "Permitted", "Must not hit", "Permitted¹"], SH: ["Permitted", "Must hit", "Permitted", "Must hit²"] },
    wr: { NSH: ["Must hit", "Must hit", "Must not hit", "Permitted¹"], SH: ["Must hit", "Must hit", "Must hit", "Must hit"] },
    cs: { NSH: ["Permitted", "Must hit", "Permitted", "Permitted³"], SH: ["Permitted", "Must hit", "Permitted", "Must hit"] },
    ci: { NSH: ["Must hit", "Must hit", "Permitted³", "Permitted³"], SH: ["Must hit", "Must hit", "Must hit", "Must hit"] },
    hint: { NSH: ["Permitted", "Permitted", "Permitted", "Permitted"], SH: ["Permitted", "Permitted", "Permitted", "Permitted"] },
    st: { NSH: ["Permitted", "Permitted", "Must not hit", "Permitted"], SH: ["Permitted", "Permitted", "Permitted", "Permitted"] }
  };
  var S = ["Clean", "Dirty", "Shareable Clean", "Shareable Dirty"];
  var F = { "¹": "the line must no longer be marked Shareable", "²": "Dirty data can be provided upstream if the request was ReadShared", "³": "must hit if RME_Support is True" };
  function hit() {
    var row = H[$("h-op").value][$("h-dom").value];
    $("h-out").innerHTML = row.map(function (v, i) {
      var f = v.match(/[¹²³]/), base = v.replace(/[¹²³]/, "");
      var col = base === "Must hit" ? "var(--pl)" : base === "Must not hit" ? "var(--bad)" : "var(--muted)";
      return "<tr><td>" + S[i] + "</td><td style=\"color:" + col + ";font-weight:500\">" + (base === "Permitted" ? "Permitted to hit" : base) + "</td><td style=\"color:var(--muted);font-size:13px\">" + (f ? F[f[0]] : "") + "</td></tr>";
    }).join("");
  }
  ["w-type", "w-dom", "w-kind"].forEach(function (k) { $(k).addEventListener("change", which); });
  ["h-op", "h-dom"].forEach(function (k) { $(k).addEventListener("change", hit); });
  which(); hit();
})();
