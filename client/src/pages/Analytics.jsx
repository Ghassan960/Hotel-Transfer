import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const [allTransfers, setAllTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date filtering state (default to current month)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res = await fetch('/api/transfers');
        const data = await res.json();
        if (data.success) {
          // Filter to completed transfers for revenue
          setAllTransfers(data.data.filter(t => t.status === 'Completed'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, []);

  if (loading) return <div className="main-content"><p>Loading analytics...</p></div>;

  // Filter transfers based on date range
  const transfers = allTransfers.filter(t => {
    const tDate = t.date; // format is YYYY-MM-DD
    return tDate >= startDate && tDate <= endDate;
  });

  // Calculate metrics
  let totalUsd = 0;
  let totalMvr = 0;
  
  const paymentTypeData = {};
  const hotelData = {};
  const driverData = {};

  transfers.forEach(t => {
    if (t.currency === 'USD') totalUsd += t.amount;
    if (t.currency === 'MVR') totalMvr += t.amount;
    
    // Payment Type Chart
    if (!paymentTypeData[t.payment_type]) paymentTypeData[t.payment_type] = 0;
    paymentTypeData[t.payment_type] += 1;

    // Hotel Chart
    if (!hotelData[t.hotel]) hotelData[t.hotel] = 0;
    hotelData[t.hotel] += 1;
    
    // Driver Stats
    const driver = t.driver_name || 'Unassigned';
    if (!driverData[driver]) driverData[driver] = 0;
    driverData[driver] += 1;
  });

  const pieData = Object.keys(paymentTypeData).map(key => ({ name: key, value: paymentTypeData[key] }));
  const barData = Object.keys(hotelData).map(key => ({ name: key, transfers: hotelData[key] })).sort((a,b) => b.transfers - a.transfers).slice(0, 5);

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem', gap: '1rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Analytics & Reporting</h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--color-surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>From:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-text)' }} />
          </div>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>To:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-text)' }} />
          </div>
        </div>
      </div>
      
      <div className="grid-cards" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>Period Revenue (USD)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>${totalUsd.toFixed(2)}</p>
        </div>
        <div className="card" style={{ backgroundColor: 'var(--color-success)', color: 'white' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9 }}>Period Revenue (MVR)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>MVR {totalMvr.toFixed(2)}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Completed Transfers</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>{transfers.length}</p>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem' }}>Top Hotels by Volume</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{fill: 'var(--color-text-muted)'}} />
                <YAxis tick={{fill: 'var(--color-text-muted)'}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.1)'}} contentStyle={{backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="transfers" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem' }}>Payment Methods</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {pieData.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Accounting Ledger ({startDate} to {endDate})</h3>
      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Hotel</th>
              <th>Guest</th>
              <th>Driver</th>
              <th>Created By</th>
              <th>Payment Type</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transfers.slice(0, 50).map(t => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.hotel}</td>
                <td>{t.guest_name}</td>
                <td style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{t.driver_name || 'N/A'}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{t.created_by || 'Unknown'}</td>
                <td>{t.payment_type}</td>
                <td><span className="badge badge-completed">{t.payment_status}</span></td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{t.amount} {t.currency}</td>
              </tr>
            ))}
            {transfers.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No transfers found for this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
