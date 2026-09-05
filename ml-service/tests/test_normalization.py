import pytest
from app.services.normalization_service import normalize_description


class TestNormalization:
    def test_ss_expands_to_stainless_steel(self):
        assert normalize_description("SS Pipe 25mm") == "stainless steel pipe 25 mm"

    def test_ms_expands_to_mild_steel(self):
        assert normalize_description("MS Bolt M16") == "mild steel bolt m16"

    def test_cs_expands_to_carbon_steel(self):
        assert normalize_description("CS Valve 50mm") == "carbon steel valve 50 mm"

    def test_gi_expands_to_galvanized_iron(self):
        assert normalize_description("GI Pipe") == "galvanized iron pipe"

    def test_dia_expands_to_diameter(self):
        assert normalize_description("Pipe Dia 25") == "pipe diameter 25"

    def test_mm_unit_spacing(self):
        assert normalize_description("25mm") == "25 mm"
        assert normalize_description("25MM") == "25 mm"
        assert normalize_description("25 mm") == "25 mm"

    def test_inch_unit_spacing(self):
        assert normalize_description("2inch") == "2 inch"
        assert normalize_description('2"') == '2'

    def test_punctuation_cleanup(self):
        assert normalize_description("SS Pipe, 25mm - Schedule 40") == "stainless steel pipe 25 mm schedule 40"

    def test_whitespace_normalization(self):
        assert normalize_description("  SS    Pipe  ") == "stainless steel pipe"

    def test_empty_string(self):
        assert normalize_description("") == ""
        assert normalize_description(None) == ""

    def test_preserves_technical_codes(self):
        result = normalize_description("M16x50 Class 150 SCH40")
        assert "m16x50" in result
        assert "class 150" in result
        assert "sch40" in result

    def test_abbreviation_case_insensitive(self):
        assert normalize_description("ss pipe") == "stainless steel pipe"
        assert normalize_description("SS PIPE") == "stainless steel pipe"
        assert normalize_description("Ss Pipe") == "stainless steel pipe"