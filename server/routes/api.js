const express = require('express');
const { getDb } = require('../db');
const telegramService = require('../telegram');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Helper to handle async routes
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// =======================
// USERS & AUTH
// =======================
router.get('/users', asyncHandler(async (req, res) => {
  const db = getDb();
  const snapshot = await db.collection('users').get();
  const users = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    users.push({ id: doc.id, ...data });
  });
  res.json({ success: true, data: users });
}));

router.post('/users/login', asyncHandler(async (req, res) => {
  const { phone, pin, chatId } = req.body;
  const db = getDb();
  
  const userDoc = await db.collection('users').doc(phone).get();
  
  if (!userDoc.exists) {
    return res.status(401).json({ success: false, message: 'Invalid phone or PIN' });
  }

  const user = userDoc.data();
  if (user.pin !== pin) {
    return res.status(401).json({ success: false, message: 'Invalid phone or PIN' });
  }
  
  // Update chat ID if provided (from Telegram login link)
  if (chatId && user.chat_id !== chatId) {
    await db.collection('users').doc(phone).update({ chat_id: chatId });
    user.chat_id = chatId;
  }
  
  res.json({ 
    success: true, 
    data: { id: userDoc.id, phone: user.phone, role: user.role, username: user.username, chatId: user.chat_id } 
  });
}));

// =======================
// TRANSFERS
// =======================
router.get('/transfers', asyncHandler(async (req, res) => {
  const db = getDb();
  // Order by date descending
  const snapshot = await db.collection('transfers').orderBy('date', 'desc').get();
  const transfers = [];
  snapshot.forEach(doc => {
    transfers.push({ id: doc.id, ...doc.data() });
  });
  res.json({ success: true, data: transfers });
}));

router.post('/transfers', asyncHandler(async (req, res) => {
  const transfer = req.body;
  const db = getDb();
  const id = uuidv4();
  
  const transferData = {
    ...transfer,
    status: 'Pending',
    payment_status: 'Pending',
    created_at: new Date().toISOString()
  };

  await db.collection('transfers').doc(id).set(transferData);

  // Notify driver via Telegram
  if (transfer.driverChatId) {
    const msg = `🚗 *NEW TRANSFER ASSIGNED*\n\n🏨 *Hotel:* ${transfer.hotel}\n👤 *Guest:* ${transfer.guestName} ${transfer.roomNo ? `(Room: ${transfer.roomNo})` : ''}\n📍 *Route:* ${transfer.pickupLocation} ➔ ${transfer.dropoffLocation}\n⏰ *Pickup:* ${transfer.pickupTime} on ${transfer.date}\n💵 *Payment:* ${transfer.amount} ${transfer.currency} (${transfer.paymentType})`;
    await telegramService.sendMessage(transfer.driverChatId, msg);
  }

  res.json({ success: true, message: 'Transfer created successfully', data: { id, ...transferData } });
}));

router.put('/transfers/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transfer = req.body;
  const db = getDb();
  
  await db.collection('transfers').doc(id).update(transfer);
  res.json({ success: true, message: 'Transfer updated successfully' });
}));

router.put('/transfers/:id/complete', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, paymentType, amount } = req.body;
  const db = getDb();
  
  let paymentStatus = 'Pending';
  if (paymentType === 'Cash') paymentStatus = 'Collected';
  if (paymentType === 'Inclusive' || paymentType === 'Pay Later') paymentStatus = 'Pending';
  
  await db.collection('transfers').doc(id).update({
    status,
    payment_type: paymentType,
    amount: Number(amount),
    payment_status: paymentStatus
  });
  
  res.json({ success: true, message: 'Transfer completed successfully' });
}));

router.put('/transfers/:id/approve_cash', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  await db.collection('transfers').doc(id).update({ payment_status: 'Received by Owner' });
  
  // Update related cash log
  const cashLogs = await db.collection('cash_log').where('transfer_id', '==', id).get();
  const batch = db.batch();
  cashLogs.forEach(doc => {
    batch.update(doc.ref, { status: 'Approved' });
  });
  await batch.commit();
  
  res.json({ success: true, message: 'Cash approved' });
}));

router.put('/transfers/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDb();
  
  await db.collection('transfers').doc(id).update({ status });
  res.json({ success: true, message: 'Status updated' });
}));

