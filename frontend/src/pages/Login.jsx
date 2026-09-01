import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, UserSquare } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('reviewer');
  const [password, setPassword] = useState('reviewer123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDemoAccountSelect = (roleName) => {
    setUsername(roleName);
    setPassword(`${roleName}123`);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const validUsers = {
      admin: { role: 'ADMIN', fullName: 'System Administrator' },
      manager: { role: 'MANAGER', fullName: 'Data Manager' },
      reviewer: { role: 'REVIEWER', fullName: 'Match Reviewer' },
      approver: { role: 'APPROVER', fullName: 'Senior Approver' },
      viewer: { role: 'VIEWER', fullName: 'Guest Viewer' }
    };

    if (validUsers[username] && password === `${username}123`) {
      const userInfo = {
        username,
        role: validUsers[username].role,
        fullName: validUsers[username].fullName
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      navigate('/');
    } else {
      setError('Invalid username or password. Use demo account shortcuts below.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>NUMMF</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            National Unified Material Master Framework
          </p>
          <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Govt. CPSE Standardizing Gateway
          </span>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            border: '1px solid #fee2e2',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                required
              />
              <UserSquare style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '18px' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
                required
              />
              <KeyRound style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '18px' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ padding: '12px', fontSize: '0.95rem', justifyContent: 'center' }}>
            Secure Sign In
          </button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
            Demo Quick Access Shortcuts
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {['admin', 'manager', 'reviewer', 'approver', 'viewer'].map((role) => (
              <button
                key={role}
                onClick={() => handleDemoAccountSelect(role)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
                onMouseOver={(e) => e.target.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
