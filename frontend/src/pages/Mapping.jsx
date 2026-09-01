import React, { useState, useEffect } from 'react';
import { GitBranch, Search, RefreshCw } from 'lucide-react';
import { getMappings } from '../services/api';

const Mapping = () => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cpseFilter, setCpseFilter] = useState('');

  const loadMappings = async () => {
    try {
      setLoading(true);
      const res = await getMappings();
      setMappings(res);
    } catch (err) {
      console.error('Error fetching mappings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const filteredMappings = mappings.filter(m => {
    const term = search.toLowerCase();
    const matchSearch = m.national_code.toLowerCase().includes(term) ||
      m.original_code.toLowerCase().includes(term) ||
      m.original_description.toLowerCase().includes(term);
      
    const matchCpse = cpseFilter ? m.cpse_name === cpseFilter : true;
    return matchSearch && matchCpse;
  });

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Traceability & Mapping Matrix</h2>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '18px' }} />
          <input
            type="text"
            placeholder="Search by Original Code, Standard Code, Description..."
            className="form-input"
            style={{ paddingLeft: '38px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={cpseFilter}
          onChange={(e) => setCpseFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
        >
          <option value="">All CPSE Owners</option>
          <option value="CPSE A — Oil & Gas">CPSE A</option>
          <option value="CPSE B — Power">CPSE B</option>
          <option value="CPSE C — Steel">CPSE C</option>
          <option value="CPSE D — Mining">CPSE D</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <GitBranch className="animate-spin" style={{ color: '#2563eb' }} />
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>National Code (NMC)</th>
                  <th>CPSE Owner</th>
                  <th>Original CPSE Code</th>
                  <th>Original Description</th>
                  <th>Sync Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No mappings matching filters found.
                    </td>
                  </tr>
                ) : (
                  filteredMappings.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 800, color: '#2563eb' }}>{m.national_code}</td>
                      <td style={{ fontSize: '0.825rem', color: '#64748b' }}>{m.cpse_name}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{m.original_code}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.original_description}>
                        {m.original_description}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>
                          {m.status}
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

export default Mapping;
