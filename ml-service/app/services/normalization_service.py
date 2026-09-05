import re
from typing import Dict

ABBREVIATIONS: Dict[str, str] = {
    r'\bss\b': 'stainless steel',
    r'\bs\.s\.\b': 'stainless steel',
    r'\bcs\b': 'carbon steel',
    r'\bc\.s\.\b': 'carbon steel',
    r'\bms\b': 'mild steel',
    r'\bm\.s\.\b': 'mild steel',
    r'\bgi\b': 'galvanized iron',
    r'\bg\.i\.\b': 'galvanized iron',
    r'\bdi\b': 'ductile iron',
    r'\bd\.i\.\b': 'ductile iron',
    r'\bpvc\b': 'polyvinyl chloride',
    r'\bci\b': 'cast iron',
    r'\bc\.i\.\b': 'cast iron',
    r'\bqty\b': 'quantity',
    r'\bspec\b': 'specification',
    r'\bstd\b': 'standard',
    r'\bthk\b': 'thickness',
    r'\bnd\b': 'nominal diameter',
    r'\bnb\b': 'nominal bore',
    r'\bod\b': 'outer diameter',
    r'\bsch\b': 'schedule',
    r'\bgalv\b': 'galvanized',
    r'\bpc\b': 'piece',
    r'\bpcs\b': 'piece',
    r'\bkg\b': 'kg',
    r'\bkilograms?\b': 'kg',
    r'\bmeters?\b': 'm',
    r'\bmillimeters?\b': 'mm',
    r'\bmm\b': 'mm',
    r'\bmtrs?\b': 'm',
    r'\bvalv\b': 'valve',
    r'\bgskt\b': 'gasket',
    r'\bspwnd\b': 'spiral wound',
    r'\bdia\b': 'diameter',
}


def normalize_description(text: str) -> str:
    if not text:
        return ""

    normalized = text.lower()

    normalized = re.sub(
        r'(\d+(?:\.\d+)?)\s*(mm|m|inch|inches|nb|dn|kg|pcs|pc|v|w|wog|api|ansi|class|meter|meters|millimeter|millimeters)\b',
        r'\1 \2',
        normalized,
    )

    for pattern, replacement in ABBREVIATIONS.items():
        normalized = re.sub(pattern, replacement, normalized)

    normalized = normalized.replace('-', ' ').replace('/', ' ').replace('_', ' ').replace(',', ' ')
    normalized = re.sub(r'[^\w\s\.]', ' ', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()

    return normalized