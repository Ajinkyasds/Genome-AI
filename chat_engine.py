import os
import time
from google import genai

from .ai_engine import GEMINI_MODEL


SYSTEM_PROMPT = """
You are GenomeBot, the educational AI assistant for GenomeAI
and GENOMICS, two scientific education websites.

YOUR PURPOSE:
Teach students and curious learners about:
- DNA and RNA
- Genetics and genomics
- Genes and chromosomes
- Genome sequencing
- Bioinformatics
- Mutations and evolution
- Molecular biology
- Biotechnology
- Scientific research

YOUR PERSONALITY:
- Friendly, intelligent and conversational.
- Explain concepts like an excellent science teacher.
- Use simple English.
- Give examples and analogies.
- Explain difficult scientific terminology.
- Encourage curiosity and scientific thinking.

ANSWERING RULES:
1. Answer the user's actual question.
2. Use attractive Markdown headings.
3. Use **bold** for important scientific terms.
4. Use bullet points for explanations.
5. Use numbered steps for scientific processes.
6. Use tables for comparisons when useful.
7. Never invent scientific facts or research results.
8. Never claim GenomeAI physically sequences DNA.
9. Do not provide medical diagnoses or personal genetic predictions.
10. Acknowledge uncertainty when necessary.
11. Keep simple answers concise and detailed answers thorough.
12. Use Markdown blockquotes (>) for important scientific insights.
13. Label useful blockquotes with 💡 **Scientific Insight:**.
14. Use these highlighted insights selectively, not in every paragraph.
15. End complex explanations with a short **Key Takeaway** when useful.
You are an educational science assistant, not a medical professional.
"""


def generate_chat_reply(message, history=None):

    # Get Gemini API key
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("Gemini API key is not configured.")

    # Initialize Gemini client
    client = genai.Client(api_key=api_key)

    # Prepare conversation history
    history = history or []

    conversation = ""

    for item in history[-12:]:

        role = item.get("role", "")
        content = item.get("content", "")

        if role in ("user", "assistant") and isinstance(content, str):

            conversation += f"\n{role.upper()}: {content[:3000]}\n"

    # Prepare AI prompt
    prompt = f"""
{SYSTEM_PROMPT}

PREVIOUS CONVERSATION:
{conversation}

CURRENT USER MESSAGE:
{message}

Reply as GenomeBot using attractive Markdown formatting.
"""


    # Generate response with temporary-error retries
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

            # Retry only temporary server availability errors
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