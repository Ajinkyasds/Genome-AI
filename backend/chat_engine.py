import os
import time
from pathlib import Path
import httpx

# ==========================================
# GENOMEBOT WEBSITE KNOWLEDGE
# ==========================================

WEBSITE_PAGES = {
    "Dashboard": "Main overview of GENOMICS.",
    "Organism": "Explore organisms and genomic information.",
    "Genome Library": "Explore genome reference information.",
    "Learn": "Learn genetics, genomics and biology.",
    "Human": "Educational human genetics content.",
    "About": "Information about the GENOMICS project."
}


# ==========================================
# QUESTIONS MODE — GENOME AI 2.0
# ==========================================

QUESTIONS_PROMPT = """
You are GenomeBot 2.0, an advanced AI educational
assistant integrated into the GENOMICS website.

IDENTITY:

You are an intelligent, curious, knowledgeable and
conversational AI assistant.

You are not a predefined FAQ chatbot.

You must understand questions, reason about them,
and generate relevant answers.

==================================================
1. OPEN-ENDED INTELLIGENCE
==================================================

You can answer questions across a broad range
of subjects, including:

- Biology and genetics
- Genomics and biotechnology
- Physics and astronomy
- Chemistry
- Mathematics
- Computer science
- Artificial intelligence
- Medicine and scientific research
- History and geography
- Technology and engineering
- General knowledge
- Everyday educational questions

Do not restrict yourself to genomics.

If a user asks something unrelated to genomics,
answer their question normally.

Never redirect an unrelated question towards DNA
or genetics unnecessarily.

==================================================
2. UNDERSTAND THE ACTUAL QUESTION
==================================================

This is one of your most important responsibilities.

Before answering:

1. Identify what the user actually wants to know.
2. Understand the context of the question.
3. Distinguish definitions from applications,
   significance, advantages, disadvantages,
   comparisons and explanations.
4. Answer the specific question asked.

IMPORTANT EXAMPLE:

Question:
"What is the relevance of genome sequencing
in today's world?"

WRONG RESPONSE:
A basic definition of genome sequencing.

CORRECT RESPONSE:
Discuss its relevance in modern society, including:

- Personalised medicine.
- Cancer research.
- Genetic disease research.
- Infectious disease surveillance.
- Agricultural biotechnology.
- Evolutionary research.
- Conservation biology.

Explain WHY these applications matter.

==================================================
3. CONVERSATION MEMORY
==================================================

Use the previous conversation to understand
follow-up questions.

For example:

User:
What is DNA?

Assistant:
DNA stores genetic information.

User:
What is its structure?

You must understand that "its" refers to DNA.

Do not unnecessarily repeat previous explanations.

==================================================
4. ANSWERING STYLE
==================================================

- Use clear and understandable English.
- Explain difficult concepts step by step.
- Use examples when they improve understanding.
- Use Markdown headings when appropriate.
- Use bullet points for organised explanations.
- Use tables for useful comparisons.
- Bold important terms.
- Avoid unnecessary repetition.
- Adjust answer length to the question.

For simple questions, give concise answers.

For complex questions, provide detailed explanations.

==================================================
5. SCIENTIFIC ACCURACY
==================================================

- Never invent scientific facts.
- Distinguish established facts from hypotheses.
- Acknowledge uncertainty.
- Correct misconceptions politely.
- Do not present speculation as established science.
- Do not pretend to have performed experiments.
- Do not claim that GenomeAI physically sequences DNA.

==================================================
6. MEDICAL RESPONSIBILITY
==================================================

You may explain medical and genetic concepts
for educational purposes.

However:

- Do not diagnose users.
- Do not predict personal genetic conditions.
- Do not replace qualified medical professionals.
- Do not encourage uploading personal DNA
  for medical diagnosis.

==================================================
7. PERSONALITY
==================================================

Be:

- Intelligent.
- Friendly.
- Curious.
- Conversational.
- Encouraging.
- Scientifically enthusiastic.

Encourage users to explore new ideas.

Your purpose is to make scientific knowledge
understandable and accessible.


VOICE-FRIENDLY ANSWERING STYLE:
- Sound like a knowledgeable human science educator.
- Answer directly, naturally and conversationally.
- Use short, well-connected paragraphs.
- Avoid Markdown headings, hashtags, asterisks and decorative symbols.
- Do not write ###, **, ## or bullet symbols.
- Explain scientific terms in simple language.
- Use approximately 60-120 words for ordinary questions.
- Give deeper explanations when the question requires them.
- Avoid repeating the question.
- Never sacrifice scientific accuracy for friendliness.

FINAL RULE:

Answer the user's actual question.

You are an educational AI assistant,
not a keyword-matching search engine.
"""


# ==========================================
# EXPLORER MODE
# ==========================================

EXPLORER_PROMPT = """
You are GenomeBot Explorer, the interactive
website guide for GENOMICS.

Your responsibilities:

- Explain website sections.
- Guide visitors through the website.
- Suggest educational exploration missions.
- Help users understand website functionality.

KNOWN WEBSITE PAGES:

1. Dashboard
2. Organism
3. Genome Library
4. Learn
5. Human
6. About

IMPORTANT:

Never invent website features.

Never claim that you physically clicked a button.

Give clear navigation instructions.

If a user asks a general scientific question,
answer it briefly and connect it to the website
only when genuinely relevant.

Make exploration educational and engaging.
"""


# ==========================================
# FALLBACK KNOWLEDGE
# ==========================================

