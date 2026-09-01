import re

# Abbreviation replacement dictionary for physical materials and units
ABBREVIATIONS = {
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
    """
    Cleans and standardizes the material description:
    1. Lowercase translation
    2. Space padding around dimension metrics
    3. Abbreviation expansions
    4. Delimiter cleanup (hyphens, slashes, and redundant spaces)
    """
    if not text:
        return ""
    
    # Lowercase
    normalized = text.lower()
    
    # Insert space between numeric value and standard unit identifiers (e.g. "25mm" -> "25 mm")
    normalized = re.sub(r'(\d+(?:\.\d+)?)\s*(mm|m|inch|inches|nb|dn|kg|pcs|pc|v|w|wog|api|ansi|class|meter|meters|millimeter|millimeters)\b', r'\1 \2', normalized)
    
    # Expand abbreviations
    for pattern, replacement in ABBREVIATIONS.items():
        normalized = re.sub(pattern, replacement, normalized)
        
    # Replace common hyphens, underscores and slashes with space
    normalized = normalized.replace('-', ' ').replace('/', ' ').replace('_', ' ').replace(',', ' ')
    
    # Remove miscellaneous punctuation, preserving decimal points
    normalized = re.sub(r'[^\w\s\.]', ' ', normalized)
    
    # Remove duplicate spaces
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized
