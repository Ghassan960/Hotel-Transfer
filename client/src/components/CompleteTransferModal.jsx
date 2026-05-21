import React, { useState } from 'react';
import { X } from 'lucide-react';

const CompleteTransferModal = ({ transfer, onClose, onComplete }) => {
  const [paymentType, setPaymentType] = useState(transfer.payment_type || 'Cash');
  const [amount, setAmount] = useState(transfer.amount || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/transfers/${transfer.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Completed',
          paymentType,
          amount
        })
      });
      const data = await res.json();
      if (data.success) {
        onComplete(); // Refresh dashboard
        onClose();
      } else {
        alert(data.message || 'Error completing transfer');
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
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Complete Transfer</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Confirm the final payment details for <strong>{transfer.guest_name}</strong>. You can change the payment method if the guest decided to pay differently.
          </div>

          <div className="input-group">
            <label>Payment Method</label>
            <select className="input" value={paymentType} onChange={e => setPaymentType(e.target.value)} required>
              <option value="Cash">Cash (I received cash)</option>
              <option value="Bank Transfer">Bank Transfer / Card (Online)</option>
              <option value="Inclusive">Inclusive (Paid to Hotel)</option>
              <option value="Pay Later">Pay Later (Guest did not pay)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Final Amount ({transfer.currency})</label>
            <input type="number" className="input" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving...' : 'Confirm & Complete'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteTransferModal;
