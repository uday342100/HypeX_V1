import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Edit, X, Save, RefreshCw } from 'lucide-react';
import { getMaterials, updateMaterial } from '../services/api';

const Materials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [cpseFilter, setCpseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await getMaterials({
        search: searchTerm,
        cpse: cpseFilter,
        status: statusFilter
      });
      setMaterials(data);
    } catch (err) {
      console.error('Error fetching materials:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [searchTerm, cpseFilter, statusFilter]);

  // Sync state if URL query changes
  useEffect(() => {
    const urlQuery = searchParams.get('search') || '';
    if (urlQuery !== searchTerm) {
      setSearchTerm(urlQuery);
    }
  }, [searchParams]);

  const handleEditClick = (mat) => {
    setEditingMaterial({ ...mat });
    setSelectedMaterial(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      await updateMaterial(editingMaterial.id, editingMaterial);
      await loadMaterials();
      setEditingMaterial(null);
    } catch (err) {
      alert('Error updating material: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge badge-approved';
      case 'REVIEW': return 'badge badge-review';
      case 'REJECTED': return 'badge badge-rejected';
      default: return 'badge badge-pending';
    }
  };

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>CPSE Material Master Inventory</h2>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '18px' }} />
          <input
            type="text"
            placeholder="Search by Code, Description, Standard, or Class..."
            className="form-input"
            style={{ paddingLeft: '38px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter style={{ width: '16px', color: '#64748b' }} />
            <select
              value={cpseFilter}
              onChange={(e) => setCpseFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">All CPSEs</option>
              <option value="CPSE A — Oil & Gas">CPSE A</option>
              <option value="CPSE B — Power">CPSE B</option>
              <option value="CPSE C — Steel">CPSE C</option>
              <option value="CPSE D — Mining">CPSE D</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved Mapping</option>
            <option value="REVIEW">Needs Attention</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Materials Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <RefreshCw className="animate-spin" style={{ color: '#2563eb' }} />
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Original Code</th>
                  <th>CPSE Owner</th>
                  <th>Raw Description</th>
                  <th>Grade</th>
                  <th>Dimension</th>
                  <th>Status</th>
                  <th>National Code</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No material records found. Try modifying filters or seeding the database.
                    </td>
                  </tr>
                ) : (
                  materials.map((mat) => (
                    <tr key={mat.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{mat.original_code}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{mat.cpse_name.split('—')[0]}</td>
                      <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={mat.description}>
                        {mat.description}
                      </td>
                      <td>{mat.material_grade || '-'}</td>
                      <td>{mat.dimension ? `${mat.dimension} ${mat.dimension_unit || ''}` : '-'}</td>
                      <td>
                        <span className={getStatusBadgeClass(mat.match_status)}>
                          {mat.match_status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#2563eb' }}>
                        {mat.national_code || '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedMaterial(mat)}
                            className="btn btn-secondary"
                            style={{ padding: '6px', borderRadius: '4px' }}
                            title="View attributes"
                          >
                            <Eye style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button
                            onClick={() => handleEditClick(mat)}
                            className="btn btn-secondary"
                            style={{ padding: '6px', borderRadius: '4px' }}
                            title="Edit details"
                          >
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW DRAWERS / MODALS */}
      {selectedMaterial && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '460px', height: '100vh', background: '#fff', boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', zIndex: 100, padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Material Attributes</h3>
            <button onClick={() => setSelectedMaterial(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>CPSE Owner</td><td>{selectedMaterial.cpse_name}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Original Code</td><td>{selectedMaterial.original_code}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Raw Description</td><td>{selectedMaterial.description}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Normalized</td><td>{selectedMaterial.normalized_description || '-'}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Product Type</td><td>{selectedMaterial.material_type || '-'}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Material/Grade</td><td>{selectedMaterial.material_grade || '-'}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Dimension</td><td>{selectedMaterial.dimension || '-'} {selectedMaterial.dimension_unit}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Length</td><td>{selectedMaterial.length || '-'} {selectedMaterial.length_unit}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Pressure</td><td>{selectedMaterial.pressure || '-'} {selectedMaterial.pressure_unit}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Standard Ref</td><td>{selectedMaterial.standard_reference || '-'}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>UoM</td><td>{selectedMaterial.unit_of_measurement || '-'}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>Classification</td><td>{selectedMaterial.classification || '-'}</td></tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px 0', fontWeight: 600 }}>National Code</td><td style={{ color: '#2563eb', fontWeight: 600 }}>{selectedMaterial.national_code || '-'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingMaterial && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '460px', height: '100vh', background: '#fff', boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', zIndex: 100, padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Material Parameters</h3>
            <button onClick={() => setEditingMaterial(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
          </div>
          <form onSubmit={handleSaveEdit} style={{ flex: 1, overflowY: 'auto' }}>
            <div className="form-group">
              <label className="form-label">Raw Description</label>
              <input type="text" className="form-input" value={editingMaterial.description} onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Product Type</label>
              <input type="text" className="form-input" value={editingMaterial.material_type || ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, material_type: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <input type="text" className="form-input" value={editingMaterial.material_grade || ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, material_grade: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }} className="form-group">
              <div style={{ flex: 1 }}>
                <label className="form-label">Dimension</label>
                <input type="text" className="form-input" value={editingMaterial.dimension || ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, dimension: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Unit</label>
                <input type="text" className="form-input" value={editingMaterial.dimension_unit || ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, dimension_unit: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }} className="form-group">
              <div style={{ flex: 1 }}>
                <label className="form-label">Length</label>
                <input type="text" className="form-input" value={editingMaterial.length || ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, length: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Unit</label>
                <input type="text" className="form-input" value={editingMaterial.length_unit || ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, length_unit: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Standard Reference</label>
              <input type="text" className="form-input" value={editingMaterial.standard_reference || ''} onChange={(e) => setEditingMaterial({ ...editingMaterial, standard_reference: e.target.value })} />
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={saveLoading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <Save style={{ width: '16px' }} />
                <span>{saveLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button type="button" onClick={() => setEditingMaterial(null)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Materials;
