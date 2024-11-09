import json
from pathlib import Path
import ruamel.yaml
from rich import print
import collections

yaml = ruamel.yaml.YAML()
yaml.indent(mapping=2, sequence=4, offset=2)
yaml.width = 4096


def load_citation(citation_file: Path) -> dict:
    """Load `CITATION.cff` file."""
    with open(citation_file, "r", encoding="utf8") as input_file:
        return yaml.load(input_file)


def write_citation(citation_file: Path, citation: dict) -> None:
    """Write `CITATION.cff` file."""
    with open(citation_file, "w", encoding="utf8") as output_file:
        return yaml.dump(citation, output_file)
    
with Path(".zenodo.json").open() as f:
    zenodo = json.load(f)

citation = load_citation(Path("CITATION.cff"))
citation["authors"] = []

key_order = ["family-names", "given-names", "orcid", "affiliation"]

for author in zenodo['creators']:
    name = author["name"].split(", ")
    author["given-names"] = name[1]
    author["family-names"] = name[0]
    author.pop("name")
    author =  {k : author[k] for k in key_order if k in author}


    citation["authors"].append(author)


citation["authors"] = sorted(citation["authors"], key=lambda d: d['family-names'])

write_citation(Path("CITATION.cff"), citation)