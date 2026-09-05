import re
from typing import List


def clean_whitespace(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def tokenize(text: str) -> List[str]:
    return text.lower().split()


def remove_punctuation(text: str, keep_decimal: bool = True) -> str:
    if keep_decimal:
        return re.sub(r'[^\w\s\.]', ' ', text)
    return re.sub(r'[^\w\s]', ' ', text)