import os
import urllib.request
from pathlib import Path

LIBRARY = Path(os.getenv("GENOME_LIBRARY_PATH", "/tmp/genome_library1"))

GENOMES = {
    "saccharomyces_cerevisiae": (
        "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/146/045/"
        "GCF_000146045.2_R64/GCF_000146045.2_R64_genomic.fna.gz"
    ),
    "escherichia_coli": (
        "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/005/845/"
        "GCF_000005845.2_ASM584v2/GCF_000005845.2_ASM584v2_genomic.fna.gz"
    ),
}

def download_genomes():
    import gzip

    for organism, url in GENOMES.items():
        folder = LIBRARY / organism
        folder.mkdir(parents=True, exist_ok=True)

        destination = folder / "reference_genome.fna"

        if destination.exists() and destination.stat().st_size > 0:
            print(f"GENOME READY: {organism}")
            continue

        compressed = folder / "reference_genome.fna.gz"
        print(f"DOWNLOADING: {organism}")

        try:
            urllib.request.urlretrieve(url, compressed)

            with gzip.open(compressed, "rb") as source:
                with destination.open("wb") as target:
                    while chunk := source.read(1024 * 1024):
                        target.write(chunk)

            compressed.unlink()
            print(f"DOWNLOAD COMPLETE: {organism}")

        except Exception as error:
            print(f"DOWNLOAD FAILED: {organism}: {error}")
            if compressed.exists():
                compressed.unlink()

if __name__ == "__main__":
    download_genomes()
