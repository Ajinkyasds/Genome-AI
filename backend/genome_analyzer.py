from Bio import SeqIO
from collections import Counter
from pathlib import Path
import statistics

IUPAC = set("ACGTRYSWKMBDHVN")
CANONICAL = set("ATGC")

def analyze_fasta_files(files):
    sequences = []
    for file_path in files:
        try:
            for record in SeqIO.parse(str(file_path), "fasta"):
                sequence = str(record.seq).upper()
                if sequence:
                    sequences.append({
                        "id": record.id,
                        "description": record.description,
                        "sequence": sequence,
                        "file": Path(file_path).name
                    })
        except Exception as error:
            print(f"Could not read {file_path}: {error}")

    counts = Counter()
    sequence_details = []
    total_length = 0
    iupac_counts = Counter()
    unsupported_counts = Counter()

    for item in sequences:
        s = item["sequence"]
        length = len(s)
        total_length += length
        counts.update(base for base in s if base in CANONICAL)

        ambiguous = sum(base not in CANONICAL and base in IUPAC for base in s)
        unsupported = sum(base not in IUPAC for base in s)
        iupac_counts.update(base for base in s if base in IUPAC and base not in CANONICAL)
        unsupported_counts.update(base for base in s if base not in IUPAC)

        sequence_details.append({
            "id": item["id"],
            "description": item["description"],
            "length": length,
            "file": item["file"],
            "valid_bases": sum(base in CANONICAL for base in s),
            "ambiguous_bases": ambiguous,
            "unsupported_bases": unsupported,
            "contains_ambiguous_bases": ambiguous > 0,
            "contains_unsupported_symbols": unsupported > 0
        })

    canonical_count = sum(counts.values())
    ambiguous_count = sum(iupac_counts.values())
    unsupported_count = sum(unsupported_counts.values())
    gc_count = counts["G"] + counts["C"]
    at_count = counts["A"] + counts["T"]

    gc = gc_count / canonical_count * 100 if canonical_count else 0
    at = at_count / canonical_count * 100 if canonical_count else 0
    lengths = [item["length"] for item in sequence_details]

    return {
        "sequence_count": len(sequences),
        "genome_length": total_length,
        "base_counts": {base: counts[base] for base in "ATGC"},
        "gc_percentage": round(gc, 2),
        "at_percentage": round(at, 2),
        "gc_at_ratio": round(gc_count / at_count, 4) if at_count else None,
        "sequence_details": sequence_details,
        "canonical_base_count": canonical_count,
        "ambiguous_bases": ambiguous_count,
        "unsupported_bases": unsupported_count,
        "iupac_ambiguous_counts": dict(iupac_counts),
        "unsupported_symbol_counts": dict(unsupported_counts),
        "canonical_base_percentages": {
            base: round(counts[base] / canonical_count * 100, 2)
            if canonical_count else 0 for base in "ATGC"
        },
        "structure": {
            "minimum_record_length": min(lengths) if lengths else 0,
            "maximum_record_length": max(lengths) if lengths else 0,
            "average_record_length": round(statistics.mean(lengths), 2) if lengths else 0,
            "record_lengths": lengths
        },
        "validation": {
            "records_checked": len(sequences),
            "records_with_ambiguous_bases": sum(d["ambiguous_bases"] > 0 for d in sequence_details),
            "records_with_unsupported_symbols": sum(d["unsupported_bases"] > 0 for d in sequence_details),
            "validation_status": "issues_found" if ambiguous_count or unsupported_count else "no_issues_detected"
        }
    }
