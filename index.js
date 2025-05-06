require('dotenv').config()
const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json()); // For parsing application/json

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    databaseURL: process.env.FIREBASE_DB_URL // For Realtime DB
});

// Reference to Realtime Database or Firestore
const db = admin.database();

// Middleware
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    // Check if Authorization header is present and well-formed
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
  
    // Extract the token from the header
    const idToken = authHeader.split('Bearer ')[1];
  
    try {
        // Verify the token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
    
        // Save the decoded user data to request for use in routes
        req.user = decodedToken;
    
        next(); // Go to the next middleware or route handler
    } catch (error) {
        return res.status(401).send({ error: 'Invalid or expired token' });
    }
};

// Add user
app.post('/users', verifyFirebaseToken, async (req, res) => {
    const { name, schoolClass } = req.body;
    try {
        await db.ref(`users/${req.user.uid}`).set({ name: name, schoolClass: schoolClass }); 
        res.status(200).send('User added successfully');
    } catch (err) {
        res.status(500).send('Error adding user: ' + err.message);
    }
});

// Get user info
app.get('/users', verifyFirebaseToken, async (req, res) => {
    try {
        const snapshot = await db.ref(`users/${req.user.uid}`).once('value');
        if (!snapshot.exists()) return res.status(404).send({ message: 'User not found' });
    
        res.status(200).send(snapshot.val());
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Start the server
app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.SERVER_PORT}`);
});