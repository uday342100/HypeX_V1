import React, { useState, useEffect } from 'react';
import { Layers, Eye, X, Network, FileText, CheckCircle2, History } from 'lucide-react';
import { getClusters, getClusterDetails } from '../services/api';

const Clusters = () => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadClusters = async () => {
    try {
      setLoading(true);
      const res = await getClusters();
      setClusters(res);
    } catch (err) {
      console.error('Error loading clusters:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, []);

  const handleViewDetails = async (clusterId) => {
    try {
      setSelectedClusterId(clusterId);
      setDetailsLoading(true);
      const res = await getClusterDetails(clusterId);
      setDetails(res);
    } catch (err) {
      alert('Error fetching cluster details: ' + err.message);
      setSelectedClusterId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Unification Material Clusters</h2>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Layers className="animate-spin" style={{ color: '#2563eb' }} />
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cluster ID</th>
                  <th>National Code (NMC)</th>
                  <th>Standardized Description</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>CPSE Count</th>
                  <th style={{ textAlign: 'center' }}>Member Codes</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clusters.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No standardized clusters generated yet. Run matches and approve candidates.
                    </td>
                  </tr>
                ) : (
                  clusters.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.id}</td>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{c.national_code}</td>
                      <td>{c.standardized_description}</td>
                      <td><span className="badge badge-pending" style={{ textTransform: 'capitalize' }}>{c.category}</span></td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.cpse_count}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.original_codes_count}</td>
                      <td>
                        <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleViewDetails(c.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <Eye style={{ width: '14px', marginRight: '4px' }} />
                          <span>View Graph</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CLUSTER MEMBERS DRAWER MODAL */}
      {selectedClusterId && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '640px', height: '100vh', background: '#fff', boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', zIndex: 100, padding: '30px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network style={{ color: '#2563eb' }} />
              <span>Cluster Mapping Node: {selectedClusterId}</span>
            </h3>
            <button 
              onClick={() => {
                setSelectedClusterId(null);
                setDetails(null);
              }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X />
            </button>
          </div>

          {detailsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <Layers className="animate-spin" style={{ color: '#2563eb' }} />
            </div>
          ) : (
            details && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Meta details */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                    National Unified Standarization Reference
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2563eb', marginBottom: '4px' }}>
                    {details.cluster.national_code}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                    {details.cluster.standardized_description}
                  </div>
                </div>

                {/* Member items list */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText style={{ width: '16px', color: '#64748b' }} />
                    <span>Mapped CPSE Inventory Items ({details.members.length})</span>
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {details.members.map((m) => (
                      <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 700, color: '#2563eb' }}>{m.cpse_name}</span>
                          <span style={{ fontWeight: 600, color: '#64748b' }}>Code: {m.original_code}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                          {m.description}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                          <div><strong>Grade:</strong> {m.material_grade || '-'}</div>
                          <div><strong>Size:</strong> {m.dimension ? `${m.dimension}${m.dimension_unit}` : '-'}</div>
                          <div><strong>Length:</strong> {m.length ? `${m.length}${m.length_unit}` : '-'}</div>
                          <div><strong>Standard:</strong> {m.standard_reference || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit & Review History */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History style={{ width: '16px', color: '#64748b' }} />
                    <span>Audit Review Logs</span>
                  </h4>

                  {details.history.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '6px', textAlign: 'center' }}>
                      Direct standard mapping. No audit overrides recorded.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {details.history.map((h) => (
                        <div key={h.id} style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <CheckCircle2 style={{ color: '#10b981', flexShrink: 0, width: '18px' }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>Approved Equivalence Edge</div>
                            <div style={{ color: '#64748b', marginTop: '2px' }}>
                              Mapped {h.code_a} ↔ {h.code_b} (Score: {Math.round(h.final_score * 100)}%)
                            </div>
                            {h.reviewer_comment && (
                              <div style={{ fontStyle: 'italic', marginTop: '4px', color: '#334155' }}>
                                "{h.reviewer_comment}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Clusters;
