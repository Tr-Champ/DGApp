/**
 * ==========================================================
 * EXPRESS.JS + POSTGRESQL (NEON) AUTHENTICATION CONTROLLER
 * Hardware-Backed Device Lock (Biometric / PIN / Pattern)
 * ==========================================================
 * This reference implementation demonstrates the exact Express.js
 * route handlers and pg queries matching the architectural spec.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.SECRET_KEY || 'super_secret_jwt_key_dg_ecommerce_2026';
const JWT_EXPIRES_IN = '24h';

// Helper: Sign user JWT
const signToken = (user) => {
    return jwt.sign(
        {
            sub: user.email,
            userId: user.id.toString(),
            email: user.email,
            isAdmin: Boolean(user.is_admin)
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// 1. POST /api/auth/register
// Request: { email: string, device_token: string, is_admin?: boolean }
router.post('/register', async (req, res) => {
    const { email, device_token, is_admin = false } = req.body;

    if (!email || !device_token) {
        return res.status(400).json({
            success: false,
            message: 'Email and device_token are required'
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = device_token.trim();

    try {
        // Check if email already exists
        const emailCheck = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [cleanEmail]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Insert new user
        const result = await pool.query(
            `INSERT INTO users (email, device_token, is_admin)
             VALUES ($1, $2, $3)
             RETURNING id, email, is_admin, created_at`,
            [cleanEmail, cleanToken, Boolean(is_admin)]
        );

        const newUser = result.rows[0];
        const token = signToken(newUser);

        return res.status(201).json({
            success: true,
            token,
            access_token: token,
            token_type: 'bearer',
            user: {
                id: newUser.id.toString(),
                email: newUser.email,
                is_admin: newUser.is_admin
            }
        });
    } catch (err) {
        console.error('Registration Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// 2. POST /api/auth/login
// Request: { device_token: string }
router.post('/login', async (req, res) => {
    const { device_token } = req.body;

    if (!device_token) {
        return res.status(401).json({
            success: false,
            message: 'Unrecognized device'
        });
    }

    try {
        const result = await pool.query(
            'SELECT id, email, is_admin FROM users WHERE device_token = $1',
            [device_token.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Unrecognized device'
            });
        }

        const user = result.rows[0];
        const token = signToken(user);

        return res.json({
            success: true,
            token,
            access_token: token,
            token_type: 'bearer',
            user: {
                id: user.id.toString(),
                email: user.email,
                is_admin: user.is_admin
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// 3. POST /api/auth/rebind-device (Device Recovery / Replacement)
// Request: { email: string, new_device_token: string }
router.post('/rebind-device', async (req, res) => {
    const { email, new_device_token } = req.body;

    if (!email || !new_device_token) {
        return res.status(400).json({
            success: false,
            message: 'Email and new_device_token are required'
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = new_device_token.trim();

    try {
        // Disassociate token if used elsewhere
        await pool.query(
            'UPDATE users SET device_token = CONCAT(\'revoked_\', id, \'_\', SUBSTRING($1, 1, 8)) WHERE device_token = $1 AND email != $2',
            [cleanToken, cleanEmail]
        );

        // Update target user
        const result = await pool.query(
            `UPDATE users
             SET device_token = $1, updated_at = NOW()
             WHERE email = $2
             RETURNING id, email, is_admin`,
            [cleanToken, cleanEmail]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        const user = result.rows[0];
        const token = signToken(user);

        return res.json({
            success: true,
            message: 'Device rebound successfully',
            token,
            access_token: token,
            token_type: 'bearer',
            user: {
                id: user.id.toString(),
                email: user.email,
                is_admin: user.is_admin
            }
        });
    } catch (err) {
        console.error('Rebind Error:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
