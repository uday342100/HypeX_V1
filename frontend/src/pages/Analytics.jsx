import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Layers } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { getAnalytics } from '../services/api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const STATUS_COLORS = {
  Approved: '#10b981',
  'Needs Review': '#f59e0b',
  Rejected: '#ef4444',
  Pending: '#6b7280'
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Analytics load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin" style={{ width: '40px', height: '40px', color: '#2563eb' }} />
      </div>
    );
  }

  const charts = data?.charts || {
    materialsByCpse: [],
    duplicatesByCpse: [],
    materialsByCategory: [],
    matchingStatus: [],
    approvalRate: []
  };

  const summary = data?.summary || {
    totalMaterials: 0,
    duplicateMaterials: 0,
    equivalentGroups: 0,
    pendingReviews: 0,
    standardizedMaterials: 0,
    nationalMaterialCodes: 0
  };

  // Compute a standardisation progress ratio
  const progressRate = summary.totalMaterials > 0 ? 
    Math.round((summary.standardizedMaterials / summary.totalMaterials) * 100) : 0;

  return (
    <div>
      <div className="card-title" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>National Unification Analytics Dashboard</h2>
      </div>

      {/* Overview Analytics Banner */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Catalog Standardisation Progress
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981' }}>{progressRate}%</span>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>of inventory standardized</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressRate}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Data Deduplication Ratio
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444' }}>
              {summary.totalMaterials > 0 ? Math.round((summary.duplicateMaterials / summary.totalMaterials) * 100) : 0}%
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>duplicate codes purged</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {summary.duplicateMaterials} duplicate items mapped to {summary.equivalentGroups} unique master codes.
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Unification Efficiency Index
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#2563eb' }}>
              {summary.nationalMaterialCodes > 0 ? (summary.totalMaterials / summary.nationalMaterialCodes).toFixed(2) : 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>items per NMC reference</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Higher values indicate stronger consolidation across enterprises.
          </span>
        </div>
      </div>

      {/* Grid of details charts */}
      <div className="grid-2">
        {/* Chart 1: Duplicates by CPSE */}
        <div className="card">
          <div className="card-title">Duplicate Material Counts by CPSE</div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.duplicatesByCpse}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Duplicate Items" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category volume */}
        <div className="card">
          <div className="card-title">Unification Category Densities</div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.materialsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Total Items" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Chart 3: Human decision rates */}
        <div className="card">
          <div className="card-title">Human-in-the-Loop Audit Decision Ratio</div>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.approvalRate.some(v => v.value > 0) ? charts.approvalRate : [{ name: 'Pending Initial Reviews', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {(charts.approvalRate.some(v => v.value > 0) ? charts.approvalRate : [{ name: 'Pending Initial Reviews', value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Approved' ? '#10b981' : entry.name === 'Rejected' ? '#ef4444' : '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Methodology & Efficiency Metrics
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6', marginBottom: '12px' }}>
            The unification progress measures how successfully raw master inventory items have been mapped to a valid <strong>National Material Code (NMC)</strong>.
          </p>
          <ul style={{ fontSize: '0.85rem', color: '#475569', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Precision Rate:</strong> Cosine similarity checks are reinforced by dual-check attribute validation.</li>
            <li><strong>Clustering Resolution:</strong> Union-Find models bundle multi-CPSE mappings recursively.</li>
            <li><strong>Integration Readiness:</strong> Mappings are prepared for automatic synchronization to backend SAP systems.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
