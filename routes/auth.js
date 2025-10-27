const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const router = express.Router();

// Login page
router.get('/login', (req, res) => {
    if (req.session.clientEmail) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', { error: 'Email and password are required' });
    }

    try {
        // Query the database for the user
        const [rows] = await db.execute(
            'SELECT * FROM clients WHERE client_email = ? LIMIT 1',
            [email]
        );

        if (rows.length === 0) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const user = rows[0];
        let isValidPassword = false;

        // Check password - handle both hashed and plain text passwords
        const storedPassword = user.password || user.password_;
        
        if (storedPassword) {
            // Check if it's a bcrypt hash
            if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
                isValidPassword = await bcrypt.compare(password, storedPassword);
            } else {
                // Plain text comparison (for legacy passwords)
                isValidPassword = password === storedPassword;
            }
        }

        if (!isValidPassword) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Set session
        req.session.clientEmail = email;
        req.session.clientId = user.client_id;
        req.session.clientName = user.client_name || 'User';

        res.redirect('/dashboard');

    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login error. Please try again later.' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
});

module.exports = router;
