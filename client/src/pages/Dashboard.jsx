import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { PlusCircle, LogOut, MapPin, Clock, CheckCircle } from 'lucide-react';
import CompleteTransferModal from '../components/CompleteTransferModal';
import CashHandoverModal from '../components/CashHandoverModal';
import { formatDistanceToNowStrict, differenceInHours } from 'date-fns';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cash'
  const [completingTransfer, setCompletingTransfer] = useState(null);
  const [handoverTransfer, setHandoverTransfer] = useState(null);

  const fetchTransfers = async () => {
    try {
      const res = await fetch('/api/transfers');
      const data = await res.json();
      if (data.success) {
        let fetchedData = data.data;
        // If driver, only show their own transfers
        if (user?.role === 'driver') {
          fetchedData = fetchedData.filter(t => t.driver_name === user.username || t.driver_chat_id === user.chatId);
        }
        setTransfers(fetchedData);
      }
    } catch (err) {
      console.error('Failed to fetch transfers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const getStatusBadge = (status) => {
    const classes = {
      'Pending': 'badge-pending',
      'In Progress': 'badge-progress',
      'Completed': 'badge-completed',
      'Pay Later': 'badge-paylater',
      'Cancelled': 'badge-cancelled'
    };
    return <span className={`badge ${classes[status] || 'badge-pending'}`}>{status}</span>;
  };

  const approveCash = async (transferId) => {
    if (!window.confirm('Are you sure you received the cash for this?')) return;
    try {
      const res = await fetch(`/api/transfers/${transferId}/approve_cash`, { method: 'PUT' });
      if (res.ok) fetchTransfers();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter and sort transfers based on active tab
  let displayedTransfers = [...transfers];
  
  if (user?.role === 'driver') {
    if (activeTab === 'upcoming') {
      displayedTransfers = displayedTransfers.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
      // Sort by closest pickup time
      displayedTransfers.sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.pickup_time || a.pickupTime}:00`);
        const timeB = new Date(`${b.date}T${b.pickup_time || b.pickupTime}:00`);
        return timeA - timeB;
      });
    } else if (activeTab === 'completed') {
      displayedTransfers = displayedTransfers.filter(t => t.status === 'Completed' && (!t.payment_status || t.payment_status === 'Collected' || t.payment_status === 'Pending'));
    } else if (activeTab === 'cash') {
      displayedTransfers = displayedTransfers.filter(t => t.payment_status === 'Handed Over - Pending' || t.payment_status === 'Received by Owner');
    }
  }

  const renderCountdown = (date, time) => {
    try {
      const pickupDate = new Date(`${date}T${time}:00`);
      const hoursDiff = differenceInHours(pickupDate, new Date());
      
      if (hoursDiff >= 0 && hoursDiff <= 5) {
        return (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-block', marginTop: '0.25rem' }}>
            ⏳ Pickup in {formatDistanceToNowStrict(pickupDate)}
          </div>
        );
      }
    } catch(e) {}
    return null;
  };

  return (
    <>
      <div className="header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Welcome, {user?.username}</h1>
          <span className="badge" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
          <LogOut size={24} />
        </button>
      </div>
      
      <div className="main-content">
        <h2 className="page-title">Dashboard</h2>
        
        {user?.role === 'driver' && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            <button className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('upcoming')} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap', backgroundColor: activeTab === 'upcoming' ? '' : 'var(--color-surface)', color: activeTab === 'upcoming' ? '' : 'var(--color-text)', border: '1px solid var(--color-border)' }}>
              Upcoming
            </button>
            <button className={`btn ${activeTab === 'completed' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('completed')} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap', backgroundColor: activeTab === 'completed' ? '' : 'var(--color-surface)', color: activeTab === 'completed' ? '' : 'var(--color-text)', border: '1px solid var(--color-border)' }}>
              Completed
            </button>
            <button className={`btn ${activeTab === 'cash' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('cash')} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap', backgroundColor: activeTab === 'cash' ? '' : 'var(--color-surface)', color: activeTab === 'cash' ? '' : 'var(--color-text)', border: '1px solid var(--color-border)' }}>
              Cash Log
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading transfers...</p>
        ) : displayedTransfers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No transfers found in this section.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {displayedTransfers.map(t => (
              <div key={t.id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '1.125rem', display: 'block' }}>{t.guest_name || t.guestName}</span>
                    {t.status !== 'Completed' && renderCountdown(t.date, t.pickup_time || t.pickupTime)}
                  </div>
                  {getStatusBadge(t.status)}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={16} style={{ flexShrink: 0 }} />
                    {t.pickup_location || t.pickupLocation} ➔ {t.dropoff_location || t.dropoffLocation}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={16} />
                    {t.pickup_time || t.pickupTime} ({t.date})
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Amount ({t.payment_type})</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{t.amount} {t.currency}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {(user?.role === 'owner' || t.created_by === user?.username) && (
                      <Link to={`/edit`} state={{ transfer: t }} style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                        Edit
                      </Link>
                    )}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Hotel</span>
                      <span style={{ fontWeight: 500 }}>{t.hotel}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', backgroundColor: 'var(--color-background)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Driver:</span>
                    <span style={{ fontWeight: 600 }}>{t.driver_name || 'Unassigned'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Created By:</span>
                    <span style={{ fontWeight: 600 }}>{t.created_by || 'Unknown'}</span>
                  </div>
                </div>

                {/* Actions Section */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                  {t.status !== 'Completed' && (user?.role === 'driver' || user?.role === 'owner') && (
                    <button className="btn" style={{ backgroundColor: 'var(--color-success)', color: 'white', flex: 1, padding: '0.5rem' }} onClick={() => setCompletingTransfer(t)}>
                      <CheckCircle size={16} style={{ marginRight: '0.25rem' }} /> Mark Finished
                    </button>
                  )}
                  
                  {t.status === 'Completed' && t.payment_type === 'Cash' && t.payment_status === 'Collected' && (user?.role === 'driver' || user?.role === 'owner') && (
                    <button className="btn" style={{ backgroundColor: 'var(--color-warning)', color: 'white', flex: 1, padding: '0.5rem' }} onClick={() => setHandoverTransfer(t)}>
                      Hand Over Cash
                    </button>
                  )}

                  {t.payment_status === 'Handed Over - Pending' && user?.role === 'owner' && (
                    <button className="btn" style={{ backgroundColor: 'var(--color-success)', color: 'white', flex: 1, padding: '0.5rem' }} onClick={() => approveCash(t.id)}>
                      Approve Cash Received
                    </button>
                  )}
                  
                  {t.payment_status === 'Handed Over - Pending' && user?.role === 'driver' && (
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-warning)', fontWeight: 600, width: '100%', textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '4px' }}>
                      Pending Owner Verification
                    </span>
                  )}
                  
                  {t.payment_status === 'Received by Owner' && (
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-success)', fontWeight: 600, width: '100%', textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '4px' }}>
                      Cash Received by Owner
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(user?.role === 'owner' || user?.role === 'driver') && (
        <Link to="/create" className="floating-action-button">
          <PlusCircle size={28} />
        </Link>
      )}

      {completingTransfer && (
        <CompleteTransferModal 
          transfer={completingTransfer} 
          onClose={() => setCompletingTransfer(null)} 
          onComplete={fetchTransfers} 
        />
      )}

      {handoverTransfer && (
        <CashHandoverModal 
          transfer={handoverTransfer} 
          user={user}
          onClose={() => setHandoverTransfer(null)} 
          onHandover={fetchTransfers} 
        />
      )}
    </>
  );
};

export default Dashboard;
