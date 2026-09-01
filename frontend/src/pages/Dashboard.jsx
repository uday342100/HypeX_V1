import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Boxes, Layers, Barcode, ClipboardCheck, 
  AlertCircle, HelpCircle, ArrowRight, RefreshCw 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { getAnalytics, seedDemoDataset } from '../services/api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const STATUS_COLORS = {
  Approved: '#10b981',
  'Needs Review': '#f59e0b',
  Rejected: '#ef4444',
  Pending: '#6b7280'
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemoDataset();
      await loadData();
    } catch (err) {
      alert('Error seeding data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin" style={{ width: '40px', height: '40px', color: '#2563eb' }} />
      </div>
    );
  }

  const summary = data?.summary || {
    totalMaterials: 0,
    duplicateMaterials: 0,
    equivalentGroups: 0,
    pendingReviews: 0,
    standardizedMaterials: 0,
    nationalMaterialCodes: 0
  };

  const charts = data?.charts || {
    materialsByCpse: [],
    duplicatesByCpse: [],
    materialsByCategory: [],
    matchingStatus: [],
    approvalRate: []
  };

  const isDbEmpty = summary.totalMaterials === 0;

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', 
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, marginBottom: '6px' }}>
            National Unified Material Master Portal
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '600px' }}>
            AI-driven semantic extraction, attribute alignment, and clustering models working to unify codes and purge duplicate inventory configurations across national CPSE assets.
          </p>
        </div>
        {isDbEmpty && (
          <button 
            onClick={handleSeed} 
            disabled={seeding}
            className="btn btn-success" 
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            {seeding ? 'Initializing...' : 'Load Demo Dataset'}
          </button>
        )}
      </div>

      {isDbEmpty ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <AlertCircle style={{ width: '60px', height: '60px', color: '#f59e0b', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.3rem', color: '#1e293b', marginBottom: '8px' }}>Database Empty</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 24px' }}>
            There are no material records currently loaded in the SQLite database. Please trigger the seeding process above or import your custom files.
          </p>
          <button 
            onClick={handleSeed} 
            disabled={seeding}
            className="btn btn-primary"
          >
            Seeding Now
          </button>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid-3" style={{ marginBottom: '28px' }}>
            {/* KPI 1: Total Materials */}
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Total Materials</div>
                <div className="kpi-value">{summary.totalMaterials}</div>
              </div>
              <div className="kpi-icon-container" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Boxes />
              </div>
            </div>

            {/* KPI 2: Duplicate Materials */}
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Duplicate Materials</div>
                <div className="kpi-value" style={{ color: '#ef4444' }}>{summary.duplicateMaterials}</div>
              </div>
              <div className="kpi-icon-container" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                <AlertCircle />
              </div>
            </div>

            {/* KPI 3: Equivalent Groups */}
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Equivalent Groups</div>
                <div className="kpi-value">{summary.equivalentGroups}</div>
              </div>
              <div className="kpi-icon-container" style={{ backgroundColor: '#f3e8ff', color: '#8b5cf6' }}>
                <Layers />
              </div>
            </div>

            {/* KPI 4: Pending Reviews */}
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Pending Reviews</div>
                <div className="kpi-value" style={{ color: '#f59e0b' }}>{summary.pendingReviews}</div>
              </div>
              <div className="kpi-icon-container" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
                <HelpCircle />
              </div>
            </div>

            {/* KPI 5: Standardized Materials */}
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Standardized Codes</div>
                <div className="kpi-value" style={{ color: '#10b981' }}>{summary.standardizedMaterials}</div>
              </div>
              <div className="kpi-icon-container" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
                <ClipboardCheck />
              </div>
            </div>

            {/* KPI 6: National Codes (NMCs) */}
            <div className="kpi-card">
              <div>
                <div className="kpi-label">National Codes (NMC)</div>
                <div className="kpi-value">{summary.nationalMaterialCodes}</div>
              </div>
              <div className="kpi-icon-container" style={{ backgroundColor: '#e0f7fa', color: '#00838f' }}>
                <Barcode />
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>READY</span>
              <span style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 600 }}>
                Analyze loaded records and run the NLP dual-check mapping engine.
              </span>
            </div>
            <button 
              onClick={() => navigate('/ai-matching')}
              className="btn btn-primary"
            >
              <span>Go to AI Matching</span>
              <ArrowRight style={{ width: '16px' }} />
            </button>
          </div>

          {/* Charts Row 1: Materials by CPSE & Duplicates by CPSE */}
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Materials Distribution by CPSE</div>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.materialsByCpse}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Material Items" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Standardized Matching Status</div>
              <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.matchingStatus.length > 0 ? charts.matchingStatus : [{name: 'Pending', value: 1}]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(charts.matchingStatus.length > 0 ? charts.matchingStatus : [{name: 'Pending', value: 1}]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Category Distribution & Duplicate counts */}
          <div className="grid-2">
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div className="card-title">Materials Distribution by Category</div>
              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.materialsByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Items Count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
