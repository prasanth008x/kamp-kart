"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Generate JWT token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        // Create new user
        const user = new User_1.default({
            name,
            email: email.toLowerCase(),
            password
        });
        await user.save();
        // Generate token
        const token = generateToken(user._id.toString());
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});
// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        // Find user
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (!user.isActive) {
            return res.status(400).json({ message: 'Account is deactivated' });
        }
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        // Generate token
        const token = generateToken(user._id.toString());
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});
// Admin login
router.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Check admin credentials
        if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
            return res.status(400).json({ message: 'Invalid admin credentials' });
        }
        // Find or create admin user
        let adminUser = await User_1.default.findOne({ email: 'admin@kampkart.com' });
        if (!adminUser) {
            adminUser = new User_1.default({
                name: 'Admin',
                email: 'admin@kampkart.com',
                password: password,
                isAdmin: true
            });
            await adminUser.save();
        }
        // Update last login
        adminUser.lastLogin = new Date();
        await adminUser.save();
        // Generate token
        const token = generateToken(adminUser._id.toString());
        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                isAdmin: true
            }
        });
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error during admin login' });
    }
});
// Google OAuth login/register
router.post('/google', async (req, res) => {
    try {
        const { googleId, email, name, avatar } = req.body;
        if (!googleId || !email || !name) {
            return res.status(400).json({ message: 'Google authentication data is required' });
        }
        // Check if user exists with Google ID
        let user = await User_1.default.findOne({ googleId });
        if (!user) {
            // Check if user exists with email
            user = await User_1.default.findOne({ email: email.toLowerCase() });
            if (user) {
                // Link Google account to existing user
                user.googleId = googleId;
                if (avatar)
                    user.avatar = avatar;
            }
            else {
                // Create new user
                user = new User_1.default({
                    name,
                    email: email.toLowerCase(),
                    googleId,
                    avatar
                });
            }
        }
        else {
            // Update user info
            user.name = name;
            user.email = email.toLowerCase();
            if (avatar)
                user.avatar = avatar;
        }
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        // Generate token
        const token = generateToken(user._id.toString());
        res.json({
            message: 'Google authentication successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin
            }
        });
    }
    catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Server error during Google authentication' });
    }
});
// Get current user
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id)
            .select('-password')
            .populate('cart.product', 'name price images')
            .populate('orders');
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                phone: user.phone,
                addresses: user.addresses,
                cart: user.cart,
                wishlist: user.wishlist,
                orders: user.orders,
                isAdmin: user.isAdmin
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Logout (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map