import os
import time
from google import genai

from .ai_engine import GEMINI_MODEL


# ==========================================
# GENOMEBOT WEBSITE KNOWLEDGE
# ==========================================

WEBSITE_PAGES = {
    "Dashboard": "The main overview of the GENOMICS website.",
    "Organism": "Explore organisms and their genomic information.",
    "Genome Library": "Explore available genome reference information.",
    "Learn": "Learn scientific concepts related to genetics and genomics.",
    "Human": "Explore human genetics educational content. This is not
    a place to upload personal DNA for medical analysis.",
    "About": "Learn about the GENOMICS educational project."
}


# ==========================================
# QUESTIONS MODE — SYSTEM PROMPT
# ==========================================

QUESTIONS_PROMPT = """
You are GenomeBot, the scientific educational assistant
for GenomeAI and GENOMICS.

Your job is to teach students about:

- DNA and RNA
- Genes and chromosomes
- Genetics and genomics
- Genome sequencing
- Mutations and evolution
- Proteins and amino acids
- Molecular biology
- Bioinformatics
- Biotechnology
- CRISPR and gene editing
- Scientific research

PERSONALITY:
- Friendly, intelligent and conversational.
- Explain like an excellent science teacher.
- Use simple English and relatable examples.
- Encourage scientific curiosity.

ANSWERING RULES:
1. Answer the actual question.
2. Use Markdown headings where useful.
3. Bold important scientific terms.
4. Use bullet points and numbered steps.
5. Use tables for comparisons when useful.
6. Never invent scientific facts.
7. Explain difficult concepts step by step.
8. Acknowledge uncertainty.
9. Never claim GenomeAI physically sequences DNA.
10. Never provide medical diagnoses or personal genetic predictions.

End complex explanations with a Key Takeaway when useful.
"""


# ==========================================
# EXPLORER MODE — SYSTEM PROMPT
# ==========================================

EXPLORER_PROMPT = """
You are GenomeBot Explorer, the interactive website
guide for the GENOMICS educational website.

Your mission is to help visitors discover the website.

KNOWN WEBSITE PAGES:

1. Dashboard:
   Main overview of the website.

2. Organism:
   Explore organisms and genomic information.

3. Genome Library:
   Explore available genome reference information.

4. Learn:
   Understand scientific concepts.

5. Human:
   Explore human genetics for educational purposes.
   Do not encourage uploading personal DNA.

6. About:
   Learn about the project.

YOUR RESPONSIBILITIES:

- Give guided website tours.
- Explain the purpose of website pages.
- Suggest where visitors should go next.
- Create educational exploration missions.
- Help visitors who are confused or lost.
- Connect scientific concepts with website sections.

MISSION SYSTEM:

You may create missions such as:

MISSION 1 — Discover Life's Code
Explore the Learn page and understand DNA.

MISSION 2 — Meet an Organism
Visit the Organism page and explore an organism.

MISSION 3 — Explore Genetic Information
Visit the Genome Library and discover its purpose.

MISSION 4 — Human Genetics
Explore the Human educational section.

MISSION 5 — Become a Genomics Explorer
Explore the Dashboard, Learn and About sections.

IMPORTANT RULES:

- Give clear, numbered navigation instructions.
- Make exploration feel like a scientific adventure.
- Never pretend you can physically click or navigate the website.
- Never invent buttons, links, games or website features.
- If you are unsure about a page's exact layout, say so.
- Ask the visitor to share a screenshot if exact navigation help
  is required.

Use friendly language, headings and occasional scientific emojis.
"""


# ==========================================
# BUILT-IN EDUCATIONAL KNOWLEDGE BASE
# ==========================================

