from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .ai_engine import generate_genome_insight, is_ai_configured
from .chat_engine import generate_chat_reply
from .genome_analyzer import analyze_fasta_files
from .genome_database import (
    GENOME_DATABASE,
    get_genome_files,
    search_genome
)


# ==========================================
# APPLICATION CONFIGURATION
# ==========================================

app = FastAPI(
    title="GenomeAI",
    description="Educational genomic intelligence API",
    version="2.0"
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==========================================
# CHATBOT REQUEST MODEL
# ==========================================

class ChatRequest(BaseModel):

    message: str = Field(
        min_length=1,
        max_length=3000
    )

    history: list[dict[str, str]] = Field(
        default_factory=list
    )


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "application": "GenomeAI",
        "status": "online",
        "docs": "/docs"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health():

    return {
        "status": "online",
        "application": "GenomeAI",
        "engine": "Bioinformatics analysis engine",
        "version": "2.0",
        "ai_configured": is_ai_configured()
    }


# ==========================================
# GENOME SEARCH
# ==========================================

@app.get("/search")
def search(name: str):

    genome = search_genome(name)

    if genome is None:

        return {
            "found": False,
            "query": name
        }

    files = get_genome_files(genome)

    return {
        "found": True,
        "genome": genome,
        "reference_file_available": bool(files),
        "reference_files": [f.name for f in files]
    }


# ==========================================
# ORGANISM PROFILE
# ==========================================

@app.get("/organism")
def organism(name: str):

    genome = search_genome(name)

    if genome is None:

        raise HTTPException(
            status_code=404,
            detail="Organism profile not found."
        )

    files = get_genome_files(genome)

    return {
        "success": True,
        "genome": genome,
        "reference_file_available": bool(files),
        "reference_files": [f.name for f in files]
    }


# ==========================================
# ORGANISM DATABASE
# ==========================================

@app.get("/organisms")
def organisms():

    return {
        "count": len(GENOME_DATABASE),

        "organisms": [
            {
                "scientific_name": g["scientific_name"],
                "common_name": g["common_name"],
                "group": g["group"],
                "reference_file_available": bool(
                    get_genome_files(g)
                )
            }

            for g in GENOME_DATABASE.values()
        ]
    }


# ==========================================
# GENOME ANALYSIS
# ==========================================

@app.get("/analyze")
def analyze(name: str):

    genome = search_genome(name)

    if genome is None:

        raise HTTPException(
            status_code=404,
            detail="Organism not found."
        )

    files = get_genome_files(genome)

    if not files:

        raise HTTPException(
            status_code=404,
            detail="No local reference genome file found for this organism."
        )

    analysis = analyze_fasta_files(files)

    return {
        "success": True,
        "organism": genome["scientific_name"],
        "common_name": genome["common_name"],
        "group": genome["group"],
        "reference_assembly": genome["reference_assembly"],
        "source": genome["source"],
        "files_used": [f.name for f in files],
        "analysis": analysis
    }


# ==========================================
# AI GENOME INSIGHT
# ==========================================

@app.get("/ai-insight")
def ai_insight(
    name: str,
    module: str = "Genome Summary"
):

    genome = search_genome(name)

    if genome is None:

        raise HTTPException(
            status_code=404,
            detail="Organism not found."
        )

    files = get_genome_files(genome)

    if not files:

        raise HTTPException(
            status_code=404,
            detail="No local reference genome file found for this organism."
        )

    analysis = analyze_fasta_files(files)

    return generate_genome_insight(
        genome,
        analysis,
        module
    )


# ==========================================
# GENOMEBOT AI CHAT
# ==========================================

@app.post("/chat")
def chat(request: ChatRequest):

    message = request.message.strip()

    if not message:

        raise HTTPException(
            status_code=400,
            detail="Please enter a message."
        )

    history = [
        item
        for item in request.history[-12:]

        if item.get("role") in ("user", "assistant")
        and isinstance(item.get("content"), str)
    ]

    try:

        reply = generate_chat_reply(
            message,
            history
        )

        return {
            "success": True,
            "reply": reply
        }

    except Exception as error:

        print(f"GenomeBot error: {error}")

        raise HTTPException(
            status_code=502,
            detail="GenomeBot could not generate a response. Please try again."
        )
