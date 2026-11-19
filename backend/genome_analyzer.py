from collections import Counter
from pathlib import Path

IUPAC = set("ACGTRYSWKMBDHVN")
CANONICAL = set("ATGC")


def _analyze_fasta_files_uncached(files):
    counts = Counter()
    iupac_counts = Counter()
    unsupported_counts = Counter()

    sequence_details = []
    total_length = 0
    sequence_count = 0

    def finish_record(record):
        nonlocal total_length, sequence_count

        if record is None or record["length"] == 0:
            return

        sequence_count += 1
        total_length += record["length"]

        sequence_details.append({
            "id": record["id"],
            "description": record["description"],
            "length": record["length"],
            "file": record["file"],
            "valid_bases": record["valid_bases"],
            "ambiguous_bases": record["ambiguous_bases"],
            "unsupported_bases": record["unsupported_bases"],
            "contains_ambiguous_bases": record["ambiguous_bases"] > 0,
            "contains_unsupported_symbols": record["unsupported_bases"] > 0
        })

    for file_path in files:
        record = None

        try:
            with open(file_path, "r", encoding="ascii", errors="replace") as fasta:
                for line in fasta:
                    line = line.strip()

                    if not line:
                        continue

                    if line.startswith(">"):
                        finish_record(record)

                        description = line[1:].strip()
                        identifier = description.split()[0] if description else ""

                        record = {
                            "id": identifier,
                            "description": description,
                            "file": Path(file_path).name,
                            "length": 0,
                            "valid_bases": 0,
                            "ambiguous_bases": 0,
                            "unsupported_bases": 0
                        }
                        continue

                    if record is None:
                        continue

                    chunk = "".join(line.split()).upper()

                    if not chunk:
                        continue

                    record["length"] += len(chunk)

                    canonical = [base for base in chunk if base in CANONICAL]
                    ambiguous = [base for base in chunk if base in IUPAC and base not in CANONICAL]
                    unsupported = [base for base in chunk if base not in IUPAC]

                    counts.update(canonical)
                    iupac_counts.update(ambiguous)
                    unsupported_counts.update(unsupported)

                    record["valid_bases"] += len(canonical)
                    record["ambiguous_bases"] += len(ambiguous)
                    record["unsupported_bases"] += len(unsupported)

            finish_record(record)

        except Exception as error:
            print(f"Could not read {file_path}: {error}")

    canonical_count = sum(counts.values())
    ambiguous_count = sum(iupac_counts.values())
    unsupported_count = sum(unsupported_counts.values())

    gc_count = counts["G"] + counts["C"]
    at_count = counts["A"] + counts["T"]

    gc = gc_count / canonical_count * 100 if canonical_count else 0
    at = at_count / canonical_count * 100 if canonical_count else 0

    lengths = [item["length"] for item in sequence_details]

    return {
        "sequence_count": sequence_count,
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
            "average_record_length": round(sum(lengths) / len(lengths), 2) if lengths else 0,
            "record_lengths": lengths
        },
        "validation": {
            "records_checked": sequence_count,
            "records_with_ambiguous_bases": sum(
                d["ambiguous_bases"] > 0 for d in sequence_details
            ),
            "records_with_unsupported_symbols": sum(
                d["unsupported_bases"] > 0 for d in sequence_details
            ),
            "validation_status": (
                "issues_found" if ambiguous_count or unsupported_count
                else "no_issues_detected"
            )
        }
    }


import hashlib
import json
import os


def analyze_fasta_files(files):
    files = [Path(f) for f in files]

    signatures = []
    for file_path in sorted(files, key=lambda x: str(x)):
        stat = file_path.stat()
        signatures.append({
            "path": str(file_path.resolve()),
            "size": stat.st_size,
            "modified": stat.st_mtime_ns
        })

    key = hashlib.sha256(
        json.dumps(signatures, sort_keys=True).encode()
    ).hexdigest()

    cache_dir = Path(__file__).parent / "analysis_cache"
    cache_file = cache_dir / f"{key}.json"

    try:
        if cache_file.exists():
            with cache_file.open("r", encoding="utf-8") as f:
                result = json.load(f)
            print("CACHE HIT:", cache_file.name)
            return result
    except (OSError, ValueError):
        pass

    print("CACHE MISS: Running genome analysis...")
    result = _analyze_fasta_files_uncached(files)

    try:
        cache_dir.mkdir(parents=True, exist_ok=True)
        temporary_file = cache_file.with_suffix(".tmp")

        with temporary_file.open("w", encoding="utf-8") as f:
            json.dump(result, f, separators=(",", ":"))

        os.replace(temporary_file, cache_file)
        print("CACHE SAVED:", cache_file.name)

    except (OSError, TypeError) as error:
        print("Cache could not be saved:", error)

    return result
