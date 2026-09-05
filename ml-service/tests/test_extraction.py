import pytest
from app.services.extraction_service import extract_attributes


class TestExtraction:
    def test_extracts_product_type_pipe(self):
        result = extract_attributes("Stainless Steel Pipe 25mm")
        assert result["product_type"] == "pipe"

    def test_extracts_product_type_valve(self):
        result = extract_attributes("Carbon Steel Valve 50mm")
        assert result["product_type"] == "valve"

    def test_extracts_product_type_gasket(self):
        result = extract_attributes("Spiral Wound Gasket 150 NB")
        assert result["product_type"] == "gasket"

    def test_extracts_stainless_steel_material(self):
        result = extract_attributes("SS Pipe 25mm")
        assert result["material"] == "stainless steel"

    def test_extracts_carbon_steel_material(self):
        result = extract_attributes("CS Valve 50mm")
        assert result["material"] == "carbon steel"

    def test_extracts_mild_steel_material(self):
        result = extract_attributes("MS Bolt M16")
        assert result["material"] == "mild steel"

    def test_extracts_grade_304(self):
        result = extract_attributes("SS304 Pipe 25mm")
        assert result["material_grade"] == "SS304"

    def test_extracts_grade_316(self):
        result = extract_attributes("Stainless Steel 316 Pipe")
        assert result["material_grade"] == "316"

    def test_extracts_dimension_mm(self):
        result = extract_attributes("Pipe 25 mm")
        assert result["dimension"] == "25"
        assert result["dimension_unit"] == "mm"

    def test_extracts_dimension_inch(self):
        result = extract_attributes('Pipe 2 inch')
        assert result["dimension"] == "2"
        assert result["dimension_unit"] == "inch"

    def test_extracts_dimension_nb(self):
        result = extract_attributes("Pipe 50 NB")
        assert result["dimension"] == "50"
        assert result["dimension_unit"] == "NB"

    def test_extracts_dimension_dn(self):
        result = extract_attributes("Pipe DN50")
        assert result["dimension"] == "50"
        assert result["dimension_unit"] == "DN"

    def test_extracts_length_meters(self):
        result = extract_attributes("Pipe 25mm 6 m")
        assert result["length"] == "6"
        assert result["length_unit"] == "m"

    def test_extracts_length_mm(self):
        result = extract_attributes("Pipe 25mm 6000 mm")
        assert result["length"] == "6000"
        assert result["length_unit"] == "mm"

    def test_extracts_pressure_class(self):
        result = extract_attributes("Valve Class 150")
        assert result["pressure"] == "150"
        assert result["pressure_unit"] == "CLASS"

    def test_extracts_pressure_pn(self):
        result = extract_attributes("Valve PN16")
        assert result["pressure"] == "16"
        assert result["pressure_unit"] == "PN"

    def test_extracts_standard_reference(self):
        result = extract_attributes("Pipe ASME B16.9")
        assert result["standard_reference"] == "ASME B16.9"

    def test_extracts_api_standard(self):
        result = extract_attributes("Valve API 6D")
        assert result["standard_reference"] == "API 6D"

    def test_returns_none_for_missing_attributes(self):
        result = extract_attributes("Industrial Pipe")
        assert result["product_type"] == "pipe"
        assert result["material"] is None
        assert result["dimension"] is None

    def test_normalized_desc_used_when_provided(self):
        result = extract_attributes("SS Pipe 25mm", "stainless steel pipe 25 mm")
        assert result["material"] == "stainless steel"
        assert result["dimension"] == "25"