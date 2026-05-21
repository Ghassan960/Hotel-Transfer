import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(phone, pin);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>TransferTracker</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Login to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <div className="input-group">
          <label>Phone Number</label>
          <input 
            type="text" 
            className="input" 
            placeholder="e.g. 7771234" 
            value={phone} 
            onChange={e => setPhone(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group">
          <label>PIN Code</label>
          <input 
            type="password" 
            className="input" 
            placeholder="Enter PIN (e.g. 1234)" 
            value={pin} 
            onChange={e => setPin(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          <LogIn size={20} style={{ marginRight: '0.5rem' }} />
          Sign In
        </button>
      </form>
    </div>
  );
};

export default Login;
