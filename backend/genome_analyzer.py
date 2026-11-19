from Bio import SeqIO

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
                        "file": file_path.name
                    })
        except Exception as error:
            print(f"Could not read {file_path}: {error}")

    valid = set("ATGC")
    counts = {base: 0 for base in "ATGC"}
    total_length = 0
    sequence_details = []

    for item in sequences:
        s = item["sequence"]
        total_length += len(s)
        for base in counts:
            counts[base] += s.count(base)

        valid_count = sum(base in valid for base in s)
        sequence_details.append({
            "id": item["id"],
            "description": item["description"],
            "length": len(s),
            "file": item["file"],
            "valid_bases": valid_count,
            "ambiguous_bases": len(s) - valid_count,
            "contains_ambiguous_bases": valid_count != len(s)
        })

    canonical_count = sum(counts.values())
    ambiguous_count = total_length - canonical_count

    gc = (
        (counts["G"] + counts["C"]) / canonical_count * 100
        if canonical_count else 0
    )

    percentages = {
        base: round(count / canonical_count * 100, 2)
        if canonical_count else 0
        for base, count in counts.items()
    }

    return {
        "sequence_count": len(sequences),
        "genome_length": total_length,
        "base_counts": counts,
        "gc_percentage": round(gc, 2),
        "sequence_details": sequence_details,
        "canonical_base_count": canonical_count,
        "ambiguous_bases": ambiguous_count,
        "canonical_base_percentages": percentages
    }
