  function seq(parts) { var a = []; parts.forEach(function (p) { for (var i = 0; i < p[1]; i++) a.push(p[0]); }); return a; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function renderWave(scn, hl, compact) {
    var N = scn.n, gaps = scn.gaps || [], rows = scn.sig;
    CW = scn.cw || P.CW || 34;
    var lw = compact ? 150 : LW;
    var W = lw + N * CW + 10, H = TOP + rows.length * RH + 6;
    function isGap(i) { return gaps.indexOf(i) >= 0; }
    var s = "<svg viewBox=\"0 0 " + W + " " + H + "\" width=\"" + W + "\" height=\"" + H + "\" role=\"img\" aria-label=\"" + esc(scn.aria || scn.title || "waveform") + "\">";
    if (hl) s += "<rect class=\"hlr\" x=\"" + (lw + hl[0] * CW) + "\" y=\"0\" width=\"" + ((hl[1] - hl[0] + 1) * CW) + "\" height=\"" + H + "\"/>";
    for (var i = 0; i <= N; i++) {
      var x = lw + i * CW;
      s += "<line class=\"grid-l\" x1=\"" + x + "\" y1=\"" + (TOP - 4) + "\" x2=\"" + x + "\" y2=\"" + (H - 4) + "\" opacity=\"0.6\"/>";
      if (i < N && !isGap(i)) s += "<text class=\"cyc\" x=\"" + (x + CW / 2) + "\" y=\"12\" text-anchor=\"middle\">" + i + "</text>";
    }
    rows.forEach(function (r, ri) {
      var y0 = TOP + ri * RH, hi = y0 + 6, lo = y0 + RH - 7, mid = (hi + lo) / 2;
      s += "<text class=\"wl " + r.d + "\" x=\"8\" y=\"" + (mid + 4) + "\">" + esc(r.name) + "</text>";
      if (r.t === "bit") {
        var d = "", prev = null;
        for (var k = 0; k < N; k++) {
          if (isGap(k)) { prev = null; continue; }
          var v = r.v.charAt(k), yy = v === "1" ? hi : lo, x0 = lw + k * CW, x1 = x0 + CW;
          if (prev === null) d += "M" + x0 + "," + yy; else if (prev !== yy) d += "L" + x0 + "," + yy;
          d += "L" + x1 + "," + yy; prev = yy;
        }
        s += "<path class=\"wv " + r.d + "\" d=\"" + d + "\"/>";
      } else {
        var vals = r.v, k2 = 0;
        while (k2 < N) {
          if (isGap(k2)) { k2++; continue; }
          var lab = vals[k2], j = k2;
          while (j + 1 < N && !isGap(j + 1) && vals[j + 1] === lab) j++;
          var xa = lw + k2 * CW, xb = lw + (j + 1) * CW, w = xb - xa;
          if (r.t === "bus") {
            if (lab === "") {
              s += "<line class=\"idle\" x1=\"" + xa + "\" y1=\"" + mid + "\" x2=\"" + xb + "\" y2=\"" + mid + "\"/>";
            } else {
              s += "<path class=\"bus " + r.d + "\" d=\"M" + xa + "," + mid + " L" + (xa + 4) + "," + hi + " L" + (xb - 4) + "," + hi + " L" + xb + "," + mid + " L" + (xb - 4) + "," + lo + " L" + (xa + 4) + "," + lo + " Z\"/>";
              var t = lab, maxc = Math.floor((w - 8) / 6.4);
              if (t.length > maxc) t = maxc > 2 ? t.slice(0, maxc - 1) + "…" : "";
              s += "<text class=\"bt\" x=\"" + (xa + w / 2) + "\" y=\"" + (mid + 4) + "\" text-anchor=\"middle\"><title>" + esc(lab) + "</title>" + esc(t) + "</text>";
            }
          } else if (lab !== "") {
            s += "<rect class=\"notebox\" x=\"" + (xa + 2) + "\" y=\"" + (hi - 1) + "\" width=\"" + (w - 4) + "\" height=\"" + (lo - hi + 2) + "\" rx=\"5\"" + (r.d === "sb" ? " style=\"stroke:var(--sb)\"" : "") + "/>";
            var t2 = lab, maxc2 = Math.floor((w - 10) / 5.8);
            if (t2.length > maxc2) t2 = t2.slice(0, Math.max(0, maxc2 - 1)) + "…";
            s += "<text class=\"nt\" x=\"" + (xa + w / 2) + "\" y=\"" + (mid + 4) + "\" text-anchor=\"middle\"" + (r.d === "sb" ? " style=\"fill:var(--sb);font-style:normal;font-family:var(--font-mono);font-size:10.5px\"" : "") + "><title>" + esc(lab) + "</title>" + esc(t2) + "</text>";
          }
          k2 = j + 1;
        }
      }
    });
    gaps.forEach(function (g) {
      var x = lw + g * CW;
      s += "<rect class=\"gapbg\" x=\"" + (x + 1) + "\" y=\"" + (TOP - 4) + "\" width=\"" + (CW - 2) + "\" height=\"" + (H - TOP) + "\"/>";
      var z1 = "", z2 = "";
      for (var yy = TOP - 4, n = 0; yy < H - 4; yy += 6, n++) {
        z1 += (n === 0 ? "M" : "L") + (x + 11 + (n % 2 ? 4 : 0)) + "," + yy;
        z2 += (n === 0 ? "M" : "L") + (x + 19 + (n % 2 ? 4 : 0)) + "," + yy;
      }
      s += "<path class=\"gapz\" d=\"" + z1 + "\"/><path class=\"gapz\" d=\"" + z2 + "\"/>";
      s += "<text class=\"cyc\" x=\"" + (x + CW / 2) + "\" y=\"12\" text-anchor=\"middle\">≈</text>";
    });
    return s + "</svg>";
  }
