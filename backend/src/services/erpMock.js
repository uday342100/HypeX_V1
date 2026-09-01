const erpMock = {
  getConnectionStatus: () => {
    return {
      status: "Connected (Demo)",
      lastSync: new Date().toISOString(),
      provider: "SAP R/3 & S/4HANA Enterprise Gateway",
      activeCpseCount: 4,
      latency: "12ms"
    };
  },
  
  pullMaterials: async () => {
    return [
      {
        cpse_name: "CPSE A — Oil & Gas",
        original_code: "ERP-VALV-001",
        description: "Carbon Steel Ball Valve 50mm Class 150",
        specifications: "API 6D certified",
        technical_parameters: "DN50, Rating 150",
        material_type: "valve",
        material_grade: "CS",
        dimension: "50",
        dimension_unit: "mm",
        pressure: "150",
        pressure_unit: "CLASS",
        standard_reference: "API 6D",
        unit_of_measurement: "SET",
        classification: "Valves"
      },
      {
        cpse_name: "CPSE C — Steel",
        original_code: "STEEL-PIPE-990",
        description: "SS 304 Pipe 25mm 6m",
        specifications: "Seamless Schedule 40",
        technical_parameters: "Length 6m, Dia 25mm",
        material_type: "pipe",
        material_grade: "SS304",
        dimension: "25",
        dimension_unit: "mm",
        length: "6",
        length_unit: "m",
        standard_reference: "ASME B16.9",
        unit_of_measurement: "METER",
        classification: "Pipes & Tubes"
      }
    ];
  },
  
  pushMappings: async (mappings) => {
    return {
      status: "SUCCESS",
      synchronizedCount: mappings.length,
      timestamp: new Date().toISOString(),
      erpLogs: mappings.map(m => `[ERP Sync] Mapped ${m.cpse_name} code '${m.original_code}' to National Code '${m.national_code}'`)
    };
  }
};

module.exports = erpMock;