KNOWLEDGE_BASE = {

    "dna": """
## 🧬 What is DNA?

**DNA (Deoxyribonucleic Acid)** stores the genetic
information of most living organisms.

### Important facts

- DNA has a double-helix structure.
- It is made of smaller units called nucleotides.
- It contains four nitrogenous bases:
  - Adenine (A)
  - Thymine (T)
  - Guanine (G)
  - Cytosine (C)
- A pairs with T.
- G pairs with C.

### Scientific Insight
DNA acts like an instruction manual for living organisms.

**Key Takeaway:** DNA stores hereditary information.
""",

    "rna": """
## 🧪 What is RNA?

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

**Key Takeaway:** RNA helps cells use genetic instructions.
""",

    "gene": """
## 🧬 What is a Gene?

A **gene** is a section of DNA containing information
used to produce a functional product, such as a protein
or functional RNA.

### Important facts

- Genes are located on chromosomes.
- Genes contribute to inherited characteristics.
- Different versions of a gene are called alleles.

**Key Takeaway:** Genes are important units of heredity.
""",

    "chromosome": """
## 🧫 What is a Chromosome?

A **chromosome** is a structure made of DNA and proteins.

### Important facts

- Chromosomes contain many genes.
- They organise and package DNA.
- Most human body cells have 46 chromosomes,
  arranged in 23 pairs.

**Key Takeaway:** Chromosomes organise genetic information.
""",

    "genome": """
## 🌍 What is a Genome?

A **genome** is the complete set of genetic material
of an organism.

### Important facts

- It includes genes and non-coding DNA.
- Different organisms have different genomes.
- Genome research helps scientists study evolution
  and biological diversity.

**Key Takeaway:** A genome represents an organism's
complete genetic information.
""",

    "sequencing": """
## 🔬 What is Genome Sequencing?

Genome sequencing determines the order of DNA bases.

### Basic process

1. DNA is obtained from a biological sample.
2. The DNA is prepared for sequencing.
3. Sequencing technology reads DNA fragments.
4. Computer software analyses the results.
5. Scientists interpret the information.

**Key Takeaway:** Sequencing helps scientists read
the order of genetic letters.
""",

    "mutation": """
## 🧬 What is a Mutation?

A **mutation** is a change in the DNA sequence.

### Important facts

- Mutations can occur naturally.
- Some mutations have no noticeable effect.
- Some affect how a gene functions.
- Mutations contribute to genetic variation.

**Key Takeaway:** Mutations are changes in genetic information.
""",

    "bioinformatics": """
## 💻 What is Bioinformatics?

**Bioinformatics** combines biology, computer science
and mathematics to study biological data.

### Applications

- Analysing DNA sequences.
- Comparing genomes.
- Identifying genes.
- Studying evolutionary relationships.
- Organising biological databases.

**Key Takeaway:** Bioinformatics uses computers
to understand biological information.
""",

    "evolution": """
## 🌱 What is Evolution?

**Evolution** refers to changes in inherited characteristics
of populations over generations.

### Important ideas

- Genetic variation exists within populations.
- Mutations can introduce genetic variations.
- Natural selection influences inherited characteristics.
- Evolution occurs across generations.

**Key Takeaway:** Evolution explains how populations
change over time.
""",

    "biotechnology": """
## 🧪 What is Biotechnology?

**Biotechnology** uses living organisms, cells or biological
systems to develop useful products and processes.

### Applications

- Medicine production.
- Agricultural improvements.
- Industrial enzymes.
- Scientific research.
- Genetic engineering.

**Key Takeaway:** Biotechnology applies biological knowledge
to solve practical problems.
""",

    "protein": """
## 🧬 What are Proteins?

**Proteins** are biological molecules made from chains
of amino acids.

### Important functions

- Support cell structure.
- Act as enzymes.
- Help transport substances.
- Participate in cell signalling.
- Support growth and repair.

### How are proteins made?

Genetic information in DNA is used to make RNA.
Ribosomes then use the RNA instructions to assemble
amino acids into proteins.

**Key Takeaway:** Proteins perform many essential
functions in living organisms.
""",

    "molecular biology": """
## 🔬 What is Molecular Biology?

**Molecular biology** studies biological processes
at the molecular level.

It focuses especially on:

- DNA
- RNA
- Proteins
- Gene expression
- Molecular interactions

It helps scientists understand how cells function.

**Key Takeaway:** Molecular biology explores life
through its molecules.
""",

    "crispr": """
## ✂️ What is CRISPR?

**CRISPR-Cas9** is a gene-editing technology
adapted from a natural defence system found in bacteria.

### Basic idea

- A guide RNA helps direct the system to a selected
  DNA sequence.
- The Cas9 protein can cut DNA at the targeted location.
- Researchers study how cells repair the DNA.

### Applications being researched

- Understanding gene function.
- Studying inherited conditions.
- Developing potential medical applications.
- Agricultural research.

**Important:** Gene editing requires careful scientific,
ethical and safety evaluation.

**Key Takeaway:** CRISPR is a tool researchers use
to study and modify genetic material.
"""
}


# ==========================================
# EXPLORER FALLBACK
# ==========================================

