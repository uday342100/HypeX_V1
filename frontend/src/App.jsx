import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout.jsx';

// Lazy-load pages for performance
const Dashboard     = lazy(() => import('./pages/Dashboard.jsx'));
const Materials     = lazy(() => import('./pages/Materials.jsx'));
const Upload        = lazy(() => import('./pages/Upload.jsx'));
const AIMatching    = lazy(() => import('./pages/AIMatching.jsx'));
const MatchReview   = lazy(() => import('./pages/MatchReview.jsx'));
const Clusters      = lazy(() => import('./pages/Clusters.jsx'));
const NationalCodes = lazy(() => import('./pages/NationalCodes.jsx'));
const Mapping       = lazy(() => import('./pages/Mapping.jsx'));
const Analytics     = lazy(() => import('./pages/Analytics.jsx'));
const Login         = lazy(() => import('./pages/Login.jsx'));

// Simple loading spinner
const Loader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'var(--bg-primary, #0a0e1a)',
    color: 'var(--accent-primary, #6366f1)',
    fontSize: '1.2rem',
    gap: '0.75rem'
  }}>
    <div style={{
      width: 32,
      height: 32,
      border: '3px solid rgba(99,102,241,0.2)',
      borderTopColor: 'var(--accent-primary, #6366f1)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    Loading…
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected / main layout routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"      element={<Dashboard />} />
            <Route path="materials"      element={<Materials />} />
            <Route path="upload"         element={<Upload />} />
            <Route path="ai-matching"    element={<AIMatching />} />
            <Route path="match-review"   element={<MatchReview />} />
            <Route path="clusters"       element={<Clusters />} />
            <Route path="national-codes" element={<NationalCodes />} />
            <Route path="mapping"        element={<Mapping />} />
            <Route path="analytics"      element={<Analytics />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
