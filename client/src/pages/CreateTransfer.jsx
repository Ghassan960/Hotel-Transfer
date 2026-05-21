import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const CreateTransfer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  const editingTransfer = location.state?.transfer;

  const [formData, setFormData] = useState(editingTransfer ? {
    hotel: editingTransfer.hotel || '',
    guestName: editingTransfer.guest_name || '',
    roomNo: editingTransfer.room_no || '',
    pickupLocation: editingTransfer.pickup_location || '',
    dropoffLocation: editingTransfer.dropoff_location || '',
    date: editingTransfer.date || new Date().toISOString().split('T')[0],
    pickupTime: editingTransfer.pickup_time || '10:00',
    paymentType: editingTransfer.payment_type || 'Cash',
    currency: editingTransfer.currency || 'USD',
    amount: editingTransfer.amount || ''
  } : {
    hotel: '',
    guestName: '',
    roomNo: '',
    pickupLocation: '',
    dropoffLocation: '',
    date: new Date().toISOString().split('T')[0],
    pickupTime: '10:00',
    paymentType: 'Cash',
    currency: 'USD',
    amount: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingTransfer 
        ? `/api/transfers/${editingTransfer.id}`
        : '/api/transfers';
        
      const response = await fetch(url, {
        method: editingTransfer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: editingTransfer ? editingTransfer.created_by : user?.username
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(editingTransfer ? 'Transfer updated!' : 'Transfer successfully created!');
        navigate('/');
      } else {
        alert(data.message || 'Failed to save transfer.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Network error while saving.');
    }
  };

  return (
    <>
      <div className="header">
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={24} />
          <span style={{ fontWeight: 600 }}>Back</span>
        </button>
      </div>

      <div className="main-content">
        <h2 className="page-title">{editingTransfer ? 'Edit Transfer' : 'Create Transfer'}</h2>
        
        <form onSubmit={handleSubmit} className="card">
          <div className="input-group">
            <label>Hotel</label>
            <input type="text" name="hotel" className="input" value={formData.hotel} onChange={handleChange} required />
          </div>
          
          <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label>Guest Name</label>
              <input type="text" name="guestName" className="input" value={formData.guestName} onChange={handleChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>Room No</label>
              <input type="text" name="roomNo" className="input" value={formData.roomNo} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <label>Pickup Location</label>
            <input type="text" name="pickupLocation" className="input" placeholder="e.g. Velana Airport" value={formData.pickupLocation} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Dropoff Location</label>
            <input type="text" name="dropoffLocation" className="input" placeholder="e.g. Male City" value={formData.dropoffLocation} onChange={handleChange} required />
          </div>

          <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label>Date</label>
              <input type="date" name="date" className="input" value={formData.date} onChange={handleChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>Pickup Time</label>
              <input type="time" name="pickupTime" className="input" value={formData.pickupTime} onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <label>Payment Type</label>
            <select name="paymentType" className="input" value={formData.paymentType} onChange={handleChange} required>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Inclusive">Inclusive (Hotel)</option>
              <option value="Pay Later">Pay Later</option>
            </select>
          </div>

          <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label>Currency</label>
              <select name="currency" className="input" value={formData.currency} onChange={handleChange} required>
                <option value="USD">USD</option>
                <option value="MVR">MVR</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Amount</label>
              <input type="number" name="amount" className="input" placeholder="e.g. 25" value={formData.amount} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            {editingTransfer ? 'Save Changes' : 'Create Transfer'}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateTransfer;
