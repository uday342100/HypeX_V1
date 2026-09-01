import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, PlusCircle, Database, HelpCircle } from 'lucide-react';
import { uploadMaterials, addMaterial, seedDemoDataset } from '../services/api';

const Upload = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('import');
  const [fileContent, setFileContent] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    cpse_name: 'CPSE A — Oil & Gas',
    original_code: '',
    description: '',
    specifications: '',
    technical_parameters: '',
    material_type: '',
    material_grade: '',
    dimension: '',
    dimension_unit: 'mm',
    length: '',
    length_unit: 'm',
    standard_reference: '',
    unit_of_measurement: 'PIECE',
    classification: ''
  });

  // Custom CSV parser to handle quotes and commas properly
  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++; // Skip \n
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    return lines;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      let rows = [];
      const errors = [];

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          rows = Array.isArray(parsed) ? parsed : [parsed];
        } else if (file.name.endsWith('.csv')) {
          const parsedLines = parseCSV(text);
          if (parsedLines.length > 0) {
            const headers = parsedLines[0].map(h => h.trim().toLowerCase());
            
            // Map CSV rows into key-value objects
            for (let i = 1; i < parsedLines.length; i++) {
              const line = parsedLines[i];
              if (line.length === 1 && line[0] === '') continue; // Skip blank lines
              
              const item = {};
              headers.forEach((header, index) => {
                item[header] = line[index] ? line[index].trim() : '';
              });
              rows.push(item);
            }
          }
        }

        // Validate preview data
        const validated = rows.map((r, idx) => {
          const rowErrors = [];
          if (!r.cpse_name) rowErrors.push('Missing cpse_name');
          if (!r.original_code) rowErrors.push('Missing original_code');
          if (!r.description) rowErrors.push('Missing description');
          
          if (rowErrors.length > 0) {
            errors.push(`Row ${idx + 1}: ${rowErrors.join(', ')}`);
          }
          return r;
        });

        setPreviewRows(validated);
        setValidationErrors(errors);
        setFileContent(validated);
      } catch (err) {
        alert('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!fileContent || fileContent.length === 0) return;
    try {
      setLoading(true);
      const res = await uploadMaterials(fileContent);
      setUploadStatus(`SUCCESS: Seeded ${res.count} records into the catalog!`);
      setPreviewRows([]);
      setFileContent(null);
      setTimeout(() => navigate('/materials'), 1500);
    } catch (err) {
      setUploadStatus('ERROR: Upload failed. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await addMaterial(manualForm);
      alert('Material record uploaded successfully!');
      setManualForm({
        cpse_name: 'CPSE A — Oil & Gas',
        original_code: '',
        description: '',
        specifications: '',
        technical_parameters: '',
        material_type: '',
        material_grade: '',
        dimension: '',
        dimension_unit: 'mm',
        length: '',
        length_unit: 'm',
        standard_reference: '',
        unit_of_measurement: 'PIECE',
        classification: ''
      });
      navigate('/materials');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setLoading(true);
      const res = await seedDemoDataset();
      alert(`Demo catalog successfully initialized with ${res.seededCount} records!`);
      navigate('/materials');
    } catch (err) {
      alert('Demo Seeder Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Data Ingestion Portal</h2>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('import')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'import' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'import' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          File Import (CSV/JSON)
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'manual' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'manual' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Manual Entry Form
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'demo' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'demo' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Demo Datasets Seeder
        </button>
      </div>

      {/* Tab Content: File Import */}
      {activeTab === 'import' && (
        <div>
          <div className="card" style={{ textAlign: 'center', padding: '40px', border: '2px dashed #cbd5e1' }}>
            <UploadCloud style={{ width: '48px', height: '48px', color: '#94a3b8', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Upload Material Masters File</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
              Supports structured CSV and JSON formats containing CPSE original records.
            </p>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer'
                }}
              />
              <button className="btn btn-primary">Choose CSV / JSON File</button>
            </div>
          </div>

          {/* Validation Feed & Previews */}
          {previewRows.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
                <span>File Validation Preview</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>({previewRows.length} rows parsed)</span>
              </h3>

              {validationErrors.length > 0 ? (
                <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fde047', borderRadius: '8px', color: '#854d0e', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', gap: '8px' }}>
                  <AlertTriangle style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Data Validation Warnings:</div>
                    <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                      {validationErrors.slice(0, 5).map((e, idx) => <li key={idx}>{e}</li>)}
                      {validationErrors.length > 5 && <li>...and {validationErrors.length - 5} more warnings.</li>}
                    </ul>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle style={{ width: '20px' }} />
                  <span style={{ fontWeight: 600 }}>Validation Complete: All rows contain required mapping fields.</span>
                </div>
              )}

              <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>CPSE</th>
                      <th>Original Code</th>
                      <th>Description</th>
                      <th>Spec</th>
                      <th>Grade</th>
                      <th>Dimension</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.cpse_name || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{row.original_code || '-'}</td>
                        <td>{row.description || '-'}</td>
                        <td>{row.specifications || '-'}</td>
                        <td>{row.material_grade || '-'}</td>
                        <td>{row.dimension || '-'} {row.dimension_unit || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="btn btn-success"
                >
                  Confirm and Sync Database ({previewRows.length} Items)
                </button>
                <button
                  onClick={() => {
                    setPreviewRows([]);
                    setFileContent(null);
                  }}
                  className="btn btn-secondary"
                >
                  Discard File
                </button>
              </div>
            </div>
          )}

          {uploadStatus && (
            <div className="card" style={{ 
              backgroundColor: uploadStatus.includes('SUCCESS') ? '#ecfdf5' : '#fef2f2',
              color: uploadStatus.includes('SUCCESS') ? '#047857' : '#b91c1c',
              border: '1px solid currentColor',
              padding: '16px',
              fontWeight: 600
            }}>
              {uploadStatus}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Manual Form */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="card animated-fadeIn" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 className="card-title">Add Material Record</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">CPSE Enterprise</label>
              <select
                value={manualForm.cpse_name}
                onChange={(e) => setManualForm({ ...manualForm, cpse_name: e.target.value })}
                className="form-input"
                required
              >
                <option value="CPSE A — Oil & Gas">CPSE A — Oil & Gas</option>
                <option value="CPSE B — Power">CPSE B — Power</option>
                <option value="CPSE C — Steel">CPSE C — Steel</option>
                <option value="CPSE D — Mining">CPSE D — Mining</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Original Material Code</label>
              <input
                type="text"
                placeholder="e.g. A101"
                className="form-input"
                value={manualForm.original_code}
                onChange={(e) => setManualForm({ ...manualForm, original_code: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Raw Material Description</label>
            <input
              type="text"
              placeholder="e.g. SS Pipe 25mm 6m length"
              className="form-input"
              value={manualForm.description}
              onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Specifications (Auxiliary)</label>
              <input
                type="text"
                placeholder="e.g. Schedule 40 seamless"
                className="form-input"
                value={manualForm.specifications}
                onChange={(e) => setManualForm({ ...manualForm, specifications: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Classification / Category</label>
              <input
                type="text"
                placeholder="e.g. Pipes & Tubes"
                className="form-input"
                value={manualForm.classification}
                onChange={(e) => setManualForm({ ...manualForm, classification: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Product Type</label>
              <input
                type="text"
                placeholder="e.g. pipe"
                className="form-input"
                value={manualForm.material_type}
                onChange={(e) => setManualForm({ ...manualForm, material_type: e.target.value.toLowerCase() })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <input
                type="text"
                placeholder="e.g. SS304"
                className="form-input"
                value={manualForm.material_grade}
                onChange={(e) => setManualForm({ ...manualForm, material_grade: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">UoM</label>
              <input
                type="text"
                placeholder="e.g. METER"
                className="form-input"
                value={manualForm.unit_of_measurement}
                onChange={(e) => setManualForm({ ...manualForm, unit_of_measurement: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 2 }} className="form-group">
                <label className="form-label">Dimension Value</label>
                <input
                  type="text"
                  placeholder="e.g. 25"
                  className="form-input"
                  value={manualForm.dimension}
                  onChange={(e) => setManualForm({ ...manualForm, dimension: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }} className="form-group">
                <label className="form-label">Unit</label>
                <input
                  type="text"
                  className="form-input"
                  value={manualForm.dimension_unit}
                  onChange={(e) => setManualForm({ ...manualForm, dimension_unit: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 2 }} className="form-group">
                <label className="form-label">Length Value</label>
                <input
                  type="text"
                  placeholder="e.g. 6"
                  className="form-input"
                  value={manualForm.length}
                  onChange={(e) => setManualForm({ ...manualForm, length: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }} className="form-group">
                <label className="form-label">Unit</label>
                <input
                  type="text"
                  className="form-input"
                  value={manualForm.length_unit}
                  onChange={(e) => setManualForm({ ...manualForm, length_unit: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '200px', justifyContent: 'center' }}
          >
            <PlusCircle style={{ width: '18px' }} />
            <span>{loading ? 'Uploading...' : 'Save Material'}</span>
          </button>
        </form>
      )}

      {/* Tab Content: Demo seed */}
      {activeTab === 'demo' && (
        <div className="card animated-fadeIn" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
          <Database style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Load National Demo Catalog</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
            Initializes the SQLite database with 40+ realistic materials from different CPSEs. It sets up the core demonstration groups:
          </p>
          <div style={{ textAlign: 'left', background: '#f8fafc', padding: '16px', borderRadius: '8px', fontSize: '0.85rem', color: '#334155', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '8px' }}>✓ <strong>Group 1:</strong> SS Pipe dia 25mm matching (A101/B205/C330).</div>
            <div style={{ marginBottom: '8px' }}>✓ <strong>Group 2:</strong> CS Globe Valve DN50 matching (A102/B206).</div>
            <div style={{ marginBottom: '8px' }}>✓ <strong>Group 3 (Trap):</strong> Steel Pipe (A103-SS vs B207-Carbon Steel) - must remain rejected.</div>
            <div style={{ marginBottom: '8px' }}>✓ <strong>Group 4 (Review):</strong> Different names (A104-Gauge vs B208-Pipe).</div>
            <div>✓ <strong>Group 5 (Missing):</strong> Industrial Pipe (C331) - triggers insufficient attributes flags.</div>
          </div>
          <button
            onClick={handleLoadDemo}
            disabled={loading}
            className="btn btn-success"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            {loading ? 'Populating Database...' : 'Seed Catalog Now'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Upload;
