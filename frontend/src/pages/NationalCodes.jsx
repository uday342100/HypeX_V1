import React, { useState, useEffect } from 'react';
import { Barcode, RefreshCw, Layers } from 'lucide-react';
import { getNationalCodes } from '../services/api';

const NationalCodes = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const res = await getNationalCodes();
      setCodes(res);
    } catch (err) {
      console.error('Error fetching national codes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>National Material Master Codes (NMC)</h2>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Barcode className="animate-spin" style={{ color: '#2563eb' }} />
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>NMC Code</th>
                  <th>Standard Description</th>
                  <th>Category Class</th>
                  <th>Source CPSE Owner(s)</th>
                  <th>Mapped Source Code(s)</th>
                  <th style={{ textAlign: 'center' }}>Total Sources</th>
                  <th>Created Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No National Material Codes registered. Approve equivalence mappings first to run clustering.
                    </td>
                  </tr>
                ) : (
                  codes.map((c) => (
                    <tr key={c.code}>
                      <td style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.95rem' }}>{c.code}</td>
                      <td style={{ fontWeight: 500 }}>{c.standard_description}</td>
                      <td>
                        <span className="badge badge-pending" style={{ textTransform: 'capitalize' }}>
                          {c.category || 'General'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.cpses}>
                        {c.cpses}
                      </td>
                      <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.original_codes}>
                        {c.original_codes}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.original_codes_count}</td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NationalCodes;
