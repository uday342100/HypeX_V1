import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Boxes, UploadCloud, Cpu, Layers, 
  Barcode, GitBranch, BarChart3, History, Settings, 
  Search, Bell, LogOut 
} from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  
  // Resolve user info from local storage (or fallback for MVP)
  const user = JSON.parse(localStorage.getItem('user')) || { 
    username: 'reviewer', 
    role: 'REVIEWER', 
    fullName: 'Match Reviewer' 
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard',      path: '/dashboard',      icon: LayoutDashboard },
    { name: 'Materials',      path: '/materials',      icon: Boxes },
    { name: 'Upload',         path: '/upload',         icon: UploadCloud },
    { name: 'AI Matching',    path: '/ai-matching',    icon: Cpu },
    { name: 'Match Review',   path: '/match-review',   icon: History },
    { name: 'Clusters',       path: '/clusters',       icon: Layers },
    { name: 'National Codes', path: '/national-codes', icon: Barcode },
    { name: 'Mapping',        path: '/mapping',        icon: GitBranch },
    { name: 'Analytics',      path: '/analytics',      icon: BarChart3 },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">NUMMF</h1>
          <span className="sidebar-subtitle">One Nation - One Master Code</span>
        </div>
        
        <ul className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name} className="sidebar-item">
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  end={item.path === '/'}
                >
                  <Icon />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
        
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button 
            onClick={handleLogout} 
            className="sidebar-link" 
            style={{ 
              width: '100%', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              textAlign: 'left', 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            <LogOut style={{ marginRight: '12px', width: '20px', height: '20px' }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Page Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="topbar">
          <div className="topbar-title-section">
            <div className="topbar-app-name">National Unified Material Master</div>
            <div className="topbar-subtitle">AI-Powered Material Standardization Across CPSEs</div>
          </div>
          
          <div className="topbar-actions">
            <div className="topbar-search-container">
              <Search className="topbar-search-icon" />
              <input 
                type="text" 
                placeholder="Search original codes or text..." 
                className="topbar-search-input" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/materials?search=${encodeURIComponent(e.target.value)}`);
                  }
                }}
              />
            </div>
            
            <button className="topbar-icon-button">
              <Bell style={{ width: '20px', height: '20px' }} />
              <span className="topbar-badge"></span>
            </button>
            
            <div className="user-profile">
              <div className="user-avatar">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-name">{user.fullName}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Layout Content */}
        <main className="content-area">
          <div className="animated-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
