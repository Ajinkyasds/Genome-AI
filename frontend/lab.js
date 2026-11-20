/* Genome Intelligence Lab - standalone page logic, reuses script.js apiGet(). */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const API_BASE = window.GENOMEAI_API_BASE || "https://genome-ai-1-o993.onrender.com";

  /* Fallback when script.js has not exposed apiGet (it is inside its own IIFE). */
  async function apiGet(path, params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}${path}${query ? `?${query}` : ""}`);
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || `HTTP ${response.status}`);
    }
    return data;
  }

  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const fmt = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("en-IN") : "-";
  };

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ORGANISMS = [
    { name: "Homo sapiens", label: "Human" },
    { name: "Saccharomyces cerevisiae", label: "Yeast" },
    { name: "Escherichia coli", label: "E. coli" },
    { name: "Arabidopsis thaliana", label: "Arabidopsis" },
    { name: "Drosophila melanogaster", label: "Fruit fly" },
    { name: "Amoeba proteus", label: "Amoeba" }
  ];

  const BASE_COLORS = { A: "#58e5ef", T: "#62e3a8", G: "#70a8ff", C: "#a7e9db" };
  const RING_CIRCUMFERENCE = 2 * Math.PI * 80; /* r=80 in the SVG */

  const toast = (message) => {
    const text = $("toastText");
    const box = $("toast");
    if (!box || !text) return;
    text.textContent = message;
    box.classList.remove("hidden");
    clearTimeout(window.__labToastTimer);
    window.__labToastTimer = setTimeout(() => box.classList.add("hidden"), 2600);
  };

  /* Cache analyses per organism so re-selecting is instant. */
  const analysisCache = new Map();

  async function loadGenome(name) {
    if (analysisCache.has(name)) return analysisCache.get(name);
    const search = await apiGet("/search", { name });
    if (!search.found) throw new Error(`No reference match for "${name}".`);
    const genome = search.genome;
    let result;
    if (!search.reference_file_available) {
      result = { genome, profileOnly: true };
    } else {
      const analyzed = await apiGet("/analyze", { name: genome.scientific_name });
      result = { genome, analysis: analyzed.analysis };
    }
    analysisCache.set(name, result);
    return result;
  }

  /* ---------- single mode rendering ---------- */

  function resetRing() {
    for (const base of ["A", "T", "G", "C"]) {
      const ring = $("ring" + base);
      ring.style.strokeDasharray = `0 ${RING_CIRCUMFERENCE}`;
      ring.style.strokeDashoffset = "0";
    }
  }

  function renderRing(counts, total) {
    const dash = RING_CIRCUMFERENCE;
    let offsetSoFar = 0;
    for (const base of ["A", "T", "G", "C"]) {
      const ring = $("ring" + base);
      const fraction = total ? Number(counts[base] || 0) / total : 0;
      const length = fraction * dash;
      if (prefersReducedMotion) {
        ring.style.transition = "none";
      }
      ring.style.strokeDasharray = `${length} ${dash - length}`;
      ring.style.strokeDashoffset = `${-offsetSoFar}`;
      offsetSoFar += length;
    }
  }

  function renderSingle(data) {
    $("labLoading").classList.add("hidden");

    if (data.profileOnly) {
      $("labContent").classList.add("hidden");
      $("labError").classList.add("hidden");
      const profile = $("labProfile");
      profile.classList.remove("hidden");
      $("profileName").textContent = data.genome.scientific_name;
      $("profileText").textContent =
        (data.genome.summary || "Knowledge profile available.") +
        " No local FASTA reference file is installed for this organism, so no sequence measurements can be shown. Profile only.";
      return;
    }

    const a = data.analysis;
    const g = data.genome;
    const counts = a.base_counts || {};
    const total = ["A", "T", "G", "C"].reduce((sum, b) => sum + Number(counts[b] || 0), 0);

    $("labProfile").classList.add("hidden");
    $("labError").classList.add("hidden");
    $("labContent").classList.remove("hidden");

    $("fingerprintName").textContent = `${g.common_name || g.scientific_name} — ${g.scientific_name}`;

    for (const base of ["A", "T", "G", "C"]) {
      const count = Number(counts[base] || 0);
      const pct = total ? ((count / total) * 100).toFixed(2) : "0.00";
      $("pct" + base).textContent = `${pct}%`;
      $("labBar" + base).style.width = `${total ? (count / total) * 100 : 0}%`;
      $("labCount" + base).textContent = fmt(count);
    }

    let dominant = "-";
    let dominantCount = -1;
    for (const base of ["A", "T", "G", "C"]) {
      const count = Number(counts[base] || 0);
      if (count > dominantCount) {
        dominantCount = count;
        dominant = base;
      }
    }
    $("fingerprintCommon").textContent = total ? `most common: ${dominant}` : "-";

    $("fingerprintGC").textContent = `${a.gc_percentage}%`;
    $("labLength").textContent = fmt(a.genome_length);
    $("labGC").textContent = `${a.gc_percentage}%`;
    $("labSeqs").textContent = fmt(a.sequence_count);
    $("labRatio").textContent = a.gc_at_ratio ?? "-";
    $("labAssembly").textContent = g.reference_assembly || "-";
    $("labSource").textContent = g.source || "-";

    resetRing();
    /* let the reset stick before animating in */
    requestAnimationFrame(() => renderRing(counts, total));

    toast(`${g.common_name || g.scientific_name} loaded.`);
  }

  async function selectOrganism(button) {
    const name = button.dataset.organism;
    document.querySelectorAll(".lab-org-btn").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");

    $("labContent").classList.add("hidden");
    $("labProfile").classList.add("hidden");
    $("labError").classList.add("hidden");
    $("labLoading").classList.remove("hidden");
    resetRing();

    try {
      const data = await loadGenome(name);
      renderSingle(data);
    } catch (error) {
      console.error(error);
      $("labLoading").classList.add("hidden");
      $("labContent").classList.add("hidden");
      $("labProfile").classList.add("hidden");
      $("labErrorText").textContent =
        error.message || "The analysis engine could not be reached. Please try again.";
      $("labError").classList.remove("hidden");
    }
  }

  /* ---------- compare mode ---------- */

  function fillCompareSelect(select) {
    select.innerHTML =
      '<option value="">Select organism...</option>' +
      ORGANISMS.map(
        (o) => `<option value="${esc(o.name)}">${esc(o.label)} — ${esc(o.name)}</option>`
      ).join("");
  }

  function miniBars(container, analysis) {
    const counts = analysis.base_counts || {};
    const total = ["A", "T", "G", "C"].reduce((sum, b) => sum + Number(counts[b] || 0), 0);
    const rows = ["A", "T", "G", "C"].map((base) => {
      const count = Number(counts[base] || 0);
      const pct = total ? ((count / total) * 100).toFixed(2) : "0.00";
      return `
        <div class="mini-bar-row">
          <span class="mini-letter" style="background:${BASE_COLORS[base]}">${base}</span>
          <div class="mini-track"><i data-w="${total ? (count / total) * 100 : 0}" style="background:${BASE_COLORS[base]}"></i></div>
          <b>${pct}%</b>
        </div>`;
    }).join("");
    container.innerHTML = `<div class="mini-bars">${rows}</div>`;
    requestAnimationFrame(() => {
      container.querySelectorAll(".mini-track i").forEach((bar) => {
        bar.style.width = `${bar.dataset.w}%`;
      });
    });
  }

  function sideStats(analysis) {
    const counts = analysis.base_counts || {};
    const rows = [
      ["Total base pairs", fmt(analysis.genome_length)],
      ["GC content", `${analysis.gc_percentage}%`],
      ["Sequences", fmt(analysis.sequence_count)],
      ["GC:AT ratio", analysis.gc_at_ratio ?? "-"]
    ];
    return rows
      .map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
      .join("") + `<div><span>Canonical A/T/G/C</span><b>${fmt(
        Number(counts.A || 0) + Number(counts.T || 0) + Number(counts.G || 0) + Number(counts.C || 0)
      )}</b></div>`;
  }

  function renderCompare(aData, bData) {
    $("compareLoading").classList.add("hidden");
    $("compareError").classList.add("hidden");
    $("compareResult").classList.remove("hidden");

    $("cmpAName").textContent = aData.genome.scientific_name;
    $("cmpBName").textContent = bData.genome.scientific_name;
    $("cmpHeadA").textContent = aData.genome.scientific_name;
    $("cmpHeadB").textContent = bData.genome.scientific_name;

    miniBars($("cmpAChart"), aData.analysis);
    miniBars($("cmpBChart"), bData.analysis);
    $("cmpAStats").innerHTML = sideStats(aData.analysis);
    $("cmpBStats").innerHTML = sideStats(bData.analysis);

    const a = aData.analysis;
    const b = bData.analysis;
    const rows = [
      ["Total base pairs", fmt(a.genome_length), fmt(b.genome_length)],
      ["GC content", `${a.gc_percentage}%`, `${b.gc_percentage}%`],
      ["Sequence records", fmt(a.sequence_count), fmt(b.sequence_count)],
      [
        "Longest record",
        fmt(a.structure?.maximum_record_length ?? 0),
        fmt(b.structure?.maximum_record_length ?? 0)
      ],
      [
        "Average record length",
        fmt(a.structure?.average_record_length ?? 0),
        fmt(b.structure?.average_record_length ?? 0)
      ],
      ["GC:AT ratio", a.gc_at_ratio ?? "-", b.gc_at_ratio ?? "-"]
    ];
    $("compareTableBody").innerHTML = rows
      .map(([metric, va, vb]) => `<tr><td>${esc(metric)}</td><td>${esc(va)}</td><td>${esc(vb)}</td></tr>`)
      .join("");

    $("compareSummary").textContent = buildSummary(aData, bData);
  }

  function buildSummary(aData, bData) {
    const a = aData.analysis;
    const b = bData.analysis;
    const aName = aData.genome.common_name || aData.genome.scientific_name;
    const bName = bData.genome.common_name || bData.genome.scientific_name;
    const sentences = [];

    const ratio = a.genome_length && b.genome_length
      ? Math.max(a.genome_length, b.genome_length) / Math.min(a.genome_length, b.genome_length)
      : null;
    if (ratio) {
      const bigger = a.genome_length > b.genome_length ? aName : bName;
      const smaller = a.genome_length > b.genome_length ? bName : aName;
      sentences.push(
        `The ${esc(bigger)} reference is about ${ratio >= 10 ? Math.round(ratio) + "x" : ratio.toFixed(1) + "x"} larger than the ${esc(smaller)} reference.`
      );
    }

    const gcDiff = Math.abs(Number(a.gc_percentage) - Number(b.gc_percentage));
    if (Number.isFinite(gcDiff) && gcDiff > 0) {
      const higher = Number(a.gc_percentage) > Number(b.gc_percentage) ? aName : bName;
      sentences.push(
        `${esc(higher)} has the higher measured GC content, by ${gcDiff.toFixed(2)} percentage points.`
      );
    } else if (gcDiff === 0) {
      sentences.push("Both references have the same measured GC content.");
    }

    sentences.push(
      `${esc(aName)} has ${fmt(a.sequence_count)} sequence record(s) versus ${fmt(b.sequence_count)} for ${esc(bName)}.`
    );

    return sentences.join(" ");
  }

  async function runCompare() {
    const nameA = $("compareA").value;
    const nameB = $("compareB").value;
    $("compareResult").classList.add("hidden");
    $("compareError").classList.add("hidden");

    if (!nameA || !nameB) {
      return;
    }
    if (nameA === nameB) {
      $("compareErrorText").textContent = "Choose two different organisms to compare.";
      $("compareError").classList.remove("hidden");
      return;
    }

    $("compareLoading").classList.remove("hidden");

    try {
      const [aData, bData] = await Promise.all([loadGenome(nameA), loadGenome(nameB)]);
      if (aData.profileOnly || bData.profileOnly) {
        const missing = aData.profileOnly
          ? aData.genome.common_name
          : bData.genome.common_name;
        $("compareLoading").classList.add("hidden");
        $("compareErrorText").textContent =
          `${missing} is a profile-only organism with no local reference sequence, so no measurements can be compared.`;
        $("compareError").classList.remove("hidden");
        return;
      }
      renderCompare(aData, bData);
    } catch (error) {
      console.error(error);
      $("compareLoading").classList.add("hidden");
      $("compareErrorText").textContent =
        error.message || "The analysis engine could not be reached. Please try again.";
      $("compareError").classList.remove("hidden");
    }
  }

  /* ---------- mode switch ---------- */

  function setMode(compare) {
    $("modeSingle").classList.toggle("active", !compare);
    $("modeCompare").classList.toggle("active", compare);
    $("modeSingle").setAttribute("aria-selected", String(!compare));
    $("modeCompare").setAttribute("aria-selected", String(compare));
    $("singleView").classList.toggle("hidden", compare);
    $("compareView").classList.toggle("hidden", compare);
  }

  /* ---------- init ---------- */

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".lab-org-btn").forEach((button) => {
      button.addEventListener("click", () => selectOrganism(button));
    });

    $("modeSingle").addEventListener("click", () => setMode(false));
    $("modeCompare").addEventListener("click", () => setMode(true));

    fillCompareSelect($("compareA"));
    fillCompareSelect($("compareB"));
    $("compareA").addEventListener("change", runCompare);
    $("compareB").addEventListener("change", runCompare);
  });
})();
