const ORGANISMS = [

    {
        scientific_name: "Saccharomyces cerevisiae",
        common_name: "Baker's yeast",
        group: "Fungus",
        icon: "🧬",
        status: "Reference available"
    },

    {
        scientific_name: "Escherichia coli",
        common_name: "E. coli",
        group: "Bacterium",
        icon: "◈",
        status: "Reference available"
    },

    {
        scientific_name: "Arabidopsis thaliana",
        common_name: "Thale cress",
        group: "Plant",
        icon: "✦",
        status: "Reference available"
    },

    {
        scientific_name: "Drosophila melanogaster",
        common_name: "Fruit fly",
        group: "Animal",
        icon: "◇",
        status: "Reference available"
    }

];


const DOCS = {

    pipeline: {

        title: "The GenomeAI Analysis Pipeline",

        text:
            "GenomeAI separates genomic computation from AI interpretation. Reference sequence data is processed by the bioinformatics layer first. Statistics and comparisons are calculated from the sequence, after which structured results can be passed to an AI interpretation layer."

    },


    fasta: {

        title: "Understanding FASTA",

        text:
            "FASTA is a common format for biological sequence data. A FASTA file contains sequence records, each beginning with an identifier followed by nucleotide or amino-acid sequence data."

    },


    ai: {

        title: "AI Interpretation",

        text:
            "The AI layer is designed to interpret structured computational results rather than invent exact genomic measurements. This separation helps keep calculations reproducible while allowing complex biological information to be explained in accessible language."

    },


    reference: {

        title: "Reference Genomes",

        text:
            "A reference genome provides a standard genomic sequence against which other sequence data can be compared. Reference assemblies are important foundations for computational genomics."

    }

};