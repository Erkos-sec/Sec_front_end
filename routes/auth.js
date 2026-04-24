const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const router = express.Router();

router.get('/login', (req, res) => {
    if (req.session.clientEmail) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', { error: 'Email and password are required' });
    }

    try {
        const [rows] = await db.execute(
            'SELECT * FROM clients WHERE client_email = ? LIMIT 1',
            [email]
        );

        if (rows.length === 0) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const user = rows[0];
        let isValidPassword = false;

        const storedPassword = user.password || user.password_;
        
        if (storedPassword) {
            if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
                isValidPassword = await bcrypt.compare(password, storedPassword);
            } else {
                isValidPassword = password === storedPassword;
            }
        }

        if (!isValidPassword) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        req.session.clientEmail = email;
        req.session.clientId = user.client_id;
        req.session.clientName = user.client_name || 'User';

        res.redirect('/dashboard');

    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login error. Please try again later.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
});

module.exports = router;
