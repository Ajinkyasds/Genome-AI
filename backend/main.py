from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .ai_engine import generate_genome_insight, is_ai_configured
from .genome_analyzer import analyze_fasta_files
from .genome_database import GENOME_DATABASE, get_genome_files, search_genome

app=FastAPI(title="GenomeAI",description="Educational genomic intelligence API",version="2.0")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=False,allow_methods=["*"],allow_headers=["*"])

@app.get("/")
def home(): return {"application":"GenomeAI","status":"online","docs":"/docs"}

@app.get("/health")
def health(): return {"status":"online","application":"GenomeAI","engine":"Bioinformatics analysis engine","version":"2.0","ai_configured":is_ai_configured()}

@app.get("/search")
def search(name:str):
    genome=search_genome(name)
    if genome is None: return {"found":False,"query":name}
    files=get_genome_files(genome)
    return {"found":True,"genome":genome,"reference_file_available":bool(files),"reference_files":[f.name for f in files]}

@app.get("/organism")
def organism(name:str):
    genome=search_genome(name)
    if genome is None: raise HTTPException(status_code=404,detail="Organism profile not found.")
    files=get_genome_files(genome)
    return {"success":True,"genome":genome,"reference_file_available":bool(files),"reference_files":[f.name for f in files]}

@app.get("/organisms")
def organisms():
    return {"count":len(GENOME_DATABASE),"organisms":[{"scientific_name":g["scientific_name"],"common_name":g["common_name"],"group":g["group"],"reference_file_available":bool(get_genome_files(g))} for g in GENOME_DATABASE.values()]}

@app.get("/analyze")
def analyze(name:str):
    genome=search_genome(name)
    if genome is None: raise HTTPException(status_code=404,detail="Organism not found.")
    files=get_genome_files(genome)
    if not files: raise HTTPException(status_code=404,detail="No local reference genome file found for this organism.")
    analysis=analyze_fasta_files(files)
    return {"success":True,"organism":genome["scientific_name"],"common_name":genome["common_name"],"group":genome["group"],"reference_assembly":genome["reference_assembly"],"source":genome["source"],"files_used":[f.name for f in files],"analysis":analysis}

@app.get("/ai-insight")
def ai_insight(name:str,module:str="Genome Summary"):
    genome=search_genome(name)
    if genome is None: raise HTTPException(status_code=404,detail="Organism not found.")
    files=get_genome_files(genome)
    if not files: raise HTTPException(status_code=404,detail="No local reference genome file found for this organism.")
    analysis=analyze_fasta_files(files)
    return generate_genome_insight(genome,analysis,module)
