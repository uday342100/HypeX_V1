import re
from typing import Dict, Any, Optional

PRODUCT_TYPES = [
    'pipe', 'tube', 'tubing', 'valve', 'gasket', 'flange', 'bolt', 'nut',
    'elbow', 'tee', 'reducer', 'coupling', 'gauge', 'meter', 'cable',
    'wire', 'fitting', 'plate', 'sheet', 'bar'
]
MATERIALS = [
    'stainless steel', 'carbon steel', 'mild steel', 'cast iron',
    'ductile iron', 'galvanized iron', 'brass', 'copper', 'pvc',
    'steel', 'bronze', 'aluminum', 'monel', 'inconel'
]
GRADES = [
    '304', '316', '304l', '316l', 'ss304', 'ss316', 'a106', 'a105',
    'a234', 'a182', 'gr.b', 'gr. b', 'grade b', 'f304', 'f316'
]
STANDARDS = [
    r'asme\s+b\d+\.\d+', r'api\s+\w+', r'astm\s+[a-z]\d+',
    r'ansi\s+b\d+\.\d+', r'bs\s+\d+'
]


def extract_attributes(description: str, normalized_desc: Optional[str] = None) -> Dict[str, Any]:
    desc = normalized_desc if normalized_desc else description.lower()
    desc_raw = description.lower()

    result: Dict[str, Any] = {
        "product_type": None,
        "material": None,
        "material_grade": None,
        "dimension": None,
        "dimension_unit": None,
        "length": None,
        "length_unit": None,
        "pressure": None,
        "pressure_unit": None,
        "standard_reference": None,
    }

    for pt in PRODUCT_TYPES:
        if re.search(r'\b' + re.escape(pt) + r's?\b', desc):
            result["product_type"] = pt
            break

    for mat in MATERIALS:
        if re.search(r'\b' + re.escape(mat) + r'\b', desc):
            result["material"] = mat
            break
    if not result["material"]:
        tokens = desc_raw.split()
        if 'ss' in tokens or 's.s.' in desc_raw:
            result["material"] = 'stainless steel'
        elif 'cs' in tokens or 'c.s.' in desc_raw:
            result["material"] = 'carbon steel'
        elif 'ms' in tokens or 'm.s.' in desc_raw:
            result["material"] = 'mild steel'
        elif 'gi' in tokens or 'g.i.' in desc_raw:
            result["material"] = 'galvanized iron'

    for gr in GRADES:
        if re.search(r'\b' + re.escape(gr) + r'\b', desc):
            result["material_grade"] = gr.upper()
            break
    if not result["material_grade"]:
        match_grade = re.search(r'\b(gr|grade|gr\.)\s*([a-z0-9]+)\b', desc)
        if match_grade:
            result["material_grade"] = f"GRADE {match_grade.group(2).upper()}"

    for std_pat in STANDARDS:
        match_std = re.search(std_pat, desc)
        if match_std:
            result["standard_reference"] = match_std.group(0).upper()
            break
    if not result["standard_reference"]:
        match_std = re.search(r'\b(asme|api|astm|ansi|bs|is|din|iso)\s*([a-z0-9\.\/]+)\b', desc)
        if match_std:
            result["standard_reference"] = f"{match_std.group(1).upper()} {match_std.group(2).upper()}"

    dim_pattern = r'\b(\d+(?:\s+\d+\/\d+)?|\d+\/\d+|\d+(?:\.\d+)?)\s*(mm|inch|inches|nb|dn|nominal\s+bore|nominal\s+diameter|\")\b'
    dim_match = re.search(dim_pattern, desc)
    if dim_match:
        result["dimension"] = dim_match.group(1).strip()
        unit = dim_match.group(2).strip()
        if unit in ['"', 'inch', 'inches']:
            result["dimension_unit"] = 'inch'
        elif unit in ['nb', 'nominal bore']:
            result["dimension_unit"] = 'NB'
        elif unit in ['dn', 'nominal diameter']:
            result["dimension_unit"] = 'DN'
        else:
            result["dimension_unit"] = 'mm'
    else:
        dn_match = re.search(r'\b(dn|nb)\s*(\d+)\b', desc)
        if dn_match:
            result["dimension"] = dn_match.group(2)
            result["dimension_unit"] = dn_match.group(1).upper()

    length_pattern = r'\b(\d+(?:\.\d+)?)\s*(m|meter|meters|mm|millimeters|length)\b'
    for match in re.finditer(length_pattern, desc):
        val = match.group(1)
        unit = match.group(2)
        if result["dimension"] == val and result["dimension_unit"] == unit:
            continue
        result["length"] = val
        if unit in ['m', 'meter', 'meters']:
            result["length_unit"] = 'm'
        elif unit in ['mm', 'millimeters']:
            result["length_unit"] = 'mm'
        break

    pressure_patterns = [
        r'\bclass\s*(\d+)\b',
        r'\b(\d+)\s*(lbs|lb|pn|wog|psi)\b',
        r'\bpn\s*(\d+)\b',
        r'\b(\d+)\s*#\b'
    ]
    for pattern in pressure_patterns:
        pmatch = re.search(pattern, desc)
        if pmatch:
            if len(pmatch.groups()) == 1:
                result["pressure"] = pmatch.group(1)
                if 'class' in pattern:
                    result["pressure_unit"] = 'CLASS'
                elif '#' in pattern:
                    result["pressure_unit"] = 'LBS'
                elif 'pn' in pattern:
                    result["pressure_unit"] = 'PN'
            else:
                result["pressure"] = pmatch.group(1)
                result["pressure_unit"] = pmatch.group(2).upper()
            break

    return result