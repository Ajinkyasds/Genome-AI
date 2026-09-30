from .ai_engine import generate_genome_insight


test_data = {
    "organism": "Saccharomyces cerevisiae",
    "common_name": "Baker's yeast",
    "group": "Fungus",
    "reference_assembly": "GCF_000146045.2",

    "analysis": {
        "genome_length": 12157105,
        "sequence_count": 17,
        "gc_percentage": 38.15,

        "base_counts": {
            "A": 0,
            "T": 0,
            "G": 0,
            "C": 0
        }
    }
}


result = generate_genome_insight(test_data)

print(result)