import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, X, AlertTriangle, MessageSquare, ClipboardCheck, ArrowLeftRight } from 'lucide-react';
import { getMatches, approveMatch, rejectMatch } from '../services/api';

const MatchReview = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await getMatches();
      // Filter only PENDING matches for review
      const pending = data.filter(m => m.status === 'PENDING');
      setMatches(pending);
      if (pending.length > 0) {
        setSelectedMatch(pending[0]);
      } else {
        setSelectedMatch(null);
      }
    } catch (err) {
      console.error('Error loading matches:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleDecision = async (decision) => {
    if (!selectedMatch) return;
    try {
      setSubmitting(true);
      const user = JSON.parse(localStorage.getItem('user')) || { fullName: 'Reviewer' };
      if (decision === 'APPROVE') {
        await approveMatch(selectedMatch.id, comment, user.fullName);
      } else {
        await rejectMatch(selectedMatch.id, comment, user.fullName);
      }
      setComment('');
      // Reload remaining matches
      await loadMatches();
    } catch (err) {
      alert('Error updating match decision: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getResultBadgeClass = (res) => {
    switch (res) {
      case 'EXACT DUPLICATE':
      case 'EQUIVALENT':
        return 'badge badge-approved';
      case 'NEAR DUPLICATE':
      case 'POSSIBLE MATCH':
        return 'badge badge-review';
      case 'INSUFFICIENT INFORMATION':
        return 'badge badge-pending';
      default:
        return 'badge badge-rejected';
    }
  };

  const getCheckSymbol = (checkVal) => {
    if (checkVal === 'MATCH' || checkVal === 'MATCH_CONVERTED') {
      return <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>;
    }
    if (checkVal === 'MISMATCH') {
      return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗</span>;
    }
    return <span style={{ color: '#94a3b8' }}>-</span>;
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
      
      {/* Left Pane: Candidates list */}
      <div className="card" style={{ width: '340px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Matches Review Panel</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{matches.length} Candidates Pending Review</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', flex: 1, alignItems: 'center' }}>
            <RefreshCw className="animate-spin" />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {matches.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No matches pending human review. Run matching or sync demo data first.
              </div>
            ) : (
              matches.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMatch(m);
                    setComment('');
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedMatch?.id === m.id ? '#2563eb' : '#e2e8f0',
                    backgroundColor: selectedMatch?.id === m.id ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>AI confidence: {Math.round(m.final_score * 100)}%</span>
                    <span className={getResultBadgeClass(m.result)} style={{ fontSize: '0.65rem' }}>{m.result.split(' ')[0]}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    {m.original_code_a} ↔ {m.original_code_b}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {m.description_a}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Pane: Comparison Workboard */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedMatch ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '4px' }}>
            
            {/* Header info */}
            <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <span className={getResultBadgeClass(selectedMatch.result)} style={{ marginBottom: '6px' }}>{selectedMatch.result}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  Comparing: {selectedMatch.original_code_a} & {selectedMatch.original_code_b}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>
                  {Math.round(selectedMatch.final_score * 100)}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>AI Match Confidence</div>
              </div>
            </div>

            {/* Side-by-side blocks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 1fr', gap: '20px' }}>
              
              {/* Left Material: CPSE A */}
              <div className="card" style={{ margin: 0 }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>CPSE SOURCE A</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedMatch.cpse_name_a}</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>MATERIAL CODE</strong><div>{selectedMatch.original_code_a}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>RAW DESCRIPTION</strong><div style={{ fontWeight: 500 }}>{selectedMatch.description_a}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>GRADE</strong><div>{selectedMatch.grade_a || '-'}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>DIMENSION</strong><div>{selectedMatch.dimension_a ? `${selectedMatch.dimension_a} ${selectedMatch.unit_a || ''}` : '-'}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>LENGTH</strong><div>{selectedMatch.length_a ? `${selectedMatch.length_a} ${selectedMatch.len_unit_a || ''}` : '-'}</div></div>
                </div>
              </div>

              {/* Middle Validation Checklist */}
              <div className="card" style={{ margin: 0, padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', textAlign: 'center' }}>
                  Attribute Checks
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Product Type</span>
                    <span>{getCheckSymbol(selectedMatch.comparison.product_type)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Material Base</span>
                    <span>{getCheckSymbol(selectedMatch.comparison.material)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Grade Spec</span>
                    <span>{getCheckSymbol(selectedMatch.comparison.grade)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Diameter / Size</span>
                    <span>{getCheckSymbol(selectedMatch.comparison.dimension)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Unit Matching</span>
                    <span>{getCheckSymbol(selectedMatch.comparison.dimension_unit)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Linear Length</span>
                    <span>{getCheckSymbol(selectedMatch.comparison.length)}</span>
                  </div>
                </div>
              </div>

              {/* Right Material: CPSE B */}
              <div className="card" style={{ margin: 0 }}>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>CPSE SOURCE B</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selectedMatch.cpse_name_b}</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>MATERIAL CODE</strong><div>{selectedMatch.original_code_b}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>RAW DESCRIPTION</strong><div style={{ fontWeight: 500 }}>{selectedMatch.description_b}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>GRADE</strong><div>{selectedMatch.grade_b || '-'}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>DIMENSION</strong><div>{selectedMatch.dimension_b ? `${selectedMatch.dimension_b} ${selectedMatch.unit_b || ''}` : '-'}</div></div>
                  <div><strong style={{ color: '#64748b', fontSize: '0.75rem' }}>LENGTH</strong><div>{selectedMatch.length_b ? `${selectedMatch.length_b} ${selectedMatch.len_unit_b || ''}` : '-'}</div></div>
                </div>
              </div>

            </div>

            {/* AI Explanation reasoning */}
            <div className="card" style={{ margin: 0, backgroundColor: '#f8fafc' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
                AI Model Explanation
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#0f172a', lineHeight: '1.6' }}>
                {selectedMatch.reason}
              </p>
            </div>

            {/* Approval Decisions Panel */}
            <div className="card" style={{ margin: 0 }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare style={{ width: '16px' }} />
                  <span>Review Comments / Rejection Details</span>
                </label>
                <textarea
                  placeholder="Insert audit comment (required for rejection)..."
                  className="form-input"
                  rows={2}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleDecision('APPROVE')}
                  disabled={submitting}
                  className="btn btn-success"
                  style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                >
                  <Check style={{ width: '18px' }} />
                  <span>Approve Equivalence mapping</span>
                </button>
                <button
                  onClick={() => handleDecision('REJECT')}
                  disabled={submitting || !comment}
                  className="btn btn-danger"
                  style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                >
                  <X style={{ width: '18px' }} />
                  <span>Reject Candidate Match</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center' }}>
            <ClipboardCheck style={{ width: '64px', height: '64px', color: '#cbd5e1', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#64748b' }}>No Candidates Selection</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px', margin: '4px 0 0 0' }}>
              Select a pending candidate match from the panel on the left to begin human-in-the-loop audit validation.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default MatchReview;
