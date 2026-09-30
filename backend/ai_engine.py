from pathlib import Path
import os

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None


ENV_FILE = Path(__file__).parent / ".env"

if load_dotenv:
    load_dotenv(ENV_FILE)


GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.8-flash"
)


def is_ai_configured():
    return bool(
        os.getenv("GEMINI_API_KEY")
    )


def _safe_number(value, default=0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _fallback(genome, analysis, module):

    name = genome.get(
        "scientific_name",
        "the selected organism"
    )

    common = genome.get(
        "common_name",
        ""
    )

    group = genome.get(
        "group",
        ""
    )

    length = int(
        _safe_number(
            analysis.get("genome_length", 0)
        )
    )

    gc = _safe_number(
        analysis.get("gc_percentage", 0)
    )

    bases = (
        analysis.get("base_counts", {})
        or {}
    )

    sequences = int(
        _safe_number(
            analysis.get("sequence_count", 0)
        )
    )

    total = max(length, 1)

    percentages = {
        base: round(
            (
                _safe_number(
                    bases.get(base, 0)
                ) / total
            ) * 100,
            2
        )
        for base in "ATGC"
    }

    at_percentage = round(
        percentages["A"] + percentages["T"],
        2
    )

    common_text = (
        f" ({common})"
        if common
        else ""
    )

    group_text = (
        f" It belongs to the {group} group."
        if group
        else ""
    )


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
            f"**{at_percentage:.2f}%** of the sequence. "
            f"This means the reference is relatively more "
            f"AT-rich than GC-rich.\n\n"

            f"GC content is useful when comparing genomes or "
            f"different regions of a genome, although GC content "
            f"by itself does not tell us what a particular gene "
            f"does or whether a sequence has a biological effect."
        )


    elif module == "Biological Context":

        text = (
            f"### Biological interpretation\n\n"
            f"We are looking at the reference genome of "
            f"**{name}**{common_text}.{group_text}\n\n"

            f"GenomeAI measured **{length:,} bases** across "
            f"**{sequences} sequence records**, with a calculated "
            f"GC content of **{gc:.2f}%**. "
            f"The remaining portion is mainly represented by "
            f"adenine and thymine, which together account for "
            f"about **{at_percentage:.2f}%** of the analysed bases.\n\n"

            f"These measurements describe the composition of the "
            f"reference genome. They are useful for understanding "
            f"and comparing genomic sequences, but they do not by "
            f"themselves explain the function of individual genes "
            f"or predict biological outcomes.\n\n"

            f"Importantly, these are computational measurements "
            f"from a reference dataset, not a clinical diagnosis "
            f"or a claim about an individual organism."
        )


    elif module == "Research Questions":

        text = (
            f"### What could we investigate next?\n\n"
            f"Now that GenomeAI has measured the reference genome "
            f"of **{name}**, several useful research questions "
            f"can be explored:\n\n"

            f"- **How does its GC content compare with another "
            f"organism?** This can reveal differences in overall "
            f"sequence composition.\n\n"

            f"- **Do different chromosomes or sequence records "
            f"have different base compositions?** This could show "
            f"whether GC content is distributed evenly across the "
            f"reference.\n\n"

            f"- **What happens when a sample sequence is compared "
            f"with the reference?** Computational comparison can "
            f"identify sequence differences.\n\n"

            f"- **Where are potential coding regions located?** "
            f"Further bioinformatics analysis could search for "
            f"open reading frames and other sequence features.\n\n"

            f"- **How does this genome compare with related "
            f"organisms?** Genome size, GC content and sequence "
            f"features can be compared computationally."
        )


    else:

        text = (
            f"### Genome interpretation\n\n"
            f"GenomeAI analysed the reference genome of "
            f"**{name}**{common_text}. "
            f"The dataset contains **{length:,} bases** across "
            f"**{sequences} sequence records**.\n\n"

            f"The calculated GC content is **{gc:.2f}%**, meaning "
            f"adenine and thymine together account for about "
            f"**{at_percentage:.2f}%** of the analysed sequence. "
            f"This gives the genome a relatively AT-rich overall "
            f"composition.\n\n"

            f"### What does that tell us?\n\n"
            f"GC content is one of the basic measurements used "
            f"in genomics to describe and compare DNA sequences. "
            f"It can help researchers notice differences between "
            f"genomes or genomic regions.\n\n"

            f"However, GC content alone cannot tell us what a gene "
            f"does, identify a disease, or predict a biological "
            f"outcome. More detailed sequence analysis would be "
            f"needed for those questions.\n\n"

            f"These values were calculated directly from the "
            f"reference sequence by the GenomeAI bioinformatics "
            f"engine. The AI layer is used to explain those "
            f"computed results in simpler biological language."
        )


    return {
        "success": True,
        "mode": "offline",
        "module": module,
        "insight": text,
        "message": (
            "Generated from exact local BioPython analysis "
            "because live Gemini is unavailable or not configured."
        )
    }


def _gemini_text(
    genome,
    analysis,
    module
):

    try:
        from google import genai
    except Exception:
        return None


    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:
        return None


    client = genai.Client(
        api_key=api_key
    )


    prompt = f"""
You are the educational biology and genomics
explainer for GenomeAI, a school science
exhibition project.

Your job is to explain the supplied bioinformatics
results in a way that feels like a knowledgeable
teacher or ChatGPT explaining the result to a
student.

Do not simply repeat the numbers. Explain what
they mean and why the measurements are useful.

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


IMPORTANT RULES:

1. Treat the supplied measurements as the source
   of truth.

2. Never invent genome measurements, variants,
   mutations, genes, chromosomes, sequencing
   experiments, diagnoses, or experimental results
   that were not supplied.

3. You may provide brief general biological
   background when it helps explain the result,
   but clearly distinguish general background
   from what GenomeAI actually measured.

4. Explain technical terms in simple language.

5. Do not make medical or clinical conclusions.

6. Do not claim that GenomeAI sequenced the
   organism. The data is a reference genome.

7. Do not say that GC content alone determines
   gene function, health, disease, or biological
   effects.

8. Make the response feel conversational and
   educational rather than like a software log.

9. Use short Markdown headings and paragraphs.
   Bullet points are welcome when useful.

10. Aim for roughly 180–280 words unless the
    module naturally requires less.

11. Begin with the main biological interpretation,
    then explain the important measurements,
    then explain why they matter.

12. End with a short limitation or next-step
    statement when appropriate.
"""


    try:

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )

        text = getattr(
            response,
            "text",
            None
        )

        if text:
            return text.strip()

    except Exception:

        return None


    return None


def generate_genome_insight(
    genome,
    analysis,
    module="Genome Summary"
):

    text = _gemini_text(
        genome,
        analysis,
        module
    )


    if text:

        return {
            "success": True,
            "mode": "gemini",
            "module": module,
            "insight": text,
            "message": (
                "Generated by Gemini from exact "
                "backend analysis results."
            )
        }


    return _fallback(
        genome,
        analysis,
        module
    )