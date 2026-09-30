from pathlib import Path
from Bio import SeqIO


# ============================================================
# GENOME ANALYSIS ENGINE
# ============================================================

def analyze_fasta_files(files):

    sequences = []

    # --------------------------------------------------------
    # Read all FASTA/FNA records
    # --------------------------------------------------------

    for file_path in files:

        try:

            for record in SeqIO.parse(
                str(file_path),
                "fasta"
            ):

                sequence = str(record.seq).upper()

                if sequence:
                    sequences.append({
                        "id": record.id,
                        "description": record.description,
                        "sequence": sequence,
                        "file": file_path.name
                    })

        except Exception as error:

            print(
                f"Could not read {file_path}: {error}"
            )


    # --------------------------------------------------------
    # Remove duplicate sequence records
    # --------------------------------------------------------

    unique_sequences = {}

    for item in sequences:

        sequence = item["sequence"]

        if sequence not in unique_sequences:

            unique_sequences[sequence] = item


    sequences = list(
        unique_sequences.values()
    )


    # --------------------------------------------------------
    # Calculate statistics
    # --------------------------------------------------------

    total_length = 0

    count_a = 0
    count_t = 0
    count_g = 0
    count_c = 0

    valid_bases = set("ATGC")

    sequence_details = []


    for item in sequences:

        sequence = item["sequence"]

        total_length += len(sequence)

        count_a += sequence.count("A")
        count_t += sequence.count("T")
        count_g += sequence.count("G")
        count_c += sequence.count("C")

        valid_count = sum(
            base in valid_bases
            for base in sequence
        )

        sequence_details.append({
            "id": item["id"],
            "description": item["description"],
            "length": len(sequence),
            "file": item["file"],
            "valid_bases": valid_count,
            "contains_ambiguous_bases":
                valid_count != len(sequence)
        })


    # --------------------------------------------------------
    # GC percentage
    # --------------------------------------------------------

    if total_length > 0:

        gc_percentage = (
            (count_g + count_c)
            / total_length
        ) * 100

    else:

        gc_percentage = 0


    # --------------------------------------------------------
    # Return analysis
    # --------------------------------------------------------

    return {

        "sequence_count":
            len(sequences),

        "genome_length":
            total_length,

        "base_counts": {
            "A": count_a,
            "T": count_t,
            "G": count_g,
            "C": count_c
        },

        "gc_percentage":
            round(gc_percentage, 2),

        "sequence_details":
            sequence_details
    }