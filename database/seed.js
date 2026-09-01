const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'nmm.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) =>
  new Promise((res, rej) => db.run(sql, params, function (err) { if (err) rej(err); else res({ id: this.lastID, changes: this.changes }); }));
const execAll = (sql) =>
  new Promise((res, rej) => db.exec(sql, (err) => { if (err) rej(err); else res(); }));
const get = (sql, params = []) =>
  new Promise((res, rej) => db.get(sql, params, (err, row) => { if (err) rej(err); else res(row); }));

async function seed() {
  console.log('Seeding NUMMF database...');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await execAll(schema);
  await execAll('DELETE FROM cluster_members; DELETE FROM mappings; DELETE FROM clusters; DELETE FROM national_codes; DELETE FROM matches; DELETE FROM reviews; DELETE FROM material_embeddings; DELETE FROM audit_logs; DELETE FROM materials;');
  console.log('Cleared old data.');

  const mats = [
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-101', desc: 'SS Pipe 25mm', spec: 'Seamless, Schedule 40', tech: 'Grade SS304, OD 25mm, Length 6m', type: 'pipe', grade: 'SS304', dim: '25', du: 'mm', len: '6', lu: 'm', pr: null, pu: null, std: 'ASME B36.10', uom: 'METER', cat: 'Pipes & Tubes' },
    { cpse: 'CPSE-B (Power)', code: 'B-205', desc: 'Stainless Steel Tube 25 MM', spec: 'SS Grade 304, Seamless tube', tech: 'Grade 304, Diameter 25mm, Length 6000mm', type: 'pipe', grade: '304 SS', dim: '25', du: 'mm', len: '6000', lu: 'mm', pr: null, pu: null, std: 'ASME B36.10', uom: 'METER', cat: 'Pipes & Tubes' },
    { cpse: 'CPSE-C (Steel)', code: 'C-330', desc: 'S.S. PIPE DIA 25', spec: 'Seamless, Grade 304, Schedule 40', tech: 'Dia 25mm, Length 6 meter, SS304', type: 'pipe', grade: 'SS304', dim: '25', du: 'mm', len: '6', lu: 'm', pr: null, pu: null, std: 'ASME B36.10', uom: 'METER', cat: 'Pipes & Tubes' },
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-102', desc: 'Carbon Steel Globe Valve 50mm', spec: 'Cast steel globe valve, Class 150', tech: 'Grade WCB, DN 50mm, Class 150, API 6D', type: 'valve', grade: 'WCB', dim: '50', du: 'mm', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'API 6D', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-B (Power)', code: 'B-206', desc: 'CS Globe Valve DN50', spec: 'Flanged globe valve class 150', tech: 'DN 50mm, Rating 150#, API 6D', type: 'valve', grade: 'Carbon Steel WCB', dim: '50', du: 'mm', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'API 6D', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-D (Mining)', code: 'D-501', desc: 'GLOBE VALVE CS 50 NB CL150', spec: 'CS globe valve body WCB class 150', tech: '50 NB, Class 150, WCB, API 6D', type: 'valve', grade: 'WCB', dim: '50', du: 'NB', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'API 6D', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-201', desc: 'Gskt Spwnd 150NB CS ASME B16.20', spec: 'Spiral wound gasket outer ring CS', tech: 'Dimension 150NB, Rating 150LBS, ASME B16.20', type: 'gasket', grade: 'CS', dim: '150', du: 'NB', len: null, lu: null, pr: '150', pu: 'LBS', std: 'ASME B16.20', uom: 'PIECE', cat: 'Gaskets' },
    { cpse: 'CPSE-B (Power)', code: 'B-304', desc: 'Spiral Wound Gasket 150 NB Carbon Steel', spec: 'Standard 150NB spiral gasket CS', tech: '150NB CS ASME B16.20 Gasket', type: 'gasket', grade: 'CS', dim: '150', du: 'NB', len: null, lu: null, pr: '150', pu: 'LBS', std: 'ASME B16.20', uom: 'PIECE', cat: 'Gaskets' },
    { cpse: 'CPSE-C (Steel)', code: 'C-401', desc: 'Flange Slip On 80NB Class 150 ASME B16.5', spec: 'Slip-on carbon steel flange A105', tech: 'Size 80NB, Class 150, ASTM A105', type: 'flange', grade: 'A105', dim: '80', du: 'NB', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'ASME B16.5', uom: 'PIECE', cat: 'Flanges' },
    { cpse: 'CPSE-D (Mining)', code: 'D-112', desc: 'SORF Flange 80NB A105 Class 150', spec: 'Slip-on raised face flange A105 carbon steel', tech: 'Flange 80NB class 150 standard B16.5', type: 'flange', grade: 'A105', dim: '80', du: 'NB', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'ASME B16.5', uom: 'PIECE', cat: 'Flanges' },
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-301', desc: 'Elbow 90 Deg 50NB SS304 SCH40', spec: '90 degree seamless elbow SS304 schedule 40', tech: '50NB, 90 degree LR elbow, SS304, ASME B16.9', type: 'elbow', grade: 'WP304', dim: '50', du: 'NB', len: null, lu: null, pr: null, pu: null, std: 'ASME B16.9', uom: 'PIECE', cat: 'Fittings' },
    { cpse: 'CPSE-E (Defence)', code: 'E-091', desc: '90 DEG ELBOW SS-304 50 NB', spec: 'LR elbow 50NB SS304 seamless', tech: 'Material SS304, 50NB, 90D LR Elbow', type: 'elbow', grade: 'SS304', dim: '50', du: 'NB', len: null, lu: null, pr: null, pu: null, std: 'ASME B16.9', uom: 'PIECE', cat: 'Fittings' },
    { cpse: 'CPSE-B (Power)', code: 'B-401', desc: 'Hex Bolt M24 x 100mm Grade 8.8', spec: 'High strength hex bolt galvanised', tech: 'M24 x 100mm, Grade 8.8, IS:1367', type: 'bolt', grade: 'GRADE 8.8', dim: '24', du: 'mm', len: '100', lu: 'mm', pr: null, pu: null, std: 'IS 1367', uom: 'PIECE', cat: 'Fasteners' },
    { cpse: 'CPSE-C (Steel)', code: 'C-502', desc: 'BOLT HEX M24 X 100 GR8.8', spec: 'Hex bolt M24x100mm gr 8.8 zinc plated', tech: 'M24, 100mm length, Grade 8.8, IS1367', type: 'bolt', grade: '8.8', dim: '24', du: 'mm', len: '100', lu: 'mm', pr: null, pu: null, std: 'IS 1367', uom: 'PIECE', cat: 'Fasteners' },
    { cpse: 'CPSE-E (Defence)', code: 'E-201', desc: 'M24 Hex Bolt 100mm Grade8.8 IS1367', spec: 'Hex bolt M24 x 100 high tensile', tech: 'M24 x 100 GR 8.8 bolt IS:1367', type: 'bolt', grade: 'GRADE 8.8', dim: '24', du: 'mm', len: '100', lu: 'mm', pr: null, pu: null, std: 'IS 1367', uom: 'PIECE', cat: 'Fasteners' },
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-103', desc: 'Ball Valve SS316 25mm 150 Full Bore', spec: 'Full bore SS316 ball valve threaded', tech: '25mm, 150 LB, SS316, Full bore, BS 5351', type: 'valve', grade: 'SS316', dim: '25', du: 'mm', len: null, lu: null, pr: '150', pu: 'LBS', std: 'BS 5351', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-D (Mining)', code: 'D-211', desc: 'BALL VALVE SS316 25MM CLASS 150', spec: 'SS316 full bore ball valve 25mm', tech: 'Material 316 SS, 25mm, 150 LB, Full Port', type: 'valve', grade: '316 SS', dim: '25', du: 'mm', len: null, lu: null, pr: '150', pu: 'LBS', std: 'BS 5351', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-B (Power)', code: 'B-207', desc: 'Carbon Steel Pipe 100mm ASTM A106', spec: 'Seamless CS pipe grade B', tech: 'OD 100mm, Length 6m, ASTM A106 Grade B', type: 'pipe', grade: 'A106 GR.B', dim: '100', du: 'mm', len: '6', lu: 'm', pr: null, pu: null, std: 'ASTM A106', uom: 'METER', cat: 'Pipes & Tubes' },
    { cpse: 'CPSE-C (Steel)', code: 'C-111', desc: 'CS PIPE 100 NB SEAMLESS A106 GRB', spec: 'Carbon steel seamless pipe schedule 40', tech: '100NB, Seamless, ASTM A106 GrB, 6m', type: 'pipe', grade: 'A106 GR.B', dim: '100', du: 'mm', len: '6', lu: 'm', pr: null, pu: null, std: 'ASTM A106', uom: 'METER', cat: 'Pipes & Tubes' },
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-104', desc: 'Pressure Gauge 0-10 Bar 1/4 NPT SS Casing', spec: 'Bourdon tube pressure gauge 0-10 bar', tech: 'Range 0-10 bar, SS316 casing, 1/4 NPT, Dia 100mm', type: 'gauge', grade: 'SS316', dim: '100', du: 'mm', len: null, lu: null, pr: '10', pu: 'BAR', std: 'EN 837-1', uom: 'PIECE', cat: 'Instrumentation' },
    { cpse: 'CPSE-E (Defence)', code: 'E-301', desc: 'PG 10BAR 100DIA SS316 1/4NPT', spec: 'Pressure gauge 10bar SS casing 100mm dial', tech: '0 to 10 Bar, 100mm dial, SS316, 1/4 NPT bottom', type: 'gauge', grade: 'SS316', dim: '100', du: 'mm', len: null, lu: null, pr: '10', pu: 'BAR', std: 'EN 837-1', uom: 'PIECE', cat: 'Instrumentation' },
    { cpse: 'CPSE-B (Power)', code: 'B-601', desc: 'Weld Neck Flange 100NB Class 300 A105', spec: 'WNRF Carbon steel flange 100NB', tech: '100NB, CL300, ASTM A105, ASME B16.5', type: 'flange', grade: 'A105', dim: '100', du: 'NB', len: null, lu: null, pr: '300', pu: 'CLASS', std: 'ASME B16.5', uom: 'PIECE', cat: 'Flanges' },
    { cpse: 'CPSE-E (Defence)', code: 'E-401', desc: 'WN FLANGE 100 NB A105 300 B16.5', spec: 'Weld neck raised face flange A105', tech: 'WNRF Flange 100NB, ASTM A105, CL 300, B16.5', type: 'flange', grade: 'A105', dim: '100', du: 'NB', len: null, lu: null, pr: '300', pu: 'CLASS', std: 'ASME B16.5', uom: 'PIECE', cat: 'Flanges' },
    { cpse: 'CPSE-C (Steel)', code: 'C-331', desc: 'Industrial Pipe No Specs', spec: null, tech: null, type: null, grade: null, dim: null, du: null, len: null, lu: null, pr: null, pu: null, std: null, uom: 'METER', cat: 'Pipes & Tubes' },
    { cpse: 'CPSE-D (Mining)', code: 'D-999', desc: 'Pump Casing Impeller 150mm Bronze', spec: 'Bronze impeller for centrifugal pump', tech: '150mm OD, Bronze IS:318', type: 'impeller', grade: 'Bronze', dim: '150', du: 'mm', len: null, lu: null, pr: null, pu: null, std: 'IS 318', uom: 'PIECE', cat: 'Rotating Equipment' },
    { cpse: 'CPSE-E (Defence)', code: 'E-501', desc: 'Stainless Steel Wire Mesh 50x50mm', spec: 'SS304 wire mesh 50x50 aperture 3mm wire', tech: '50x50mm aperture, 3mm wire, SS304', type: 'mesh', grade: 'SS304', dim: '50', du: 'mm', len: null, lu: null, pr: null, pu: null, std: null, uom: 'SQM', cat: 'Miscellaneous' },
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-501', desc: 'Tee Equal 50NB SS304 SCH40', spec: 'Equal tee 50NB SS304 seamless', tech: '50NB, Equal Tee, SS304, SCH40, ASME B16.9', type: 'tee', grade: 'WP304', dim: '50', du: 'NB', len: null, lu: null, pr: null, pu: null, std: 'ASME B16.9', uom: 'PIECE', cat: 'Fittings' },
    { cpse: 'CPSE-B (Power)', code: 'B-502', desc: 'EQL TEE SS304 50 NB SEAMLESS', spec: 'Seamless SS304 equal tee 50NB', tech: 'Equal tee 50NB SS304, ASME B16.9', type: 'tee', grade: 'SS304', dim: '50', du: 'NB', len: null, lu: null, pr: null, pu: null, std: 'ASME B16.9', uom: 'PIECE', cat: 'Fittings' },
    { cpse: 'CPSE-C (Steel)', code: 'C-600', desc: 'Reducing Flange 100x50NB A105 Cl150', spec: 'Reducing RF flange 100 to 50NB', tech: '100x50NB, A105, CL150, ASME B16.5', type: 'flange', grade: 'A105', dim: '100', du: 'NB', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'ASME B16.5', uom: 'PIECE', cat: 'Flanges' },
    { cpse: 'CPSE-D (Mining)', code: 'D-601', desc: 'RED FLANGE 100X50 NB A105 150LB', spec: 'Reducing flange 100 to 50NB A105', tech: 'Reducing Flange 100-50NB A105, 150LB, B16.5', type: 'flange', grade: 'A105', dim: '100', du: 'NB', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'ASME B16.5', uom: 'PIECE', cat: 'Flanges' },
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-701', desc: 'Check Valve 80mm CS Swing Type', spec: 'Swing check valve CS 80mm class 150', tech: '80NB, CS WCB, Class 150, Swing type, API 6D', type: 'valve', grade: 'WCB', dim: '80', du: 'mm', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'API 6D', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-E (Defence)', code: 'E-701', desc: 'SWING CHECK VALVE 80NB CS CL150', spec: 'CS swing check valve 80NB class 150', tech: '80NB CS WCB Swing Check Valve Class 150 API 6D', type: 'valve', grade: 'CS WCB', dim: '80', du: 'mm', len: null, lu: null, pr: '150', pu: 'CLASS', std: 'API 6D', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-B (Power)', code: 'B-801', desc: 'Hex Nut M24 Grade 8 IS1367', spec: 'Hex nut M24 grade 8 zinc plated', tech: 'M24, Grade 8, IS 1367, Zinc plated', type: 'nut', grade: 'GRADE 8', dim: '24', du: 'mm', len: null, lu: null, pr: null, pu: null, std: 'IS 1367', uom: 'PIECE', cat: 'Fasteners' },
    { cpse: 'CPSE-C (Steel)', code: 'C-801', desc: 'NUT HEX M24 GR8 IS1367', spec: 'M24 hex nut gr8 zinc plated IS1367', tech: 'M24 hex nut Grade 8 zinc plated IS:1367', type: 'nut', grade: '8', dim: '24', du: 'mm', len: null, lu: null, pr: null, pu: null, std: 'IS 1367', uom: 'PIECE', cat: 'Fasteners' },
    { cpse: 'CPSE-D (Mining)', code: 'D-901', desc: 'Gate Valve 100mm CS Flanged Cl300', spec: 'Gate valve 100NB CS class 300 flanged', tech: '100NB, CS WCB, Flanged, Class 300, API 600', type: 'valve', grade: 'WCB', dim: '100', du: 'mm', len: null, lu: null, pr: '300', pu: 'CLASS', std: 'API 600', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-E (Defence)', code: 'E-901', desc: 'GATE VALVE 100 NB WCB CLASS 300 FLANGED', spec: 'Flanged gate valve CS 100NB 300 API600', tech: '100NB CS WCB, Class 300, Flanged, API 600', type: 'valve', grade: 'CS WCB', dim: '100', du: 'mm', len: null, lu: null, pr: '300', pu: 'CLASS', std: 'API 600', uom: 'PIECE', cat: 'Valves' },
    { cpse: 'CPSE-A (Oil & Gas)', code: 'A-901', desc: 'SS316 Pipe 40mm Schedule 40', spec: 'Seamless SS316 pipe 40mm sch40', tech: 'OD 40mm, SS316, Schedule 40, ASME B36.19', type: 'pipe', grade: 'SS316', dim: '40', du: 'mm', len: '6', lu: 'm', pr: null, pu: null, std: 'ASME B36.19', uom: 'METER', cat: 'Pipes & Tubes' },
    { cpse: 'CPSE-C (Steel)', code: 'C-902', desc: 'STAINLESS STEEL PIPE 316 40 NB SCH 40', spec: 'SS316 seamless pipe 40NB', tech: '40NB, SS316, SCH40, Seamless, ASME B36.19', type: 'pipe', grade: 'SS316', dim: '40', du: 'mm', len: '6', lu: 'm', pr: null, pu: null, std: 'ASME B36.19', uom: 'METER', cat: 'Pipes & Tubes' },
    { cpse: 'CPSE-B (Power)', code: 'B-111', desc: 'Concentric Reducer CS 100x50mm Sch40', spec: 'CS concentric reducer 100 to 50mm', tech: '100x50NB CS, A234 WPB, ASME B16.9', type: 'reducer', grade: 'A234 WPB', dim: '100', du: 'mm', len: null, lu: null, pr: null, pu: null, std: 'ASME B16.9', uom: 'PIECE', cat: 'Fittings' },
    { cpse: 'CPSE-D (Mining)', code: 'D-111', desc: 'REDUCER CONC 100X50 NB A234 WPB', spec: 'Concentric reducer CS 100x50NB', tech: 'A234 WPB, 100x50NB Conc reducer ASME B16.9', type: 'reducer', grade: 'A234 WPB', dim: '100', du: 'mm', len: null, lu: null, pr: null, pu: null, std: 'ASME B16.9', uom: 'PIECE', cat: 'Fittings' }
  ];

  const matIds = {};
  for (const m of mats) {
    const r = await run(
      INSERT INTO materials(cpse_name, original_code, description, specifications, technical_parameters, material_type, material_grade, dimension, dimension_unit, length, length_unit, pressure, pressure_unit, standard_reference, unit_of_measurement, classification, normalized_description, match_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'PENDING'),
      [m.cpse, m.code, m.desc, m.spec || null, m.tech || null, m.type || null, m.grade || null, m.dim || null, m.du || null, m.len || null, m.lu || null, m.pr || null, m.pu || null, m.std || null, m.uom, m.cat, (m.desc || '').toLowerCase().trim()]
    );
    matIds[m.code] = r.id;
    await run('INSERT OR REPLACE INTO material_embeddings (material_id, embedding) VALUES (?,?)', [r.id, JSON.stringify(Array.from({ length: 10 }, () => Math.random()))]);
  }
  console.log('Inserted ' + mats.length + ' materials.');

  const matchDefs = [
    { a: 'A-101', b: 'B-205', sem: 0.97, tech: 0.96, fin: 0.965, result: 'EXACT DUPLICATE', reason: 'Same SS304 pipe 25mm 6m. Only naming differs.', status: 'APPROVED', reviewer: 'admin' },
    { a: 'A-101', b: 'C-330', sem: 0.95, tech: 0.95, fin: 0.95, result: 'EXACT DUPLICATE', reason: 'Same SS304 pipe 25mm 6m. Abbreviation only.', status: 'APPROVED', reviewer: 'reviewer' },
    { a: 'B-205', b: 'C-330', sem: 0.94, tech: 0.96, fin: 0.95, result: 'EXACT DUPLICATE', reason: '6000mm equals 6m. Both SS304 25mm.', status: 'APPROVED', reviewer: 'approver' },
    { a: 'A-102', b: 'B-206', sem: 0.95, tech: 0.97, fin: 0.96, result: 'EXACT DUPLICATE', reason: 'CS WCB globe valve 50mm 150 API 6D. Shorthand differs.', status: 'APPROVED', reviewer: 'reviewer' },
    { a: 'A-102', b: 'D-501', sem: 0.92, tech: 0.94, fin: 0.93, result: 'EQUIVALENT', reason: 'Globe valves CS 50NB CL150 API6D. Reviewer check needed.', status: 'PENDING', reviewer: null },
    { a: 'A-201', b: 'B-304', sem: 0.96, tech: 0.98, fin: 0.97, result: 'EXACT DUPLICATE', reason: 'Spiral wound gasket CS 150NB 150LBS ASME B16.20.', status: 'APPROVED', reviewer: 'reviewer' },
    { a: 'C-401', b: 'D-112', sem: 0.93, tech: 0.97, fin: 0.95, result: 'EXACT DUPLICATE', reason: 'SORF 80NB A105 Class 150 ASME B16.5. SORF=Slip-On Raised Face.', status: 'APPROVED', reviewer: 'approver' },
    { a: 'A-301', b: 'E-091', sem: 0.94, tech: 0.96, fin: 0.95, result: 'EQUIVALENT', reason: '90deg LR elbow SS304/WP304 50NB same standard.', status: 'APPROVED', reviewer: 'reviewer' },
    { a: 'B-401', b: 'C-502', sem: 0.96, tech: 0.97, fin: 0.965, result: 'EXACT DUPLICATE', reason: 'M24x100mm Grade 8.8 bolt IS1367. Identical spec.', status: 'APPROVED', reviewer: 'admin' },
    { a: 'B-401', b: 'E-201', sem: 0.95, tech: 0.96, fin: 0.955, result: 'EXACT DUPLICATE', reason: 'M24x100mm GR8.8 bolt IS1367 same across three CPSEs.', status: 'PENDING', reviewer: null },
    { a: 'A-103', b: 'D-211', sem: 0.93, tech: 0.96, fin: 0.945, result: 'EQUIVALENT', reason: 'Full bore SS316 ball valve 25mm class 150. SS316=316 SS.', status: 'APPROVED', reviewer: 'approver' },
    { a: 'B-207', b: 'C-111', sem: 0.92, tech: 0.95, fin: 0.935, result: 'EXACT DUPLICATE', reason: '100mm CS pipe ASTM A106 GrB 6m. Identical spec.', status: 'APPROVED', reviewer: 'reviewer' },
    { a: 'A-104', b: 'E-301', sem: 0.91, tech: 0.95, fin: 0.93, result: 'EQUIVALENT', reason: 'SS316 pressure gauge 0-10bar 100mm dial 1/4 NPT EN837-1.', status: 'APPROVED', reviewer: 'admin' },
    { a: 'B-601', b: 'E-401', sem: 0.94, tech: 0.97, fin: 0.955, result: 'EXACT DUPLICATE', reason: 'WNRF 100NB A105 Class 300 ASME B16.5. Identical.', status: 'APPROVED', reviewer: 'approver' },
    { a: 'A-501', b: 'B-502', sem: 0.94, tech: 0.96, fin: 0.95, result: 'EXACT DUPLICATE', reason: 'Equal tee 50NB SS304/WP304 seamless ASME B16.9.', status: 'PENDING', reviewer: null },
    { a: 'C-600', b: 'D-601', sem: 0.92, tech: 0.95, fin: 0.935, result: 'EQUIVALENT', reason: '100x50NB reducing flange A105 Cl150 B16.5.', status: 'PENDING', reviewer: null },
    { a: 'A-701', b: 'E-701', sem: 0.93, tech: 0.95, fin: 0.94, result: 'EQUIVALENT', reason: 'CS swing check valve 80NB Class 150 API 6D.', status: 'PENDING', reviewer: null },
    { a: 'B-801', b: 'C-801', sem: 0.95, tech: 0.96, fin: 0.955, result: 'EXACT DUPLICATE', reason: 'M24 hex nut grade 8 IS1367. Both zinc plated.', status: 'PENDING', reviewer: null },
    { a: 'D-901', b: 'E-901', sem: 0.93, tech: 0.95, fin: 0.94, result: 'EQUIVALENT', reason: 'CS gate valve 100NB class 300 flanged API 600.', status: 'PENDING', reviewer: null },
    { a: 'A-901', b: 'C-902', sem: 0.92, tech: 0.95, fin: 0.935, result: 'EXACT DUPLICATE', reason: 'SS316 seamless pipe 40mm SCH40 6m ASME B36.19.', status: 'PENDING', reviewer: null },
    { a: 'B-111', b: 'D-111', sem: 0.93, tech: 0.96, fin: 0.945, result: 'EXACT DUPLICATE', reason: 'A234 WPB concentric reducer 100x50NB ASME B16.9.', status: 'PENDING', reviewer: null },
    { a: 'A-101', b: 'A-901', sem: 0.70, tech: 0.40, fin: 0.55, result: 'DIFFERENT', reason: 'Different grade SS304 vs SS316 and different OD 25mm vs 40mm. NOT equivalent.', status: 'REJECTED', reviewer: 'admin' },
    { a: 'C-331', b: 'A-101', sem: 0.62, tech: 0.10, fin: 0.36, result: 'INSUFFICIENT INFORMATION', reason: 'Industrial Pipe C-331 has no specs. Cannot determine equivalence.', status: 'REJECTED', reviewer: 'reviewer' }
  ];

  for (const m of matchDefs) {
    const comp = JSON.stringify({ material_type: { match: true }, grade: { match: m.tech > 0.8 }, dimension: { match: true }, standard: { match: m.tech > 0.85 } });
    await run(
      INSERT INTO matches(material_a_id, material_b_id, semantic_score, technical_score, final_score, result, reason, comparison, status, reviewed_by, reviewed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?),
      [matIds[m.a], matIds[m.b], m.sem, m.tech, m.fin, m.result, m.reason, comp, m.status, m.reviewer || null, m.reviewer ? new Date().toISOString() : null]
    );
  }
  console.log('Inserted ' + matchDefs.length + ' matches.');

  // Union-Find clustering
  const parent = {};
  const find = (x) => { if (parent[x] === undefined) parent[x] = x; while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { parent[find(a)] = find(b); };
  const allIds = Object.values(matIds);
  allIds.forEach(id => find(id));
  matchDefs.filter(m => m.status === 'APPROVED').forEach(m => union(matIds[m.a], matIds[m.b]));
  const groups = {};
  allIds.forEach(id => { const r = find(id); if (!groups[r]) groups[r] = []; groups[r].push(id); });
  const clusters = Object.values(groups).sort((a, b) => b.length - a.length);

  const meta = {
    'A-101': { cat: 'Pipes & Tubes', std: 'Stainless Steel Pipe, OD 25mm, Grade SS304, Length 6m, Schedule 40, ASME B36.10' },
    'A-102': { cat: 'Valves', std: 'Globe Valve, Carbon Steel WCB, DN 50mm, Class 150, API 6D' },
    'A-201': { cat: 'Gaskets', std: 'Spiral Wound Gasket, Carbon Steel, 150NB, 150LBS, ASME B16.20' },
    'C-401': { cat: 'Flanges', std: 'Slip-On Raised Face Flange, ASTM A105, 80NB, Class 150, ASME B16.5' },
    'A-301': { cat: 'Fittings', std: '90 Degree Long Radius Elbow, SS304/WP304, 50NB, Schedule 40, ASME B16.9' },
    'B-401': { cat: 'Fasteners', std: 'Hex Bolt, Grade 8.8, M24 x 100mm, IS 1367, Zinc Plated' },
    'A-103': { cat: 'Valves', std: 'Ball Valve, SS316, 25mm, Full Bore, Class 150, BS 5351' },
    'B-207': { cat: 'Pipes & Tubes', std: 'Seamless Pipe, Carbon Steel ASTM A106 Grade B, 100NB, Length 6m' },
    'A-104': { cat: 'Instrumentation', std: 'Pressure Gauge, SS316 Casing, Range 0-10 Bar, Dial 100mm, 1/4in NPT, EN 837-1' },
    'B-601': { cat: 'Flanges', std: 'Weld Neck Raised Face Flange, ASTM A105, 100NB, Class 300, ASME B16.5' }
  };

  let idx = 1;
  for (const group of clusters) {
    const rep = await get('SELECT * FROM materials WHERE id=?', [group[0]]);
    if (!rep) continue;
    const cid = 'CL-' + String(idx).padStart(5, '0');
    const nmc = 'NMC-' + String(idx).padStart(5, '0');
    const repCode = Object.keys(matIds).find(k => matIds[k] === group[0]);
    const m2 = meta[repCode] || { cat: rep.classification || 'General', std: rep.description };
    await run('INSERT INTO national_codes (code,standard_description,category,specifications,status) VALUES (?,?,?,?,?)', [nmc, m2.std, m2.cat, rep.specifications || '', 'ACTIVE']);
    const conf = group.length > 2 ? 0.98 : group.length === 2 ? 0.95 : 0.85;
    await run('INSERT INTO clusters (id,national_code,standardized_description,category,confidence,status) VALUES (?,?,?,?,?,?)', [cid, nmc, m2.std, m2.cat, conf, 'APPROVED']);
    for (const mid of group) {
      await run('INSERT INTO cluster_members (cluster_id,material_id) VALUES (?,?)', [cid, mid]);
      const st = group.length > 1 ? 'APPROVED' : 'PENDING';
      await run('UPDATE materials SET national_code=?,match_status=? WHERE id=?', [nmc, st, mid]);
      const mr = await get('SELECT cpse_name,original_code FROM materials WHERE id=?', [mid]);
      if (mr) await run('INSERT INTO mappings (national_code,cpse_name,original_code,material_id,status) VALUES (?,?,?,?,?)', [nmc, mr.cpse_name, mr.original_code, mid, 'ACTIVE']);
    }
    idx++;
  }
  console.log('Created ' + (idx - 1) + ' clusters and NMCs.');

  const logs = [
    ['sap-connector', 'Material Uploaded', matIds['A-101'], 'PENDING', 'SAP Auto-Sync pulled A-101 from CPSE-A'],
    ['sap-connector', 'Material Uploaded', matIds['B-205'], 'PENDING', 'SAP Auto-Sync pulled B-205 from CPSE-B'],
    ['admin', 'Upload', null, 'SUCCESS', 'Batch import of 40 demo material records completed'],
    ['system', 'Normalize', null, 'SUCCESS', 'NLP text normalization executed on all material descriptions'],
    ['system', 'Match', null, 'SUCCESS', 'AI pipeline run complete. Found 23 match candidates.'],
    ['reviewer', 'Approve', matIds['A-101'], 'APPROVED', 'Verified SS304 pipe 25mm 6m identical across CPSE-A, B, C'],
    ['reviewer', 'Approve', matIds['A-102'], 'APPROVED', 'Confirmed CS WCB Globe Valve DN50 Class 150 API6D — same item'],
    ['reviewer', 'Approve', matIds['A-201'], 'APPROVED', 'Gasket 150NB spiral wound CS — verified identical per ASME B16.20'],
    ['approver', 'Approve', matIds['C-401'], 'APPROVED', 'SORF flange 80NB A105 cl150 — confirmed per B16.5 check'],
    ['admin', 'Approve', matIds['B-401'], 'APPROVED', 'M24x100mm Gr8.8 bolt IS1367 across CPSE-B and CPSE-C — identical'],
    ['approver', 'NMC Created', null, 'SUCCESS', '10 National Material Codes NMC-00001 to NMC-00010 registered'],
    ['manager', 'Mapping Modified', matIds['A-101'], 'SUCCESS', 'Traceability mapping updated for NMC-00001. 3 CPSE codes linked'],
    ['system', 'Reject', matIds['C-331'], 'REJECTED', 'Insufficient data: Industrial Pipe C-331 flagged for enrichment'],
    ['approver', 'Approve', matIds['A-103'], 'APPROVED', 'SS316 ball valve 25mm confirmed equivalent across CPSE-A and CPSE-D'],
    ['reviewer', 'Approve', matIds['B-207'], 'APPROVED', 'CS pipe 100NB A106 GrB verified identical across CPSE-B and CPSE-C']
  ];
  for (const [user, action, mid, dec, comment] of logs) {
    await run('INSERT INTO audit_logs (username,action,material_id,decision,comment) VALUES (?,?,?,?,?)', [user, action, mid || null, dec, comment]);
  }
  console.log('Inserted ' + logs.length + ' audit log entries.');

  const uc = await get('SELECT count(*) as c FROM users');
  if (uc.c === 0) {
    const users = [['admin', 'admin123', 'ADMIN', 'System Administrator'], ['manager', 'manager123', 'MANAGER', 'Data Manager'], ['reviewer', 'reviewer123', 'REVIEWER', 'Match Reviewer'], ['approver', 'approver123', 'APPROVER', 'Senior Approver'], ['viewer', 'viewer123', 'VIEWER', 'Guest Viewer']];
    for (const u of users) await run('INSERT INTO users (username,password,role,full_name) VALUES (?,?,?,?)', u);
    console.log('Seeded default users.');
  }

  db.close();
  console.log('\nSeed complete! ' + mats.length + ' materials, ' + matchDefs.length + ' matches, ' + (idx - 1) + ' clusters & NMCs.');
}

seed().catch(err => { console.error('Seed failed:', err.message); db.close(); process.exit(1); });