def get_explorer_fallback(message):

    question = message.lower()

    if any(word in question for word in [
        "mission", "adventure", "challenge", "quest"
    ]):
        return """
## 🧭 Welcome, Genomics Explorer!

Your first scientific mission begins now.

### MISSION 1 — Discover Life's Code

**Objective:** Understand the language of life.

1. Open the **Learn** page.
2. Explore the available biology topics.
3. Find the section explaining DNA.
4. Learn what the four DNA bases represent.

### Your discovery goal

Understand why DNA is called the instruction
manual of living organisms.

**Mission status:** Ready to begin! 🔬
"""

    if any(word in question for word in [
        "tour", "guide", "navigate", "website",
        "lost", "where", "pages", "explore"
    ]):
        return """
## 🧭 Welcome to the GENOMICS Website!

Let's explore the main sections.

### 1. Dashboard
Start here for the main website overview.

### 2. Organism
Discover organisms and their genomic information.

### 3. Genome Library
Explore the available genome reference information.

### 4. Learn
Understand DNA, genetics and other scientific concepts.

### 5. Human
Explore human genetics educational content.

### 6. About
Learn about the project.

### Recommended first journey

Start with **Learn**, continue to **Organism**,
and then explore the **Genome Library**.

I can guide you one step at a time!

💡 I cannot click the website for you, but I can
help you find your way around it.
"""

    return """
## 🧭 GenomeBot Explorer

I'm your guide through the GENOMICS website!

I can help you:

- Discover the website pages.
- Take a guided scientific tour.
- Start an educational mission.
- Understand what each section does.
- Find your next scientific discovery.

Try asking:

- Guide me through this website.
- Start a scientific mission.
- What can I discover here?
"""


# ==========================================
# QUESTIONS FALLBACK
# ==========================================

def get_questions_fallback(message):

    question = message.lower()

    # Check specific topics before general topics.
    # This prevents unrelated keyword matches.

    topic_groups = [
        ("molecular biology", [
            "molecular biology"
        ]),
        ("bioinformatics", [
            "bioinformatics"
        ]),
        ("sequencing", [
            "sequencing", "sequencer", "sequence"
        ]),
        ("chromosome", [
            "chromosome"
        ]),
        ("biotechnology", [
            "biotechnology", "biotech"
        ]),
        ("crispr", [
            "crispr", "cas9", "gene editing",
            "base editing", "prime editing"
        ]),
        ("protein", [
            "protein", "proteins", "amino acid",
            "amino acids"
        ]),
        ("mutation", [
            "mutation", "mutations"
        ]),
        ("evolution", [
            "evolution", "natural selection"
        ]),
        ("genome", [
            "genome", "genomics"
        ]),
        ("gene", [
            "gene", "genes", "heredity", "allele"
        ]),
        ("rna", [
            "rna", "ribonucleic"
        ]),
        ("dna", [
            "dna", "deoxyribonucleic"
        ])
    ]

    for topic, keywords in topic_groups:

        if any(word in question for word in keywords):
            return KNOWLEDGE_BASE[topic]

    return """
## 🔬 GenomeBot — Questions Mode

My advanced AI service is temporarily unavailable.

However, I can still explain:

- DNA and RNA
- Genes and chromosomes
- Genomes and sequencing
- Mutations and evolution
- Bioinformatics
- Biotechnology
- Proteins and amino acids
- Molecular biology
- CRISPR

Ask me a question about one of these topics.

💡 Scientific curiosity never stops!
"""


# ==========================================
# FALLBACK ROUTER
# ==========================================

def get_fallback_reply(message, mode="questions"):

    if mode == "explorer":
        return get_explorer_fallback(message)

    return get_questions_fallback(message)


# ==========================================
# MAIN CHAT ENGINE
# ==========================================

def generate_chat_reply(message, history=None, mode="questions"):

    if mode not in ("questions", "explorer"):
        mode = "questions"

    api_key = os.getenv("GEMINI_API_KEY")

    # Use fallback if API key is unavailable.
    if not api_key:
        return get_fallback_reply(message, mode)

    client = genai.Client(api_key=api_key)

    history = history or []

    conversation = ""

    for item in history[-12:]:

        role = item.get("role", "")
        content = item.get("content", "")

        if role in ("user", "assistant") and isinstance(content, str):
            conversation += f"\n{role.upper()}: {content[:3000]}\n"

    if mode == "explorer":
        system_prompt = EXPLORER_PROMPT
    else:
        system_prompt = QUESTIONS_PROMPT

    prompt = f"""
{system_prompt}

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
                raise RuntimeError(
                    "Gemini returned an empty response."
                )

            return answer.strip()

        except Exception as error:

            error_text = str(error).upper()

            quota_error = (
                "429" in error_text
                or "RESOURCE_EXHAUSTED" in error_text
                or "QUOTA" in error_text
            )

            if quota_error:

                print(
                    "Gemini quota exhausted. "
                    "Using educational fallback."
                )

                return get_fallback_reply(message, mode)

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
