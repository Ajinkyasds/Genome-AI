from pathlib import Path

GENOME_DATABASE = {
    "saccharomyces cerevisiae": {
        "scientific_name": "Saccharomyces cerevisiae",
        "common_name": "Baker's yeast",
        "group": "Fungus",
        "folder": "saccharomyces_cerevisiae",
        "reference_assembly": "GCF_000146045.2",
        "source": "NCBI RefSeq",
        "taxonomy": [
            ("Domain", "Eukaryota"), ("Kingdom", "Fungi"),
            ("Phylum", "Ascomycota"), ("Class", "Saccharomycetes"),
            ("Order", "Saccharomycetales"), ("Family", "Saccharomycetaceae"),
            ("Genus", "Saccharomyces"), ("Species", "Saccharomyces cerevisiae")
        ],
        "summary": "A yeast species widely used in biology and biotechnology education."
    },
    "escherichia coli": {
        "scientific_name": "Escherichia coli",
        "common_name": "E. coli",
        "group": "Bacterium",
        "folder": "escherichia_coli",
        "reference_assembly": "GCF_000005845.2",
        "source": "NCBI RefSeq",
        "taxonomy": [
            ("Domain", "Bacteria"), ("Phylum", "Pseudomonadota"),
            ("Class", "Gammaproteobacteria"), ("Order", "Enterobacterales"),
            ("Family", "Enterobacteriaceae"), ("Genus", "Escherichia"),
            ("Species", "Escherichia coli")
        ],
        "summary": "A bacterial model organism commonly used in genetics and molecular biology."
    },
    "arabidopsis thaliana": {
        "scientific_name": "Arabidopsis thaliana",
        "common_name": "Thale cress",
        "group": "Plant",
        "folder": "arabidopsis_thaliana",
        "reference_assembly": "Reference assembly",
        "source": "NCBI RefSeq",
        "taxonomy": [
            ("Domain", "Eukaryota"), ("Kingdom", "Plantae"),
            ("Phylum", "Tracheophyta"), ("Class", "Magnoliopsida"),
            ("Order", "Brassicales"), ("Family", "Brassicaceae"),
            ("Genus", "Arabidopsis"), ("Species", "Arabidopsis thaliana")
        ],
        "summary": "A small flowering plant used extensively as a model organism in plant biology."
    },
    "drosophila melanogaster": {
        "scientific_name": "Drosophila melanogaster",
        "common_name": "Fruit fly",
        "group": "Animal",
        "folder": "drosophila_melanogaster",
        "reference_assembly": "GCF_000001215.4",
        "source": "NCBI RefSeq",
        "taxonomy": [
            ("Domain", "Eukaryota"), ("Kingdom", "Animalia"),
            ("Phylum", "Arthropoda"), ("Class", "Insecta"),
            ("Order", "Diptera"), ("Family", "Drosophilidae"),
            ("Genus", "Drosophila"), ("Species", "Drosophila melanogaster")
        ],
        "summary": "A classic insect model used in genetics, development and comparative biology."
    },
    "amoeba proteus": {
        "scientific_name": "Amoeba proteus",
        "common_name": "Amoeba",
        "group": "Amoebozoan",
        "folder": "amoeba_proteus",
        "reference_assembly": "Knowledge profile",
        "source": "Educational profile",
        "taxonomy": [
            ("Domain", "Eukaryota"), ("Supergroup", "Amoebozoa"),
            ("Class", "Tubulinea"), ("Order", "Euamoebida"),
            ("Family", "Amoebidae"), ("Genus", "Amoeba"),
            ("Species", "Amoeba proteus")
        ],
        "summary": "A free-living amoebozoan example used to teach cell shape, movement and feeding. Taxonomic rank conventions can vary between educational and modern classification systems."
    }
}

def search_genome(name):
    name = name.lower().strip()
    if name in GENOME_DATABASE:
        return GENOME_DATABASE[name]
    for key, genome in GENOME_DATABASE.items():
        if name in key or name in genome["common_name"].lower():
            return genome
    return None

def find_genome_library():
    backend_folder = Path(__file__).parent
    possible_names = ["genome_library", "genome_library1", "Genome Library", "Genome Library 1"]
    for name in possible_names:
        folder = backend_folder / name
        if folder.exists() and folder.is_dir():
            return folder
    for folder in backend_folder.iterdir():
        if not folder.is_dir():
            continue
        n = folder.name.lower().replace(" ", "_")
        if "genome" in n and "library" in n:
            return folder
    return None

def get_genome_files(genome):
    library = find_genome_library()
    if library is None:
        return []
    organism_folder = library / genome["folder"]
    if not organism_folder.exists():
        return []
    files = []
    for extension in ("*.fna", "*.fasta", "*.fa"):
        files.extend(organism_folder.rglob(extension))
    return files
