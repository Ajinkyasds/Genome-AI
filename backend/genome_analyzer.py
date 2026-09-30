from Bio import SeqIO

def analyze_fasta_files(files):
    sequences = []
    for file_path in files:
        try:
            for record in SeqIO.parse(str(file_path), "fasta"):
                sequence = str(record.seq).upper()
                if sequence:
                    sequences.append({"id": record.id, "description": record.description, "sequence": sequence, "file": file_path.name})
        except Exception as error:
            print(f"Could not read {file_path}: {error}")
    unique = {}
    for item in sequences:
        unique.setdefault(item["sequence"], item)
    sequences = list(unique.values())
    total_length = count_a = count_t = count_g = count_c = 0
    valid = set("ATGC")
    sequence_details = []
    for item in sequences:
        s=item["sequence"]
        total_length += len(s); count_a += s.count("A"); count_t += s.count("T"); count_g += s.count("G"); count_c += s.count("C")
        valid_count=sum(base in valid for base in s)
        sequence_details.append({"id":item["id"],"description":item["description"],"length":len(s),"file":item["file"],"valid_bases":valid_count,"contains_ambiguous_bases":valid_count != len(s)})
    gc=((count_g+count_c)/total_length*100) if total_length else 0
    return {"sequence_count":len(sequences),"genome_length":total_length,"base_counts":{"A":count_a,"T":count_t,"G":count_g,"C":count_c},"gc_percentage":round(gc,2),"sequence_details":sequence_details}
