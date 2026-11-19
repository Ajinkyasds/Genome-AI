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

    total = max(length, 1)

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

SEQUENCE COUNT:
{analysis.get("sequence_count")}

GENOME LENGTH:
{analysis.get("genome_length")}

GC PERCENTAGE:
{analysis.get("gc_percentage")}

BASE COUNTS:
{analysis.get("base_counts")}

MODULE-SPECIFIC REPORT STRUCTURES:

GENOME SUMMARY:
1. Compelling scientific headline.
2. Genome at a Glance.
3. Understanding the Genome.
4. Scientific Significance.
5. Limitations.
6. Further Exploration.

BASE COMPOSITION:
1. Engaging composition headline.
2. Nucleotide Composition Snapshot.
3. Interpreting the Pattern.
4. Why It Matters.
5. Scientific Caution.
6. Further Exploration.

BIOLOGICAL CONTEXT:
1. Biological headline.
2. Relevant Biological Background.
3. Connecting Biology with Measurements.
4. Broader Scientific Significance.
5. Evidence Limitations.
6. Further Exploration.

RESEARCH QUESTIONS:
1. Research headline.
2. What We Already Know.
3. Four to six specific research questions.
4. Why These Questions Matter.
5. Suggested Computational Methods.
6. Additional Evidence Required.

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