// =======================
// CASH LOG
// =======================
router.post('/cash_log', asyncHandler(async (req, res) => {
  const c = req.body;
  const id = uuidv4();
  const date = new Date().toISOString();
  const status = 'Pending Approval'; 
  const db = getDb();
  
  await db.collection('cash_log').doc(id).set({
    date,
    transfer_id: c.transferId,
    driver_name: c.driverName,
    driver_chat_id: c.driverChatId,
    amount: Number(c.amount),
    currency: c.currency,
    handed_to: c.handedTo,
    status,
    notes: c.notes || ''
  });
  
  await db.collection('transfers').doc(c.transferId).update({
    cash_handed_to: c.handedTo,
    cash_handed_date: date,
    payment_status: 'Handed Over - Pending'
  });

  // Notify owner
  const snapshot = await db.collection('users').where('role', '==', 'owner').get();
  const msg = `💰 *CASH HANDOVER*\nDriver *${c.driverName}* handed over *${c.amount} ${c.currency}* to *${c.handedTo}*.\nPlease verify and approve in the app.`;
  
  snapshot.forEach(async (doc) => {
    const owner = doc.data();
    if (owner.chat_id) await telegramService.sendMessage(owner.chat_id, msg);
  });
  
  res.json({ success: true, message: 'Cash handover submitted for approval' });
}));

router.put('/cash_log/:id/approve', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  const docRef = db.collection('cash_log').doc(id);
  const cashLogDoc = await docRef.get();
  if (!cashLogDoc.exists) return res.status(404).json({ success: false, message: 'Log not found' });
  const cashLog = cashLogDoc.data();

  await docRef.update({ status: 'Approved' });
  
  if (cashLog.transfer_id) {
    await db.collection('transfers').doc(cashLog.transfer_id).update({ payment_status: 'Received by Owner' });
  }
  
  if (cashLog.driver_chat_id) {
    await telegramService.sendMessage(cashLog.driver_chat_id, `✅ *CASH RECEIVED*\nYour handover of ${cashLog.amount} ${cashLog.currency} was approved.`);
  }

  res.json({ success: true, message: 'Cash received and approved' });
}));

// =======================
// EXPENSES
// =======================
router.get('/expenses', asyncHandler(async (req, res) => {
  const db = getDb();
  const snapshot = await db.collection('expenses').orderBy('date', 'desc').get();
  const expenses = [];
  snapshot.forEach(doc => {
    expenses.push({ id: doc.id, ...doc.data() });
  });
  res.json({ success: true, data: expenses });
}));

router.post('/expenses', asyncHandler(async (req, res) => {
  const e = req.body;
  const id = uuidv4();
  const date = new Date().toISOString();
  const status = 'Pending';
  const db = getDb();
  
  await db.collection('expenses').doc(id).set({
    date,
    driver_name: e.driverName,
    driver_chat_id: e.driverChatId,
    type: e.type,
    amount: Number(e.amount),
    currency: e.currency,
    description: e.description,
    status
  });

  // Notify owner
  const snapshot = await db.collection('users').where('role', '==', 'owner').get();
  const msg = `🧾 *NEW EXPENSE (${status})*\n\nDriver: *${e.driverName}*\nType: ${e.type}\nAmount: ${e.amount} ${e.currency}\nDesc: ${e.description}\n\nPlease approve or reject in the app.`;
  
  snapshot.forEach(async (doc) => {
    const owner = doc.data();
    if (owner.chat_id) await telegramService.sendMessage(owner.chat_id, msg);
  });
  
  res.json({ success: true, message: 'Expense submitted for approval' });
}));

router.put('/expenses/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, approvedBy } = req.body;
  const db = getDb();
  
  const docRef = db.collection('expenses').doc(id);
  const expenseDoc = await docRef.get();
  if (!expenseDoc.exists) return res.status(404).json({ success: false, message: 'Expense not found' });
  const expense = expenseDoc.data();

  await docRef.update({ status });
  
  if (expense.driver_chat_id) {
    const icon = status === 'Approved' ? '✅' : '❌';
    await telegramService.sendMessage(expense.driver_chat_id, `${icon} *EXPENSE ${status.toUpperCase()}*\nYour ${expense.type} expense of ${expense.amount} ${expense.currency} was ${status.toLowerCase()} by ${approvedBy}.`);
  }
  
  res.json({ success: true, message: `Expense ${status}` });
}));

module.exports = router;
