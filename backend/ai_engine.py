from pathlib import Path
import os

import httpx

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None


ENV_FILE = Path(__file__).parent / ".env"

if load_dotenv:
    load_dotenv(ENV_FILE)


GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b"
)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def is_ai_configured():
    return bool(os.getenv("GROQ_API_KEY"))


def _safe_number(value, default=0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _fallback(genome, analysis, module):

    name = genome.get("scientific_name", "the selected organism")
    common = genome.get("common_name", "")
    group = genome.get("group", "")

    length = int(_safe_number(analysis.get("genome_length", 0)))
    gc = _safe_number(analysis.get("gc_percentage", 0))

    bases = analysis.get("base_counts", {}) or {}

    sequences = int(
        _safe_number(analysis.get("sequence_count", 0))
    )

    total = max(int(_safe_number(analysis.get("canonical_base_count", length))), 1)

    percentages = {
        base: round(
            (_safe_number(bases.get(base, 0)) / total) * 100,
            2
        )
        for base in "ATGC"
    }

    at_percentage = round(
        percentages["A"] + percentages["T"],
        2
    )

    common_text = f" ({common})" if common else ""
    group_text = f" It belongs to the {group} group." if group else ""

    if module == "Base Composition":

        text = (
            f"### Genome composition\n\n"
            f"The reference genome of **{name}**{common_text} "
            f"contains **{length:,} DNA bases** across "
            f"**{sequences} sequence records**.\n\n"

            f"Looking at the four DNA bases, the genome contains "
            f"**A = {bases.get('A', 0):,}**, "
            f"**T = {bases.get('T', 0):,}**, "
            f"**G = {bases.get('G', 0):,}**, and "
            f"**C = {bases.get('C', 0):,}**.\n\n"

            f"The calculated GC content is **{gc:.2f}%**, "
            f"while A and T together make up about "
            f"**{at_percentage:.2f}%** of the sequence.\n\n"

            f"GC content is useful when comparing genomes or "
            f"different regions of a genome. However, GC content "
            f"alone cannot explain the function of individual genes."
        )

    elif module == "Biological Context":

        text = (
            f"### Biological interpretation\n\n"
            f"We are looking at the reference genome of "
            f"**{name}**{common_text}.{group_text}\n\n"

            f"GenomeAI measured **{length:,} bases** across "
            f"**{sequences} sequence records**, with a calculated "
            f"GC content of **{gc:.2f}%**.\n\n"

            f"These measurements describe the composition of the "
            f"reference genome. They are useful for understanding "
            f"and comparing genomic sequences, but they do not "
            f"explain individual gene functions or predict "
            f"biological outcomes.\n\n"

            f"These are computational measurements from a reference "
            f"dataset, not a clinical diagnosis."
        )

    elif module == "Research Questions":

        text = (
            f"### What could we investigate next?\n\n"
            f"Now that GenomeAI has measured the reference genome "
            f"of **{name}**, several useful research questions "
            f"can be explored:\n\n"

            f"- How does its GC content compare with another organism?\n\n"
            f"- Do different chromosomes or sequence records have "
            f"different base compositions?\n\n"
            f"- What happens when a sample sequence is compared "
            f"with the reference?\n\n"
            f"- Where are potential coding regions located?\n\n"
            f"- How does this genome compare with related organisms?"
        )

    else:

        text = (
            f"### Genome interpretation\n\n"
            f"GenomeAI analysed the reference genome of "
            f"**{name}**{common_text}. The dataset contains "
            f"**{length:,} bases** across **{sequences} sequence records**.\n\n"

            f"The calculated GC content is **{gc:.2f}%**, meaning "
            f"adenine and thymine together account for about "
            f"**{at_percentage:.2f}%** of the analysed sequence.\n\n"

            f"GC content is one of the basic measurements used "
            f"in genomics to describe and compare DNA sequences.\n\n"

            f"However, GC content alone cannot tell us what a gene "
            f"does, identify a disease, or predict a biological "
            f"outcome. More detailed sequence analysis is needed."
        )

    return {
        "success": True,
        "mode": "offline",
        "module": module,
        "insight": text,
        "message": (
            "Generated from exact local BioPython analysis "
            "because live Groq is unavailable or not configured."
        )
    }


def _groq_text(genome, analysis, module):

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        return None

    module_instructions = {
        "Genome Summary": """
Produce an integrated overview of the selected reference genome.
Cover:
1. A compelling scientific headline.
2. Organism and assembly identity.
3. Genome length, sequence count and GC percentage.
4. What these measurements reveal about the genome.
5. Scientific significance supported by available evidence.
6. Important limitations and further exploration.

Focus on the overall genomic profile. Do not produce separate
Base Composition, Biological Context or Research Questions reports.
""",

        "Base Composition": """
Perform a focused nucleotide composition analysis.
Cover:
1. A composition-focused headline.
2. A table containing A, T, G and C counts and percentages.
3. Total GC and AT percentages.
4. Interpretation of the relative nucleotide frequencies.
5. What the measurements can and cannot establish.
6. Useful follow-up composition analyses.

Use the supplied counts accurately. Do not infer gene function,
adaptation, chromosome identity or biological outcomes from GC
content alone. Do not produce a general genome summary.
""",

        "Biological Context": """
Explain the biological context of the selected organism.
Cover:
1. A biology-focused headline.
2. Established biological background about the organism.
3. Connections between that background and the supplied genome
   measurements, clearly distinguishing facts from interpretation.
4. Broader biological relevance.
5. Evidence limitations.
6. Further biological investigations.

Do not invent organism-specific traits or claim that genome
measurements prove a particular biological function. Clearly
distinguish established background from measured results.
Do not produce separate composition or research-question reports.
""",

        "Research Questions": """
Develop a focused research agenda based on the supplied genome data.
Cover:
1. A research-focused headline.
2. What the supplied measurements establish.
3. Four to six specific, testable research questions.
4. Why each question matters.
5. Suitable computational methods for investigating them.
6. Additional datasets or experimental evidence required.

Questions must be relevant to the actual available data.
Do not present proposed analyses as completed discoveries.
Do not invent genes, mutations, variants or experimental findings.
Do not produce a general genome summary.
"""
    }

    module_instruction = module_instructions.get(
        module,
        module_instructions["Genome Summary"]
    )

    prompt = f"""
You are GenomeAI, an advanced scientific intelligence assistant specializing in genomics and bioinformatics.

Transform computational genome measurements into engaging, professional scientific reports.

IDENTITY:
- Write like a scientific research analyst.
- Be intellectually engaging, precise and informative.
- Highlight important discoveries.
- Explain complex biology in accessible language.
- Never exaggerate scientific significance.

MODULE:
{module}

ORGANISM:
{genome.get("scientific_name")}

COMMON NAME:
{genome.get("common_name")}

GROUP:
{genome.get("group")}

REFERENCE ASSEMBLY:
{genome.get("reference_assembly")}

REFERENCE SOURCE:
{genome.get("source")}

REFERENCE TAXONOMY:
{genome.get("taxonomy")}

REFERENCE SUMMARY:
{genome.get("summary")}

SEQUENCE COUNT:
{analysis.get("sequence_count")}

GENOME LENGTH:
{analysis.get("genome_length")}

GC PERCENTAGE:
{analysis.get("gc_percentage")}

BASE COUNTS:
{analysis.get("base_counts")}

CANONICAL BASE COUNT:
{analysis.get("canonical_base_count")}

AMBIGUOUS BASE COUNT:
{analysis.get("ambiguous_bases")}

CANONICAL BASE PERCENTAGES:
{analysis.get("canonical_base_percentages")}

SEQUENCE RECORD DETAILS:
{analysis.get("sequence_details", [])}

DATA PROVENANCE AND EVIDENCE RULES:
- Treat the supplied genome fields as the actual computational input.
- Never invent or assume genes, mutations, variants, chromosomes, contigs, scaffolds, organelles or experiments.
- Treat the supplied reference assembly, source and taxonomy as reference metadata.
- Treat FASTA descriptions as record-level annotations supplied with the reference data.
- You may report chromosome or organelle identities explicitly stated in those descriptions.
- Do not infer biological identities beyond what the supplied metadata explicitly states.
- Keep reference annotations distinct from independently measured sequence statistics.
- Calculate nucleotide percentages using canonical A/T/G/C bases, excluding ambiguous bases.
- Report ambiguous bases separately.
- Never infer assembly completeness from sequence count alone.
- Do not infer chromosome count, chromosome identity, mitochondrial identity or strain identity from sequence count or genome statistics alone.
- Report these details when explicitly supported by the supplied reference metadata or FASTA descriptions.
- Do not infer assembly completeness from sequence count alone.
- Do not introduce chromosome counts, mitochondrial genome descriptions or strain identities as organism background unless supported by verified metadata for the selected reference.
- Clearly distinguish general species background from facts about the specific reference assembly.
- Never use general species knowledge to assign identities to records in the selected reference assembly.
- Do not state chromosome counts, ploidy, mitochondrial organization or genome architecture unless independently verified and explicitly sourced.
- Never describe sequence counts as consistent with a particular chromosome arrangement.
- Do not claim that measured genome size matches an expected biological structure without verified comparative evidence.
- Do not suggest mechanistic effects on codon usage, transcription or gene expression from overall GC percentage alone.
- Avoid terms such as well-characterized, comprehensive, canonical, high-quality and expected unless supporting evidence is supplied.
- In the Biological Context module, prioritize cautious biological explanation over speculative interpretation.
- Do not attribute transcriptional regulation, promoter characteristics, genome architecture or metabolic capabilities to measured nucleotide composition without supporting analysis.
- Do not describe promoter regions as AT-rich unless promoter sequences have actually been analysed.
- Do not claim that GC content explains transcription, adaptation or other biological mechanisms.
- Do not label a genome compact without suitable comparative or annotation evidence.
- Zero ambiguous bases does not establish sequencing quality.
- Do not describe an assembly as comprehensive, complete, bias-free or high-quality without supporting evidence.
- When evidence is unavailable, explicitly state: "Not established by the supplied dataset."
- Do not invent gene counts, gene annotations, strain identities or functional findings.
- Distinguish supplied measurements from established biological knowledge and hypotheses.
- GC content alone cannot establish evolutionary adaptation, environmental history, gene function or phenotype.
- Do not claim causal relationships without supporting evidence.
- Explicitly identify information that is unavailable in the supplied dataset.
- Suggested analyses are proposals, not completed investigations.
- Never present a hypothesis or inference as a measured discovery.
- Do not make medical or clinical conclusions.
- GenomeAI analyses reference data; it does not claim to have sequenced the organism.

SELECTED MODULE INSTRUCTIONS:
{module_instruction}

Generate ONLY the selected module's report.
Do not include sections belonging to other modules.

SCIENTIFIC INTEGRITY:
- Treat supplied measurements as the source of truth.
- Never invent genes, mutations, variants, chromosomes or experiments.
- Never assume sequence records represent particular chromosomes or organelles without evidence.
- Distinguish measured results from established biological knowledge and hypotheses.
- GC content alone cannot establish evolutionary adaptation, environmental history or gene function.
- Never present hypotheses as discoveries.
- Do not make medical or clinical conclusions.
- GenomeAI analyses reference data; it does not claim to have sequenced the organism.
- Explicitly identify unavailable information.
- Never describe suggested analyses as already completed.

PRESENTATION:
- Use polished Markdown.
- Use meaningful section headings.
- Highlight important measurements in bold.
- Use tables for numerical comparisons when useful.
- Prefer concise, informative paragraphs.
- Avoid repetitive textbook explanations.
- Aim for approximately 250-400 words.
- End with a meaningful scientific takeaway.

The final answer should feel like a carefully prepared scientific research report, not an ordinary chatbot response.
    """

    try:

        response = httpx.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_completion_tokens": 2048
            },
            timeout=60.0
        )

        response.raise_for_status()

        data = response.json()

        choices = data.get("choices", [])

        if not choices:
            return None

        answer = (
            choices[0]
            .get("message", {})
            .get("content")
        )

        if answer and isinstance(answer, str):
            return answer.strip()

    except Exception as error:

        print(f"Groq genome insight error: {error}")

    return None


def generate_genome_insight(
    genome,
    analysis,
    module="Genome Summary"
):

    text = _groq_text(
        genome,
        analysis,
        module
    )

    if text:

        return {
            "success": True,
            "mode": "groq",
            "module": module,
            "insight": text,
            "message": (
                "Generated by Groq from exact "
                "backend BioPython analysis results."
            )
        }

    return _fallback(
        genome,
        analysis,
        module
    )
