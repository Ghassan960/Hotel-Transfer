const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('./database.sqlite');

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

// In 2 hours
const inTwoHours = new Date(today.getTime() + 2 * 60 * 60 * 1000);
const timeInTwoHours = inTwoHours.toTimeString().substring(0, 5);

// In 6 hours
const inSixHours = new Date(today.getTime() + 6 * 60 * 60 * 1000);
const timeInSixHours = inSixHours.toTimeString().substring(0, 5);

const sampleTransfers = [
  // 1. Pending, < 5 hours (Countdown trigger)
  {
    id: uuidv4(), date: todayStr, pickup_time: timeInTwoHours, hotel: 'Kurumba Maldives',
    guest_name: 'John Smith', room_no: '101', pickup_location: 'Velana Airport', dropoff_location: 'Hotel',
    driver_name: 'Driver Ali', driver_chat_id: '11111', created_by: 'Admin Bob',
    payment_type: 'Cash', currency: 'USD', amount: 50, status: 'Pending', payment_status: 'Pending'
  },
  // 2. Pending, > 5 hours
  {
    id: uuidv4(), date: todayStr, pickup_time: timeInSixHours, hotel: 'Sheraton Full Moon',
    guest_name: 'Emma Watson', room_no: '', pickup_location: 'Male City', dropoff_location: 'Airport',
    driver_name: 'Driver Ali', driver_chat_id: '11111', created_by: 'Admin Bob',
    payment_type: 'Bank Transfer', currency: 'USD', amount: 35, status: 'Pending', payment_status: 'Pending'
  },
  // 3. Pending, Tomorrow
  {
    id: uuidv4(), date: tomorrowStr, pickup_time: '14:00', hotel: 'Hard Rock Hotel',
    guest_name: 'Michael Jordan', room_no: 'V12', pickup_location: 'Airport', dropoff_location: 'Resort',
    driver_name: 'Driver Ali', driver_chat_id: '11111', created_by: 'Owner Sam',
    payment_type: 'Pay Later', currency: 'USD', amount: 150, status: 'Pending', payment_status: 'Pending'
  },
  // 4. Completed, Cash, Collected (Needs Handover)
  {
    id: uuidv4(), date: todayStr, pickup_time: '08:00', hotel: 'Taj Exotica',
    guest_name: 'Lucy Chen', room_no: '202', pickup_location: 'Resort', dropoff_location: 'Airport',
    driver_name: 'Driver Ali', driver_chat_id: '11111', created_by: 'Admin Bob',
    payment_type: 'Cash', currency: 'USD', amount: 80, status: 'Completed', payment_status: 'Collected'
  },
  // 5. Completed, Cash, Handed Over (Pending Owner Approval)
  {
    id: uuidv4(), date: yesterdayStr, pickup_time: '10:00', hotel: 'Conrad',
    guest_name: 'David Beckham', room_no: '33', pickup_location: 'Airport', dropoff_location: 'Resort',
    driver_name: 'Driver Ali', driver_chat_id: '11111', created_by: 'Admin Bob',
    payment_type: 'Cash', currency: 'USD', amount: 200, status: 'Completed', payment_status: 'Handed Over - Pending',
    cash_handed_to: 'Admin Bob', cash_handed_date: yesterday.toISOString()
  },
  // 6. Completed, Cash, Received by Owner (Fully Complete)
  {
    id: uuidv4(), date: yesterdayStr, pickup_time: '11:00', hotel: 'Ozen Reserve',
    guest_name: 'Elon Musk', room_no: 'VIP', pickup_location: 'Airport', dropoff_location: 'Resort',
    driver_name: 'Driver Ali', driver_chat_id: '11111', created_by: 'Owner Sam',
    payment_type: 'Cash', currency: 'USD', amount: 500, status: 'Completed', payment_status: 'Received by Owner',
    cash_handed_to: 'Owner Sam', cash_handed_date: yesterday.toISOString()
  },
  // 7. Completed, Bank Transfer
  {
    id: uuidv4(), date: yesterdayStr, pickup_time: '16:00', hotel: 'Kurumba Maldives',
    guest_name: 'Sara Connor', room_no: '55', pickup_location: 'Male', dropoff_location: 'Airport',
    driver_name: 'Driver Ali', driver_chat_id: '11111', created_by: 'Admin Bob',
    payment_type: 'Bank Transfer', currency: 'USD', amount: 45, status: 'Completed', payment_status: 'Received'
  }
];

const sampleExpenses = [
  {
    id: uuidv4(), date: today.toISOString(), driver_name: 'Driver Ali', driver_chat_id: '11111',
    type: 'Petrol', amount: 200, currency: 'MVR', description: 'Filled tank at Hulhumale', status: 'Pending'
  },
  {
    id: uuidv4(), date: yesterday.toISOString(), driver_name: 'Driver Ali', driver_chat_id: '11111',
    type: 'Maintenance', amount: 1500, currency: 'MVR', description: 'Oil change and filter', status: 'Approved'
  },
  {
    id: uuidv4(), date: yesterday.toISOString(), driver_name: 'Driver Ali', driver_chat_id: '11111',
    type: 'Cleaning', amount: 50, currency: 'MVR', description: 'Car wash', status: 'Rejected'
  }
];

db.serialize(() => {
  const stmt = db.prepare(`INSERT INTO transfers (
    id, date, pickup_time, hotel, guest_name, room_no, pickup_location, dropoff_location,
    driver_name, driver_chat_id, created_by, payment_type, currency, amount, status, payment_status,
    cash_handed_to, cash_handed_date
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  sampleTransfers.forEach(t => {
    stmt.run([
      t.id, t.date, t.pickup_time, t.hotel, t.guest_name, t.room_no, t.pickup_location, t.dropoff_location,
      t.driver_name, t.driver_chat_id, t.created_by, t.payment_type, t.currency, t.amount, t.status, t.payment_status,
      t.cash_handed_to || null, t.cash_handed_date || null
    ]);
  });
  stmt.finalize();

  const expStmt = db.prepare(`INSERT INTO expenses (
    id, date, driver_name, driver_chat_id, type, amount, currency, description, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  sampleExpenses.forEach(e => {
    expStmt.run([
      e.id, e.date, e.driver_name, e.driver_chat_id, e.type, e.amount, e.currency, e.description, e.status
    ]);
  });
  expStmt.finalize();
  
  // Add matching cash_log for the pending handover
  db.run(`INSERT INTO cash_log (id, date, transfer_id, driver_name, driver_chat_id, amount, currency, handed_to, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [uuidv4(), yesterday.toISOString(), sampleTransfers[4].id, 'Driver Ali', '11111', 200, 'USD', 'Admin Bob', 'Pending Approval', '']);

  console.log('Seed data inserted successfully!');
});
db.close();
