(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  if (!$("o-kind")) return;
  function v(id) { return $(id).value; }
  function run() {
    var kind = v("o-kind"), mgr = v("o-mgr"), id = v("o-id"), loc = v("o-loc"), types = v("o-types"), dni = v("o-dni"), done = v("o-done");
    var resp = [], obs = [];
    function say(arr, ok, text, ref) { arr.push("<li class=\"" + (ok === true ? "ok" : ok === false ? "bad" : "info") + "\"><span class=\"ic\">" + (ok === true ? "✓" : ok === false ? "✗" : "•") + "</span> " + text + " <span class=\"ref\">" + ref + "</span></li>"); }
    var sameDir = kind === "RR" || kind === "WW";
    if (done === "yes") {
      say(obs, true, "The first transaction's completion response was received before the second was issued. A read completion, or a Non-bufferable write completion, makes it observable to any later request from any Manager. A Bufferable write completion guarantees observability by Domain: Non-shareable to the issuing Manager only, Shareable within its Domain, System to all.", "§A5.3, p.93 · §A5.3.4, p.95");
      say(resp, true, "Responses are trivially in order: the second was issued after the first completed.", "§A5.3, p.93");
    } else if (mgr === "diff") {
      say(obs, false, "No guarantee between transactions from different Managers while both are outstanding.", "§A5.3, p.93");
      say(resp, null, "Each Manager sees its own responses; there is no cross-Manager response order.", "§A5.3, p.93");
    } else if (!sameDir) {
      say(obs, false, "No guarantee between a read and a write while both are outstanding, even with the same ID and address. Wait for the first response.", "§A5.3, p.93");
      say(resp, false, "Reads and writes complete on different channels with no relative order.", "§A5.3, p.93");
    } else if (id === "diff") {
      say(obs, false, "No guarantee between transactions with different IDs.", "§A5.3, p.93");
      say(resp, false, "Responses may return in any order (and read data may interleave).", "§A5.3, p.93 · §A5.6.1, p.101");
    } else {
      say(resp, true, "Same Manager, same ID, same direction: responses return in issue order, whatever the address or memory type.", "§A5.3.4, p.95 · §A5.3.8, p.97");
      if (loc === "diff") say(obs, false, "Different Memory locations or Peripheral regions: no observation-order guarantee (only the response order above).", "§A5.3, p.93 · §A5.3.1, p.93");
      else if (types === "cacheable-mixed") say(obs, false, "A Cacheable request and a Device or Normal Non-cacheable request have no ordering requirement between them.", "§A5.3.8, p.97");
      else if (types === "dev-nc") {
        if (dni === "false") say(obs, true, "Device and Normal Non-cacheable, same ID and location: observed in issue order because Device_Normal_Independence is False (the default).", "§A5.3.8, Table A5.5, p.97");
        else say(obs, false, "Device_Normal_Independence is True: the Device request may overtake, or be overtaken by, the Normal Non-cacheable one.", "§A5.3.8, Table A5.5, p.97");
      } else if (loc === "periph") {
        if (types === "dev") say(obs, true, "Device to the same Peripheral region with the same ID: the first arrives at the destination before the second.", "§A5.3.4, p.94");
        else say(obs, null, "Normal accesses to a Peripheral region must complete protocol-correctly, but the result is IMPLEMENTATION DEFINED.", "§A5.3.2, p.94");
      } else {
        if (kind === "WW") say(obs, true, "Same Memory location and cacheability: the first write is observed by the second.", "§A5.3.4, p.95");
        else say(obs, true, "Same Memory location and cacheability: a write observed by the first read is also observed by the second read.", "§A5.3.4, p.95");
      }
      if (v("o-owo") === "true" && kind === "WW") say(obs, true, "Ordered_Write_Observation: same-ID writes from this Manager are observed in issue order regardless of address.", "§A5.3.9, p.98");
    }
    $("o-resp").innerHTML = resp.join("");
    $("o-obs").innerHTML = obs.join("");
  }
  ["o-kind", "o-mgr", "o-id", "o-loc", "o-types", "o-dni", "o-done", "o-owo"].forEach(function (k) { $(k).addEventListener("change", run); });
  run();
})();
