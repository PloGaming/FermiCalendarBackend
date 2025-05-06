require('dotenv').config()
const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json()); // For parsing application/json

// Initialize Firebase
const serviceAccount = require('./service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL // For Realtime DB
});

// Reference to Realtime Database or Firestore
const db = admin.database();

// Example endpoint: Add user
app.post('/users', async (req, res) => {
    const { username, email } = req.body;
    try {
        await db.ref('users').push({ username, email }); 
        res.status(200).send('User added successfully');
    } catch (err) {
        res.status(500).send('Error adding user: ' + err.message);
    }
});

// Example endpoint: Get all users
app.get('/users', async (req, res) => {
    try {
        const snapshot = await db.ref('users').once('value');
        res.status(200).json(snapshot.val());
    } catch (err) {
        res.status(500).send('Error retrieving users: ' + err.message);
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});