KNOWLEDGE_BASE = {

    "dna": """
## What is DNA?

DNA (Deoxyribonucleic Acid) stores genetic
information in most living organisms.

It contains four nitrogenous bases:

- Adenine (A)
- Thymine (T)
- Guanine (G)
- Cytosine (C)

DNA usually has a double-helix structure.

**Key Takeaway:** DNA stores hereditary information.
""",

    "rna": """
## What is RNA?

RNA (Ribonucleic Acid) helps cells use
genetic information.

Important types include:

- mRNA
- tRNA
- rRNA

RNA plays an important role in protein synthesis.

**Key Takeaway:** RNA helps cells use genetic instructions.
""",

    "genome": """
## What is a Genome?

A genome is the complete set of genetic material
of an organism.

It includes genes and non-coding DNA.

Genome research helps scientists investigate
evolution, heredity and biological diversity.

**Key Takeaway:** A genome represents an organism's
complete genetic information.
""",

    "sequencing": """
## What is Genome Sequencing?

Genome sequencing determines the order of DNA bases.

Scientists use sequencing technologies to read
genetic information.

The resulting data can be analysed using
bioinformatics tools.

**Key Takeaway:** Sequencing allows scientists
to study the order of genetic letters.
"""
}


# ==========================================
# FALLBACK RESPONSE
# ==========================================

def get_questions_fallback(message):

    question = message.lower().strip().rstrip("?!.")

    # Only answer when the user directly asks
    # for a basic definition.

    definitions = {
        "dna": ["what is dna", "define dna"],
        "rna": ["what is rna", "define rna"],
        "genome": ["what is a genome", "define genome"],
        "sequencing": [
            "what is genome sequencing",
            "define genome sequencing"
        ]
    }

    for topic, phrases in definitions.items():

        if question in phrases:
            return KNOWLEDGE_BASE[topic]

    # Never give an unrelated predefined answer.

    return (
        "GenomeBot's advanced AI service is "
        "temporarily unavailable. Please try again "
        "shortly. I don't want to give you an "
        "irrelevant or misleading answer."
    )


# ==========================================
# EXPLORER FALLBACK
# ==========================================

def get_explorer_fallback(message):

    question = message.lower()

    if any(word in question for word in [
        "mission", "adventure", "challenge", "quest"
    ]):

        return """
## Welcome, Genomics Explorer!

### MISSION 1 — Discover Life's Code

1. Open the Learn page.
2. Explore DNA and genetics.
3. Understand the four DNA bases.

Your scientific journey begins here!
"""

    if any(word in question for word in [
        "tour", "guide", "navigate",
        "website", "lost", "pages", "explore"
    ]):

        return """
## Welcome to GENOMICS!

Explore these website sections:

1. Dashboard — Main overview.
2. Organism — Explore organisms.
3. Genome Library — Reference information.
4. Learn — Understand scientific concepts.
5. Human — Educational human genetics.
6. About — Learn about the project.

Start with the Learn section!
"""

    return """
## GenomeBot Explorer

I can help you:

- Explore the website.
- Start scientific missions.
- Understand website sections.
- Discover educational content.

Try asking me to guide you through the website.
"""


# ==========================================
# FALLBACK ROUTER
# ==========================================

def get_fallback_reply(message, mode="questions"):

    if mode == "explorer":
        return get_explorer_fallback(message)

    return get_questions_fallback(message)


# ==========================================
# MAIN CHAT ENGINE — GENOMEBOT 2.0
# ==========================================



try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

ENV_FILE = Path(__file__).parent / ".env"

if load_dotenv:
    load_dotenv(ENV_FILE)

GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def generate_chat_reply(message, history=None, mode="questions"):
    if not isinstance(message, str) or not message.strip():
        raise ValueError("Message cannot be empty.")

    if mode not in ("questions", "explorer"):
        mode = "questions"

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        return get_fallback_reply(message, mode)

    selected_prompt = (
        QUESTIONS_PROMPT if mode == "questions"
        else EXPLORER_PROMPT
    )

    identity_prompt = '''
AI TECHNOLOGY IDENTITY:
- Your inference provider is Groq.
- Your model is openai/gpt-oss-20b.
- Never claim to be GPT-4 or another model.
- Do not confuse the model developer with the API provider.
'''

    messages = [
        {
            "role": "system",
            "content": selected_prompt + "\n\n" + identity_prompt
        }
    ]

    for item in (history or [])[-12:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if role in ("user", "assistant") and isinstance(content, str):
            if content.strip():
                messages.append({
                    "role": role,
                    "content": content[:3000]
                })

    messages.append({
        "role": "user",
        "content": message.strip()
    })

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_completion_tokens": 2048
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    for attempt in range(3):
        try:
            response = httpx.post(
                GROQ_URL,
                headers=headers,
                json=payload,
                timeout=60.0
            )

            response.raise_for_status()
            data = response.json()

            choices = data.get("choices", [])

            if not choices:
                raise RuntimeError("Groq returned no response choices.")

            answer = choices[0].get("message", {}).get("content")

            if not isinstance(answer, str) or not answer.strip():
                raise RuntimeError("Groq returned an empty response.")

            return answer.strip()

        except httpx.HTTPStatusError as error:
            status = error.response.status_code

            if status == 429:
                if attempt < 2:
                    time.sleep(2 * (attempt + 1))
                    continue
                return get_fallback_reply(message, mode)

            if (status >= 500 or status == 408) and attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue

            raise RuntimeError(
                f"GenomeBot Groq API error ({status}): "
                f"{error.response.text[:500]}"
            )

        except httpx.TimeoutException:
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue

            raise RuntimeError("GenomeBot Groq request timed out.")

    return get_fallback_reply(message, mode)
