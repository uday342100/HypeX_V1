import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, RefreshCw, CheckCircle, Play, AlertCircle, ArrowRight } from 'lucide-react';
import { runMatching } from '../services/api';

const AIMatching = () => {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [resultSummary, setResultSummary] = useState(null);

  const pipelineSteps = [
    { title: 'Data Cleaning & Normalization', desc: 'Case lower translation, spelling corrections, and standardizing unit syntax (S.S. -> stainless steel, MM -> mm).' },
    { title: 'Structured Feature Extraction', desc: 'Regular expression parsing to extract product type, grade, diameter sizes, lengths, and ASME standards.' },
    { title: 'Vector Embeddings Generation', desc: 'Computing 384-dimensional dense vectors using the local sentence-transformers models.' },
    { title: 'Cosine Similarity Filtering', desc: 'Generating candidate comparison matches above the base similarity threshold (>= 0.70).' },
    { title: 'Dual-Check Parametric Validation', desc: 'Comparing extracted values. Flagging material, grade, and size mismatches to verify equivalence.' },
    { title: 'Persistence and Clustering Preparation', desc: 'Storing candidates under PENDING status and updating the trace logs.' }
  ];

  const handleStartMatching = async () => {
    try {
      setRunning(true);
      setResultSummary(null);
      
      // Step-by-step visual animation helper
      for (let i = 0; i < pipelineSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Execute backend endpoint
      const res = await runMatching();
      setResultSummary(res);
      setCurrentStep(pipelineSteps.length);
    } catch (err) {
      alert('Error running matching pipeline: ' + err.message);
      setCurrentStep(-1);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>AI Standarization & Matching Pipeline</h2>
      </div>

      <div className="card" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            Run Unified Standardization Pipeline
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px' }}>
            Triggering the pipeline reads all materials in the SQLite database, standardizes descriptions, extracts technical keys, computes dense semantic vectors, and compares pairs to recommend matches.
          </p>
          {!running && currentStep === -1 && (
            <button 
              onClick={handleStartMatching}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              <Play style={{ width: '18px', fill: 'currentColor' }} />
              <span>Execute Standardizing Pipeline</span>
            </button>
          )}
        </div>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyCenter: 'center', flexShrink: 0, justifyContent: 'center' }}>
          <Cpu style={{ width: '56px', height: '56px', color: '#2563eb' }} className={running ? 'animate-spin' : ''} />
        </div>
      </div>

      {/* Progress Board */}
      {(running || currentStep >= 0) && (
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1.05rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            Pipeline Execution Log
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {pipelineSteps.map((step, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              
              let stepIcon = <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{idx + 1}</div>;
              if (isActive) {
                stepIcon = <RefreshCw style={{ width: '24px', height: '24px', color: '#2563eb' }} className="animate-spin" />;
              } else if (isCompleted) {
                stepIcon = <CheckCircle style={{ width: '24px', height: '24px', color: '#10b981', fill: '#ecfdf5' }} />;
              }

              return (
                <div key={idx} style={{ display: 'flex', gap: '16px', opacity: (idx <= currentStep || currentStep === pipelineSteps.length) ? 1 : 0.45, transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {stepIcon}
                    {idx < pipelineSteps.length - 1 && (
                      <div style={{ width: '2px', flex: 1, backgroundColor: isCompleted ? '#10b981' : '#cbd5e1', margin: '4px 0' }}></div>
                    )}
                  </div>
                  <div style={{ paddingBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: isActive ? '#2563eb' : '#0f172a' }}>{step.title}</h4>
                    <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '2px' }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Details Card */}
      {resultSummary && (
        <div className="card animated-fadeIn" style={{ border: '1px solid #a7f3d0', backgroundColor: '#ecfdf5' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
            <CheckCircle style={{ width: '32px', height: '32px', color: '#10b981', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065f46', marginBottom: '6px' }}>
                Pipeline Successfully Completed
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#047857', marginBottom: '16px' }}>
                Processed <strong>{resultSummary.processedCount}</strong> inventory specifications. Generated <strong>{resultSummary.matchesFound}</strong> standardizing candidate pairs under pending status for review.
              </p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => navigate('/matches/review')}
                  className="btn btn-success"
                >
                  <span>Review Candidates</span>
                  <ArrowRight style={{ width: '16px' }} />
                </button>
                <button 
                  onClick={() => {
                    setCurrentStep(-1);
                    setResultSummary(null);
                  }}
                  className="btn btn-secondary"
                  style={{ background: '#fff', color: '#334155' }}
                >
                  Clear Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMatching;
