const admin = require('firebase-admin');

let db;

async function initDb() {
  // Check if Firebase is already initialized
  if (!admin.apps.length) {
    try {
      // In production (Cloud Run), it will automatically use default credentials
      // Locally, it needs a service account key or GOOGLE_APPLICATION_CREDENTIALS env var
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        admin.initializeApp();
      }
      console.log('Firebase Admin Initialized');
    } catch (e) {
      console.log('Firebase initialization error (might be running locally without credentials):', e.message);
    }
  }
  
  db = admin.firestore();

  // Seed default users if they don't exist
  try {
    const ownerRef = db.collection('users').doc('7771234');
    const ownerDoc = await ownerRef.get();
    if (!ownerDoc.exists) {
      await ownerRef.set({ phone: '7771234', pin: '1234', role: 'owner', username: 'Owner Name', chat_id: '' });
    }

    const driverRef = db.collection('users').doc('7775678');
    const driverDoc = await driverRef.get();
    if (!driverDoc.exists) {
      await driverRef.set({ phone: '7775678', pin: '1234', role: 'driver', username: 'Ahmed Ali', chat_id: '' });
    }
  } catch(e) {
    console.log('Could not seed users, likely due to missing credentials in local dev.');
  }

  return db;
}

function getDb() {
  if (!db) {
    db = admin.firestore();
  }
  return db;
}

module.exports = { initDb, getDb };
