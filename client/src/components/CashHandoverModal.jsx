import React, { useState } from 'react';
import { X } from 'lucide-react';

const CashHandoverModal = ({ transfer, user, onClose, onHandover }) => {
  const [handedTo, setHandedTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/cash_log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: transfer.id,
          driverName: user?.username,
          driverChatId: user?.chatId || '',
          amount: transfer.amount,
          currency: transfer.currency,
          handedTo
        })
      });
      const data = await res.json();
      if (data.success) {
        onHandover(); // Refresh dashboard
        onClose();
      } else {
        alert(data.message || 'Error submitting handover');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--color-surface)', width: '100%', maxWidth: '480px', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem', padding: '1.5rem', paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Hand Over Cash</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            You are about to log that you handed over <strong>{transfer.amount} {transfer.currency}</strong> for transfer <strong>{transfer.guest_name}</strong>.
          </div>

          <div className="input-group">
            <label>Handed To (Name of Owner/Staff)</label>
            <input type="text" className="input" value={handedTo} onChange={e => setHandedTo(e.target.value)} required placeholder="e.g. Ali" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Confirm Handover'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CashHandoverModal;
