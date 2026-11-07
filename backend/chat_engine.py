import os
import time
from google import genai

from .ai_engine import GEMINI_MODEL


SYSTEM_PROMPT = """
You are GenomeBot, the educational AI assistant for GenomeAI
and GENOMICS, two scientific education websites.

Teach students about:
- DNA and RNA
- Genetics and genomics
- Genes and chromosomes
- Genome sequencing
- Bioinformatics
- Mutations and evolution
- Molecular biology
- Biotechnology
- Scientific research

PERSONALITY:
- Friendly, intelligent and conversational.
- Explain concepts like an excellent science teacher.
- Use simple English, examples and analogies.

ANSWERING RULES:
1. Answer the actual question.
2. Use attractive Markdown headings.
3. Bold important scientific terms.
4. Use bullet points and numbered steps.
5. Use tables for comparisons when useful.
6. Never invent scientific facts.
7. Never claim GenomeAI physically sequences DNA.
8. Do not provide medical diagnoses or personal genetic predictions.
9. Acknowledge uncertainty when necessary.
10. End complex explanations with a Key Takeaway when useful.

You are an educational science assistant, not a medical professional.
"""


# BUILT-IN EDUCATIONAL KNOWLEDGE BASE

KNOWLEDGE_BASE = {
    "dna": """
## What is DNA?

**DNA (Deoxyribonucleic Acid)** is the molecule that stores
the genetic information of most living organisms.

### Important facts
- DNA contains instructions for building and maintaining organisms.
- It has a double-helix structure.
- DNA is made of smaller units called nucleotides.
- Its four nitrogenous bases are Adenine (A), Thymine (T),
  Guanine (G) and Cytosine (C).
- A pairs with T, while G pairs with C.

> 💡 **Scientific Insight:** DNA is often described as the
> instruction manual of life.

**Key Takeaway:** DNA stores hereditary information.
""",

    "rna": """
## What is RNA?

**RNA (Ribonucleic Acid)** helps cells use genetic information.

### Important facts
- RNA usually consists of a single strand.
- It contains ribose sugar.
- It uses Uracil (U) instead of Thymine (T).
- It plays an important role in protein synthesis.

### Three important types
1. **mRNA:** Carries genetic instructions.
2. **tRNA:** Brings amino acids during protein synthesis.
3. **rRNA:** Forms an important part of ribosomes.

**Key Takeaway:** RNA helps convert genetic instructions
into functional products such as proteins.
""",

    "gene": """
## What is a Gene?

A **gene** is a section of DNA that contains information
used to produce a functional product, such as a protein
or functional RNA.

### Important facts
- Genes are located on chromosomes.
- Genes contribute to inherited characteristics.
- Different versions of a gene are called alleles.

> 💡 **Scientific Insight:** A gene is a functional
> section of the much larger DNA molecule.

**Key Takeaway:** Genes are units of heredity.
""",

    "chromosome": """
## What is a Chromosome?

A **chromosome** is a structure made of DNA and proteins.

### Important facts
- Chromosomes contain many genes.
- They help organise and package DNA.
- In humans, most body cells have 46 chromosomes,
  arranged in 23 pairs.

**Key Takeaway:** Chromosomes organise genetic information
inside cells.
""",

    "genome": """
## What is a Genome?

A **genome** is the complete set of genetic material
of an organism.

### Important facts
- It includes genes and non-coding DNA.
- Different organisms have different genomes.
- Genome research helps scientists understand
  evolution and biological diversity.

**Key Takeaway:** A genome represents an organism's
complete genetic instruction set.
""",

    "sequencing": """
## What is Genome Sequencing?

**Genome sequencing** is the process of determining
the order of DNA bases.

### Basic process
1. DNA is obtained from a biological sample.
2. DNA is prepared for sequencing.
3. Sequencing technology reads DNA fragments.
4. Computer software helps analyse the results.
5. Scientists interpret the genetic information.

> 💡 **Scientific Insight:** Sequencing allows scientists
> to read the order of genetic letters.

**Key Takeaway:** Sequencing determines the order of
DNA bases.
""",

    "mutation": """
## What is a Mutation?

A **mutation** is a change in the DNA sequence.

### Important facts
- Mutations can occur naturally.
- Some mutations have no noticeable effect.
- Some can affect how a gene functions.
- Mutations contribute to genetic variation.

**Key Takeaway:** Mutations are changes in genetic
information and can influence evolution.
""",

    "bioinformatics": """
## What is Bioinformatics?

**Bioinformatics** combines biology, computer science
and mathematics to study biological data.

### Applications
- Analysing DNA sequences.
- Comparing genomes.
- Identifying genes.
- Studying evolutionary relationships.
- Organising biological databases.

> 💡 **Scientific Insight:** Bioinformatics helps scientists
> understand enormous amounts of biological information.

**Key Takeaway:** Bioinformatics uses computational tools
to study biological data.
""",

    "evolution": """
## What is Evolution?

**Evolution** refers to changes in inherited characteristics
of populations over generations.

### Important ideas
- Genetic variation exists within populations.
- Mutations can introduce new genetic variations.
- Natural selection can influence which inherited
  characteristics become more common.
- Evolution occurs across generations.

**Key Takeaway:** Evolution explains how populations
change over time.
""",

    "biotechnology": """
## What is Biotechnology?

**Biotechnology** uses living organisms, cells or biological
systems to develop useful products and processes.

### Applications
- Production of certain medicines.
- Agricultural improvements.
- Industrial enzymes.
- Scientific research.
- Genetic engineering.

**Key Takeaway:** Biotechnology applies biological knowledge
to solve practical problems.
"""
}


