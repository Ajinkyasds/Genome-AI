/* GenomeAI — one shared interaction layer for every page. */
(() => {
  "use strict";

  const API_BASE = window.GENOMEAI_API_BASE || "https://genome-ai-1-o993.onrender.com";
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const state = {
    genome: null,
    analysis: null,
    aiModule: "summary",
    lastAIText: ""
  };

  const learning = {
    genome: [
      "LEARNING / GENOME",
      "What is a genome?",
      `<p>A <strong>genome</strong> is the complete set of genetic material represented for an organism or biological system. DNA sequence can be stored digitally as A, T, G and C.</p><p>GenomeAI turns that sequence into measurable evidence such as length, base composition, GC content and sequence records.</p>`
    ],
    sequencing: [
      "LEARNING / SEQUENCING",
      "What is sequencing?",
      `<p><strong>DNA sequencing</strong> determines the order of nucleotide bases. Sequencing instruments convert biological molecules into machine-readable information.</p><p>This exhibition uses open/reference data for the demonstration rather than claiming the school performed laboratory whole-genome sequencing.</p>`
    ],
    bioinformatics: [
      "LEARNING / BIOINFORMATICS",
      "What is bioinformatics?",
      `<p><strong>Bioinformatics</strong> combines biology and computation to store, analyze and interpret biological data.</p><p>In GenomeAI, Python and BioPython calculate the measurements first. The interpretation layer then communicates those results.</p>`
    ],
    ai: [
      "LEARNING / AI",
      "Where does AI fit?",
      `<p>GENEVA is placed after the computational engine. It receives structured measurements instead of being responsible for the underlying arithmetic.</p><p>That separation keeps the evidence visible and makes the demonstration easier to explain.</p>`
    ]
  };

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function fmt(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";
  }

  function toast(message) {
    const box = $("toast");
    const text = $("toastText");
    if (!box || !text) {
      window.alert(message);
      return;
    }
    text.textContent = message;
    box.classList.remove("hidden");
    clearTimeout(window.__genomeaiToastTimer);
    window.__genomeaiToastTimer = setTimeout(() => box.classList.add("hidden"), 2600);
  }

  function scrollToSection(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function go(page, params = {}) {
    const query = new URLSearchParams(params);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    window.location.href = `${page}${suffix}`;
  }

  function showModal(kicker, title, body) {
    const modal = $("modal");
    const modalKicker = $("modalKicker");
    const modalTitle = $("modalTitle");
    const modalBody = $("modalBody");
    if (!modal || !modalKicker || !modalTitle || !modalBody) {
      window.alert(title);
      return;
    }
    modalKicker.textContent = kicker;
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modal.classList.remove("hidden");
  }

  function hideModal() {
    $("modal")?.classList.add("hidden");
  }

  function setStatus(message) {
    const q = $("queryState");
    if (q) q.textContent = message;
  }

  function getCurrentOrganismFromURL() {
    const params = new URLSearchParams(location.search);
    return params.get("organism") || params.get("q") || "";
  }

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

  async function analyzeOrganism(name) {
    const canonical = String(name || "").trim();
    if (!canonical) throw new Error("Enter an organism first.");
    const search = await apiGet("/search", { name: canonical });
    if (!search.found) {
      return { found: false, query: canonical };
    }
    const genome = search.genome;
    state.genome = genome;
    sessionStorage.setItem("genomeai_last_genome", genome.scientific_name);

    if (!search.reference_file_available) {
      return { found: true, genome, profileOnly: true };
    }

    const analyzed = await apiGet("/analyze", { name: genome.scientific_name });
    state.analysis = analyzed.analysis;
    sessionStorage.setItem("genomeai_last_analysis", JSON.stringify({ genome, analysis: analyzed.analysis }));
    return { found: true, genome, analysis: analyzed.analysis };
  }

  function renderSearchResult() {
    const result = $("searchResult");
    if (!result || !state.genome) return;
    result.classList.remove("hidden");
    if (!state.analysis) {
      result.innerHTML = `<strong>Profile loaded:</strong> ${esc(state.genome.scientific_name)} · ${esc(state.genome.common_name)} · taxonomy/knowledge profile available · sequence file not installed locally.`;
      return;
    }
    result.innerHTML = `<strong>Genome loaded:</strong> ${esc(state.genome.scientific_name)} · ${esc(state.genome.common_name)} · ${fmt(state.analysis.genome_length)} bp · ${esc(state.genome.source)}`;
  }

  function renderAnalysis() {
    const g = state.genome;
    const a = state.analysis;
    if (!g || !a) return;

    $("selectedGenomeName") && ($("selectedGenomeName").textContent = g.scientific_name);
    $("statLength") && ($("statLength").textContent = fmt(a.genome_length));
    $("statGC") && ($("statGC").textContent = `${a.gc_percentage}%`);
    $("statSequences") && ($("statSequences").textContent = fmt(a.sequence_count));
    $("statSource") && ($("statSource").textContent = g.source || "Reference");
    $("statAssembly") && ($("statAssembly").textContent = g.reference_assembly || "Reference assembly");
    if ($("gcMeter")) $("gcMeter").style.width = `${Math.min(100, Math.max(0, Number(a.gc_percentage || 0)))}%`;

    const counts = a.base_counts || {};
    const total = ["A", "T", "G", "C"].reduce((sum, base) => sum + Number(counts[base] || 0), 0);
    $("compositionTotal") && ($("compositionTotal").textContent = `${fmt(total)} bases`);

    for (const base of ["A", "T", "G", "C"]) {
      const count = Number(counts[base] || 0);
      $("base" + base) && ($("base" + base).textContent = fmt(count));
      $("bar" + base) && ($("bar" + base).style.width = `${total ? (count / total) * 100 : 0}%`);
    }

    const records = a.sequence_details || [];
    if ($("recordCount")) $("recordCount").textContent = String(records.length);
    if ($("recordList")) {
      $("recordList").innerHTML = records.length
        ? records.map(record => `
            <div class="record">
              <div>
                <strong title="${esc(record.id)}">${esc(record.id)}</strong>
                <small title="${esc(record.description || "")}">${esc(record.description || "Reference sequence")}</small>
              </div>
              <em>${fmt(record.length)} bp</em>
            </div>
          `).join("")
        : "<div class='list-placeholder'>No sequence records.</div>";
    }

    $("analysisEmpty")?.classList.add("hidden");
    $("analysisContent")?.classList.remove("hidden");
    $("engineStatus") && ($("engineStatus").textContent = "ANALYZED");
    $("quickInsightTitle") && ($("quickInsightTitle").textContent = `${g.common_name || g.scientific_name}: ${fmt(a.genome_length)} bp`);
    $("quickInsightText") && ($("quickInsightText").textContent = `Measured GC content is ${a.gc_percentage}% across ${a.sequence_count} reference records.`);

    if ($("taxonomyList") && Array.isArray(g.taxonomy)) {
      $("taxonomyList").innerHTML = g.taxonomy.map(([rank, value]) => `<div><small>${esc(rank)}</small><strong>${esc(value)}</strong></div>`).join("");
    }
    if ($("profileName")) $("profileName").textContent = g.scientific_name;
  }

  async function searchGenome(name, options = {}) {
    const query = String(name || "").trim();
    const jumpToAnalysis = options.jumpToAnalysis ?? true;
    if (!query) {
      toast("Enter an organism first.");
      return;
    }

    const button = $("searchButton");
    if (button) {
      button.disabled = true;
      button.textContent = "LOADING…";
    }
    setStatus("SEARCHING REFERENCE INDEX");

    try {
      const result = await analyzeOrganism(query);
      if (!result.found) {
        setStatus("NO MATCH FOUND");
        const sr = $("searchResult");
        if (sr) {
          sr.classList.remove("hidden");
          sr.innerHTML = `<strong>No reference match.</strong> The current library does not contain <strong>${esc(query)}</strong>.`;
        } else {
          showModal("REFERENCE LIBRARY", "No match found", `<p>No organism named <strong>${esc(query)}</strong> is currently configured in the exhibition library.</p>`);
        }
        return;
      }

      renderSearchResult();

      if (result.profileOnly) {
        setStatus("PROFILE READY · NO LOCAL FASTA");
        toast(`${result.genome.common_name} profile loaded.`);
        if (location.pathname.endsWith("organisms.html")) {
          showModal("ORGANISM PROFILE", result.genome.scientific_name, `<p><strong>${esc(result.genome.common_name)}</strong> · ${esc(result.genome.group)}</p><p>${esc(result.genome.summary || "Knowledge profile available.")}</p><p>The exact analysis dashboard requires a local FASTA/FNA reference file. The taxonomy/profile view is still available for this organism.</p>`);
        }
        return;
      }

      renderAnalysis();
      setStatus("ANALYSIS COMPLETE");
      toast(`${result.genome.common_name} loaded.`);

      if (jumpToAnalysis) {
        if (document.querySelector("#analysis")) {
          scrollToSection("#analysis");
        } else {
          go("analysis.html", { organism: result.genome.scientific_name });
        }
      }
    } catch (error) {
      console.error(error);
      setStatus("BACKEND CHECK");
      const sr = $("searchResult");
      if (sr) {
        sr.classList.remove("hidden");
        sr.innerHTML = `<strong>GenomeAI could not reach the backend.</strong> ${esc(error.message)}<br><small>Start FastAPI with <code>python -m uvicorn backend.main:app --reload</code>.</small>`;
      }
      toast("Backend connection failed.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "ANALYZE →";
      }
    }
  }

  const aiLabels = {
    summary: "Genome Summary",
    composition: "Base Composition",
    biology: "Biological Context",
    questions: "Research Questions"
  };

  async function runAI(module = "summary") {
    state.aiModule = module;

    if (!state.genome || !state.analysis) {
      const remembered = sessionStorage.getItem("genomeai_last_genome") || "Saccharomyces cerevisiae";
      if (location.pathname.endsWith("ai-lab.html")) {
        try {
          const result = await analyzeOrganism(remembered);
          if (!result.analysis) {
            showModal("GENEVA", "No sequence analysis available", "<p>This organism has a profile but no local reference file for exact measurements.</p>");
            return;
          }
          state.genome = result.genome;
          state.analysis = result.analysis;
        } catch (error) {
          toast(error.message);
          return;
        }
      } else {
        go("ai-lab.html", { organism: remembered, module });
        return;
      }
    }

    const button = $("aiMainButton");
    if (button) {
      button.disabled = true;
      button.textContent = "GENEVA IS THINKING…";
    }
    $("aiMode") && ($("aiMode").textContent = "MODE: REQUESTING");
    $("aiConsoleTitle") && ($("aiConsoleTitle").textContent = "GENEVA is interpreting");
    $("aiConsoleSubtitle") && ($("aiConsoleSubtitle").textContent = "Exact measurements are already calculated.");
    $("aiConsoleOutput") && ($("aiConsoleOutput").textContent = "Connecting to the interpretation layer…\n\n");

    try {
      const data = await apiGet("/ai-insight", {
        name: state.genome.scientific_name,
        module: aiLabels[module] || aiLabels.summary
      });
      if (!data.success) throw new Error(data.message || "No insight returned.");
      $("aiConsoleOutput") && ($("aiConsoleOutput").textContent = data.insight || "No insight returned.");
      $("aiMode") && ($("aiMode").textContent = `MODE: ${(data.mode || "LIVE").toUpperCase()}`);
      state.lastAIText = data.insight || "";
      sessionStorage.setItem("genomeai_last_ai", state.lastAIText);
      toast(data.mode === "gemini" ? "Live Gemini insight received." : "GENEVA offline insight generated.");
    } catch (error) {
      console.error(error);
      $("aiConsoleOutput") && ($("aiConsoleOutput").textContent = `GENEVA could not complete the request.\n\n${error.message}`);
      $("aiMode") && ($("aiMode").textContent = "MODE: ERROR");
      toast("AI service unavailable.");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "GENERATE INSIGHT ✦";
      }
    }
  }

  function exportReport() {
    if (!state.genome || !state.analysis) {
      toast("Analyze a genome first.");
      return;
    }
    const payload = {
      application: "GenomeAI",
      exported_at: new Date().toISOString(),
      genome: state.genome,
      analysis: state.analysis,
      ai: state.lastAIText || null
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.genome.scientific_name.replaceAll(" ", "_")}_GenomeAI_Report.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("JSON report exported.");
  }

  function resetAnalysis() {
    state.genome = null;
    state.analysis = null;
    state.lastAIText = "";
    sessionStorage.removeItem("genomeai_last_genome");
    sessionStorage.removeItem("genomeai_last_analysis");
    sessionStorage.removeItem("genomeai_last_ai");
    $("selectedGenomeName") && ($("selectedGenomeName").textContent = "None loaded");
    $("analysisEmpty")?.classList.remove("hidden");
    $("analysisContent")?.classList.add("hidden");
    $("engineStatus") && ($("engineStatus").textContent = "READY");
    $("recordList") && ($("recordList").innerHTML = "");
    $("recordCount") && ($("recordCount").textContent = "0");
    $("aiConsoleOutput") && ($("aiConsoleOutput").textContent = "No interpretation generated yet.");
    $("aiMode") && ($("aiMode").textContent = "MODE: READY");
    $("searchResult")?.classList.add("hidden");
    toast("Workspace reset.");
  }

  function initHeader() {
   const menuButton = $("menuButton");
const mobileDrawer = $("mobileDrawer");

menuButton?.addEventListener("click", () => {
  if (!mobileDrawer) return;

  const isOpen = mobileDrawer.style.display === "flex";

  mobileDrawer.style.display = isOpen ? "none" : "flex";
});

$$("#mobileDrawer a").forEach(link => {
  link.addEventListener("click", () => {
    if (mobileDrawer) mobileDrawer.style.display = "none";
  });
});
    $("commandButton")?.addEventListener("click", () => {
      $("commandPalette")?.classList.remove("hidden");
      $("paletteInput")?.focus();
    });
    $("paletteClose")?.addEventListener("click", () => $("commandPalette")?.classList.add("hidden"));
    $(".palette-backdrop")?.addEventListener("click", () => $("commandPalette")?.classList.add("hidden"));

    window.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("commandButton")?.click();
      }
      if (event.key === "Escape") {
        $("commandPalette")?.classList.add("hidden");
        hideModal();
      }
    });

    $$("[data-command]").forEach(button => {
      button.addEventListener("click", () => {
        $("commandPalette")?.classList.add("hidden");
        const target = button.dataset.command;
        const page = target === "#explorer" ? "organisms.html" : target === "#analysis" ? "analysis.html" : "ai-lab.html";
        go(page);
      });
    });
  }

  function initHome() {
    $("heroDemoButton")?.addEventListener("click", () => go("organisms.html", { q: "Saccharomyces cerevisiae" }));

    $("organismButton")?.addEventListener("click", () => {
      const query = $("organismQuery")?.value.trim() || "Saccharomyces cerevisiae";
      go("organisms.html", { q: query });
    });
    $("organismQuery")?.addEventListener("keydown", event => {
      if (event.key === "Enter") $("organismButton")?.click();
    });

    $("humanButton")?.addEventListener("click", () => {
      showModal(
        "HUMAN GENOMICS",
        "Reference & learning mode",
        `<p>Human Genomics is an educational reference interface. It is designed to teach genome organization, reference assemblies and controlled sequence examples, not to interpret personal medical data.</p><p>Continue with the learning center or organism analysis for the computational exhibition demonstration.</p>`
      );
    });
  }

  function initOrganisms() {
    const search = $("searchButton");
    search?.addEventListener("click", () => searchGenome($("organismSearch")?.value.trim()));
    $("organismSearch")?.addEventListener("keydown", event => {
      if (event.key === "Enter") searchGenome($("organismSearch").value.trim());
    });
    $("clearSearch")?.addEventListener("click", () => {
      $("organismSearch").value = "";
      $("clearSearch").classList.add("hidden");
      $("organismSearch").focus();
    });

    $$(".quick-orgs button[data-organism]").forEach(button => {
      button.addEventListener("click", () => {
        const name = button.dataset.organism;
        if ($("organismSearch")) $("organismSearch").value = name;
        $("clearSearch")?.classList.remove("hidden");
        searchGenome(name);
      });
    });

    $$(".organism .org-action").forEach(button => {
      button.addEventListener("click", () => {
        const card = button.closest(".organism");
        const name = card?.dataset.organism || "";
        if (name.toLowerCase() === "amoeba proteus") {
          const profile = { taxonomy: [] };
          showModal("KNOWLEDGE PROFILE", "Amoeba proteus", `<p>A free-living amoebozoan example used to teach cell shape, movement and feeding.</p><p>Open the profile through the knowledge/exploration interface.</p>`);
          return profile;
        }
        go("analysis.html", { organism: name });
      });
    });

    const q = new URLSearchParams(location.search).get("q");
    if (q) {
      const input = $("organismSearch");
      if (input) input.value = q;
      setTimeout(() => searchGenome(q, { jumpToAnalysis: false }), 80);
    }
  }

  function initAnalysis() {
    $$(".module[data-module]").forEach(button => {
      button.addEventListener("click", () => {
        $$(".module[data-module]").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        const module = button.dataset.module;
        const titles = {
          overview: "Genome overview",
          composition: "Base composition",
          structure: "Genome structure",
          validation: "Sequence validation",
          comparison: "Reference compare"
        };
        $("analysisModuleTitle") && ($("analysisModuleTitle").textContent = titles[module] || "Genome overview");

        if (!state.analysis) return;
        if (module === "validation") {
          const ambiguous = (state.analysis.sequence_details || []).filter(record => record.contains_ambiguous_bases).length;
          $("quickInsightTitle") && ($("quickInsightTitle").textContent = ambiguous ? `${ambiguous} records contain ambiguous bases` : "Sequence validation passed");
          $("quickInsightText") && ($("quickInsightText").textContent = ambiguous ? "Some records contain characters outside A/T/G/C." : "Every returned record uses explicit A/T/G/C bases.");
        }
        if (module === "composition") {
          const b = state.analysis.base_counts || {};
          $("quickInsightTitle") && ($("quickInsightTitle").textContent = `GC content: ${state.analysis.gc_percentage}%`);
          $("quickInsightText") && ($("quickInsightText").textContent = `G and C together account for ${fmt(Number(b.G || 0) + Number(b.C || 0))} bases in the analyzed reference.`);
        }
        if (module === "structure") {
          $("quickInsightTitle") && ($("quickInsightTitle").textContent = `${state.analysis.sequence_count} sequence records`);
          $("quickInsightText") && ($("quickInsightText").textContent = "The records are shown individually in the sequence panel.");
        }
        if (module === "comparison") {
          $("quickInsightTitle") && ($("quickInsightTitle").textContent = "Controlled comparison module");
          $("quickInsightText") && ($("quickInsightText").textContent = "A deliberate teaching comparison is available in the Project/learning content.");
        }
      });
    });

    $$(".module[data-ai-module]").forEach(button => {
      button.addEventListener("click", () => {
        const module = button.dataset.aiModule || "summary";
        go("ai-lab.html", {
          organism: state.genome?.scientific_name || sessionStorage.getItem("genomeai_last_genome") || "Saccharomyces cerevisiae",
          module
        });
      });
    });

    $("runAnalysisButton")?.addEventListener("click", () => {
      if (state.genome) searchGenome(state.genome.scientific_name, { jumpToAnalysis: false });
      else searchGenome("Saccharomyces cerevisiae", { jumpToAnalysis: false });
    });
    $("emptyRunButton")?.addEventListener("click", () => {
      go("analysis.html", { organism: "Saccharomyces cerevisiae" });
    });
    $("exportButton")?.addEventListener("click", exportReport);
    $("resetButton")?.addEventListener("click", resetAnalysis);
    $("quickAIButton")?.addEventListener("click", () => go("ai-lab.html", { organism: state.genome?.scientific_name || "Saccharomyces cerevisiae" }));

    const query = getCurrentOrganismFromURL();
    const cached = sessionStorage.getItem("genomeai_last_analysis");
    if (query) {
      setTimeout(() => searchGenome(query, { jumpToAnalysis: false }), 100);
    } else if (cached) {
      try {
        const parsed = JSON.parse(cached);
        state.genome = parsed.genome;
        state.analysis = parsed.analysis;
        renderAnalysis();
      } catch {
        // Ignore stale storage.
      }
    }
  }

  function initAI() {
    $$(".ai-module button[data-ai]").forEach(button => {
      button.addEventListener("click", () => {
        const module = button.dataset.ai || "summary";
        go("ai-lab.html", {
          organism: state.genome?.scientific_name || sessionStorage.getItem("genomeai_last_genome") || "Saccharomyces cerevisiae",
          module
        });
      });
    });
    $("aiMainButton")?.addEventListener("click", () => runAI(state.aiModule));

    if (location.pathname.endsWith("ai-lab.html")) {
      const params = new URLSearchParams(location.search);
      state.aiModule = params.get("module") || "summary";
      const organism = params.get("organism") || sessionStorage.getItem("genomeai_last_genome") || "Saccharomyces cerevisiae";
      setTimeout(async () => {
        try {
          const result = await analyzeOrganism(organism);
          if (result.analysis) {
            state.genome = result.genome;
            state.analysis = result.analysis;
            await runAI(state.aiModule);
          }
        } catch (error) {
          console.error(error);
          $("aiConsoleOutput") && ($("aiConsoleOutput").textContent = `Could not load the selected genome.\n\n${error.message}`);
        }
      }, 100);
    }
  }

  function initAbout() {
    const save = $("saveProfile");
    if (!save) return;

    try {
      const saved = sessionStorage.getItem("genomeai_profile");
      if (saved) {
        const profile = JSON.parse(saved);
        $("profilePreview")?.classList.remove("hidden");
        $("profilePreviewName") && ($("profilePreviewName").textContent = profile.name || "");
        $("profilePreviewMobile") && ($("profilePreviewMobile").textContent = `Demo profile · mobile ending ${(profile.mobile || "").slice(-4)}`);
      }
    } catch {
      sessionStorage.removeItem("genomeai_profile");
    }

    save.addEventListener("click", () => {
      const name = $("profileName")?.value.trim() || "";
      const mobile = $("profileMobile")?.value.trim() || "";
      if (!name || !/^[0-9]{10}$/.test(mobile)) {
        toast("Enter a display name and 10-digit demo mobile number.");
        return;
      }
      const profile = { name, mobile };
      sessionStorage.setItem("genomeai_profile", JSON.stringify(profile));
      $("profilePreview")?.classList.remove("hidden");
      $("profilePreviewName") && ($("profilePreviewName").textContent = name);
      $("profilePreviewMobile") && ($("profilePreviewMobile").textContent = `Demo profile · mobile ending ${mobile.slice(-4)}`);
      toast("Demo profile saved for this browser session.");
    });

    $("authAction")?.addEventListener("click", () => {
      const existing = sessionStorage.getItem("genomeai_profile");
      toast(existing ? "Demo login successful for this session." : "Create a demo profile first.");
    });

    $("signupTab")?.addEventListener("click", () => {
      $("signupTab")?.classList.add("active");
      $("loginTab")?.classList.remove("active");
      $("authAction") && ($("authAction").textContent = "CREATE DEMO ACCOUNT →");
    });

    $("loginTab")?.addEventListener("click", () => {
      $("loginTab")?.classList.add("active");
      $("signupTab")?.classList.remove("active");
      $("authAction") && ($("authAction").textContent = "LOGIN TO DEMO →");
    });
  }

  function initLearning() {
    $$('[data-learn]').forEach(button => {
      button.addEventListener("click", () => {
        const content = learning[button.dataset.learn];
        if (content) showModal(content[0], content[1], content[2]);
      });
    });

    $$(".faq button").forEach(button => {
      button.addEventListener("click", () => button.closest(".faq")?.classList.toggle("open"));
    });
  }

  function initModal() {
    $("modalClose")?.addEventListener("click", hideModal);
    $(".backdrop")?.addEventListener("click", hideModal);
  }

  function initReveal() {
    // Content is visible by default. This only adds optional motion.
    const elements = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach(el => el.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.03 });
    elements.forEach(el => observer.observe(el));
  }

  async function initHealth() {
    const status = $("systemStatusText");
    if (!status) return;
    try {
      const data = await apiGet("/health");
      status.textContent = data.status === "online" ? "SYSTEM ONLINE" : "BACKEND CHECK";
    } catch {
      status.textContent = "BACKEND OFFLINE";
    }
  }

  function exposeGlobalsForLegacyHandlers() {
    window.searchGenome = searchGenome;
    window.runAI = runAI;
    window.showModal = showModal;
    window.exportReport = exportReport;
    window.resetAnalysis = resetAnalysis;
  }

  document.addEventListener("DOMContentLoaded", () => {
    exposeGlobalsForLegacyHandlers();
    initHeader();
    initHome();
    initOrganisms();
    initAnalysis();
    initAI();
    initAbout();
    initLearning();
    initModal();
    initReveal();
    void initHealth();
  });
})();
