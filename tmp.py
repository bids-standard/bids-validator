import json
from pathlib import Path
import ruamel.yaml
from rich import print

yaml = ruamel.yaml.YAML()
yaml.indent(mapping=2, sequence=4, offset=2)


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

for author in zenodo['creators']:
    name = author["name"].split(", ")
    author["given-names"] = name[0]
    author["family-names"] = name[1]
    author.pop("name")
    print(author)


write_citation(citation[])