def get_fallback_reply(message):

    question = message.lower()
# Detect advanced topics not covered by the knowledge base
advanced_topics = [
    "crispr",
    "cas9",
    "gene editing",
    "genetic engineering",
    "embryo editing",
    "base editing",
    "prime editing"
]

if any(topic in question for topic in advanced_topics):
    return """
## GenomeBot — Educational Mode

This is an advanced scientific topic outside my
current built-in knowledge base.

My advanced AI service is temporarily unavailable.
Please try again when it becomes available.

I don't want to give you incomplete or inaccurate
scientific information.
"""
    # Match common scientific topics
    if any(word in question for word in ["sequencing", "sequence", "sequencer"]):
        return KNOWLEDGE_BASE["sequencing"]

    if any(word in question for word in ["chromosome", "chromosomes"]):
        return KNOWLEDGE_BASE["chromosome"]

    if any(word in question for word in ["bioinformatics"]):
        return KNOWLEDGE_BASE["bioinformatics"]

    if any(word in question for word in ["mutation", "mutations"]):
        return KNOWLEDGE_BASE["mutation"]

    if any(word in question for word in ["evolution", "natural selection"]):
        return KNOWLEDGE_BASE["evolution"]

    if any(word in question for word in ["biotechnology", "biotech"]):
        return KNOWLEDGE_BASE["biotechnology"]

    if any(word in question for word in ["genome", "genomics"]):
        return KNOWLEDGE_BASE["genome"]

    if any(word in question for word in ["gene", "genes", "heredity", "allele"]):
        return KNOWLEDGE_BASE["gene"]

    if any(word in question for word in ["rna", "ribonucleic"]):
        return KNOWLEDGE_BASE["rna"]

    if any(word in question for word in ["dna", "deoxyribonucleic"]):
        return KNOWLEDGE_BASE["dna"]

    return """
## GenomeBot — Educational Mode

My advanced AI service is temporarily unavailable because
of its API usage limit.

However, I can still answer basic questions about:

- DNA and RNA
- Genes and chromosomes
- Genomes and sequencing
- Mutations and evolution
- Bioinformatics
- Biotechnology

Please ask me a question about one of these topics.

> 💡 **Scientific Insight:** Scientific curiosity never
> has to stop when a server is temporarily unavailable!
"""


def generate_chat_reply(message, history=None):

    api_key = os.getenv("GEMINI_API_KEY")

    # Use educational fallback if API key is unavailable
    if not api_key:
        return get_fallback_reply(message)

    client = genai.Client(api_key=api_key)

    history = history or []

    conversation = ""

    for item in history[-12:]:

        role = item.get("role", "")
        content = item.get("content", "")

        if role in ("user", "assistant") and isinstance(content, str):
            conversation += f"\n{role.upper()}: {content[:3000]}\n"

    prompt = f"""
{SYSTEM_PROMPT}

PREVIOUS CONVERSATION:
{conversation}

CURRENT USER MESSAGE:
{message}

Reply as GenomeBot using attractive Markdown formatting.
"""

    for attempt in range(3):

        try:

            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )

            answer = getattr(response, "text", None)

            if not answer:
                raise RuntimeError("Gemini returned an empty response.")

            return answer.strip()

        except Exception as error:

            error_text = str(error).upper()

            # Detect exhausted API quota
            quota_error = (
                "429" in error_text
                or "RESOURCE_EXHAUSTED" in error_text
                or "QUOTA" in error_text
            )

            if quota_error:
                print("Gemini quota exhausted. Using educational fallback.")
                return get_fallback_reply(message)

            # Retry temporary server errors
            temporary_error = (
                "503" in error_text
                or "UNAVAILABLE" in error_text
            )

            if temporary_error and attempt < 2:

                wait_time = 2 * (attempt + 1)

                print(
                    f"Gemini temporarily unavailable. "
                    f"Retrying in {wait_time} seconds..."
                )

                time.sleep(wait_time)

            else:

                raise RuntimeError(
                    f"GenomeBot AI error: {error}"
                )
