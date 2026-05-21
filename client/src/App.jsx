import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ListOrdered, PlusCircle, PieChart, Receipt, LogOut } from 'lucide-react';

// Placeholders for pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTransfer from './pages/CreateTransfer';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  if (!user) return null;

  const getNavClass = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

  return (
    <>
      {/* Mobile Nav */}
      <nav className="mobile-nav">
        <Link to="/" className={getNavClass('/')}><ListOrdered size={24} /> <span>Transfers</span></Link>
        <Link to="/expenses" className={getNavClass('/expenses')}><Receipt size={24} /> <span>Expenses</span></Link>
        {user.role === 'owner' || user.role === 'admin' ? (
          <Link to="/analytics" className={getNavClass('/analytics')}><PieChart size={24} /> <span>Analytics</span></Link>
        ) : null}
      </nav>

      {/* Desktop Sidebar */}
      <nav className="desktop-nav">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '2rem', padding: '0 1rem' }}>Tracker</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link to="/" className={getNavClass('/')}><ListOrdered size={24} /> <span>Transfers</span></Link>
          <Link to="/expenses" className={getNavClass('/expenses')}><Receipt size={24} /> <span>Expenses</span></Link>
          {(user.role === 'owner' || user.role === 'admin') && (
            <Link to="/analytics" className={getNavClass('/analytics')}><PieChart size={24} /> <span>Analytics</span></Link>
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{user.username}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user.role}</div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </nav>
    </>
  );
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="app-container">
      <Navigation />
      
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute allowedRoles={['owner', 'driver']}><CreateTransfer /></ProtectedRoute>} />
        <Route path="/edit" element={<ProtectedRoute allowedRoles={['owner', 'driver']}><CreateTransfer /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><Analytics /></ProtectedRoute>} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
