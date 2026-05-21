import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, CheckCircle, XCircle } from 'lucide-react';

const Expenses = () => {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Petrol',
    description: '',
    amount: '',
    currency: 'USD'
  });

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.success) {
        if (user.role === 'driver') {
          setExpenses(data.data.filter(e => e.driver_chat_id === user.chatId || e.driver_name === user.username));
        } else {
          setExpenses(data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          driverName: user.username,
          driverChatId: user.chatId
        })
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ type: 'Petrol', description: '', amount: '', currency: 'USD' });
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/expenses/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedBy: user.username })
      });
      if (res.ok) fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Expenses</h2>
        {(user.role === 'driver' || user.role === 'owner') && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            <PlusCircle size={20} style={{ marginRight: '0.5rem' }} />
            New Expense
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '2rem' }}>
          <h3>Submit New Expense</h3>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label>Type</label>
            <select name="type" className="input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="Petrol">Petrol</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Toll">Toll / Parking</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Description</label>
            <input type="text" className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
          </div>

          <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label>Currency</label>
              <select className="input" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                <option value="USD">USD</option>
                <option value="MVR">MVR</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Amount</label>
              <input type="number" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary">Submit for Approval</button>
        </form>
      )}

      {loading ? (
        <p>Loading expenses...</p>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>No expenses logged yet.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {expenses.map(e => (
            <div key={e.id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.125rem', margin: 0 }}>{e.type}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>{e.description}</p>
                </div>
                <span className={`badge ${e.status === 'Pending' ? 'badge-pending' : e.status === 'Approved' ? 'badge-completed' : 'badge-cancelled'}`}>
                  {e.status}
                </span>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Amount</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{e.amount} {e.currency}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Driver</span>
                  <span style={{ fontWeight: 500 }}>{e.driver_name}</span>
                </div>
              </div>

              {e.status === 'Pending' && user.role === 'owner' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn" style={{ backgroundColor: 'var(--color-success)', color: 'white', flex: 1, padding: '0.5rem' }} onClick={() => updateStatus(e.id, 'Approved')}>
                    <CheckCircle size={16} style={{ marginRight: '0.25rem' }} /> Approve
                  </button>
                  <button className="btn" style={{ backgroundColor: 'var(--color-danger)', color: 'white', flex: 1, padding: '0.5rem' }} onClick={() => updateStatus(e.id, 'Rejected')}>
                    <XCircle size={16} style={{ marginRight: '0.25rem' }} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Expenses;
