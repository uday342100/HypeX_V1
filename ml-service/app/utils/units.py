import re
from typing import Tuple, Optional, Any


def parse_float(val_str: Any) -> Optional[float]:
    if val_str is None:
        return None
    if isinstance(val_str, (int, float)):
        return float(val_str)

    val_str = str(val_str).lower().strip()
    if '/' in val_str:
        try:
            if ' ' in val_str:
                parts = val_str.split(' ')
                whole = float(parts[0])
                frac_parts = parts[1].split('/')
                frac = float(frac_parts[0]) / float(frac_parts[1])
                return whole + frac
            else:
                parts = val_str.split('/')
                return float(parts[0]) / float(parts[1])
        except Exception:
            pass

    match = re.search(r'([0-9]+(?:\.[0-9]+)?)', val_str)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return None


def normalize_unit(unit: Optional[str]) -> str:
    if not unit:
        return ""
    u = str(unit).lower().strip()
    for inch_val in ['inch', 'inches', '"', 'in']:
        if inch_val in u:
            return 'inch'
    if 'mm' in u or 'millimeter' in u:
        return 'mm'
    if 'meter' in u or u == 'm':
        return 'm'
    if u in ['nb', 'nominal bore']:
        return 'nb'
    if u in ['dn', 'nominal diameter']:
        return 'dn'
    return u


def check_dimension_equivalence(
    val1: Any, unit1: Any, val2: Any, unit2: Any
) -> Tuple[bool, str]:
    f1 = parse_float(val1)
    f2 = parse_float(val2)

    if f1 is None or f2 is None:
        return True, "MISSING_DATA"

    u1 = normalize_unit(unit1)
    u2 = normalize_unit(unit2)

    if u1 == u2 or not u1 or not u2:
        return abs(f1 - f2) < 0.01, "MATCH" if abs(f1 - f2) < 0.01 else "MISMATCH"

    if u1 == 'inch' and u2 == 'mm':
        converted = f1 * 25.4
        return abs(converted - f2) < 1.0, "MATCH" if abs(converted - f2) < 1.0 else "MISMATCH"
    if u1 == 'mm' and u2 == 'inch':
        converted = f2 * 25.4
        return abs(f1 - converted) < 1.0, "MATCH" if abs(f1 - converted) < 1.0 else "MISMATCH"

    if u1 == 'm' and u2 == 'mm':
        converted = f1 * 1000.0
        return abs(converted - f2) < 1.0, "MATCH" if abs(converted - f2) < 1.0 else "MISMATCH"
    if u1 == 'mm' and u2 == 'm':
        converted = f2 * 1000.0
        return abs(f1 - converted) < 1.0, "MATCH" if abs(f1 - converted) < 1.0 else "MISMATCH"

    return abs(f1 - f2) < 0.01, "MATCH" if abs(f1 - f2) < 0.01 else "MISMATCH"