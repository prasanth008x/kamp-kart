"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const database_1 = __importDefault(require("./config/database"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const cart_1 = __importDefault(require("./routes/cart"));
const orders_1 = __importDefault(require("./routes/orders"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
// Socket.IO setup
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});
exports.io = io;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Kamp Kart API is running',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/cart', cart_1.default);
app.use('/api/orders', orders_1.default);
// Socket.IO connection handling
const activeUsers = new Map();
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    // User authentication for socket
    socket.on('authenticate', (data) => {
        if (data.userId) {
            activeUsers.set(data.userId, socket.id);
            socket.userId = data.userId;
            console.log(`User ${data.userId} authenticated`);
        }
    });
    // Join user to their personal room for notifications
    socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined personal room`);
    });
    // Cart sync across devices
    socket.on('cart-updated', (data) => {
        if (socket.userId) {
            // Broadcast cart update to all user's devices
            socket.to(`user-${socket.userId}`).emit('cart-sync', data);
        }
    });
    // Order updates
    socket.on('order-placed', (data) => {
        // Notify admin about new order
        io.to('admin-room').emit('new-order', data);
        // Send confirmation to user
        socket.emit('order-confirmation', {
            orderId: data.orderId,
            message: 'Order placed successfully!'
        });
    });
    // Admin room for order notifications
    socket.on('join-admin', (adminData) => {
        if (adminData.isAdmin) {
            socket.join('admin-room');
            console.log('Admin joined admin room');
        }
    });
    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            activeUsers.delete(socket.userId);
            console.log(`User ${socket.userId} disconnected`);
        }
        console.log(`Socket disconnected: ${socket.id}`);
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // Connect to database
        await (0, database_1.default)();
        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 API URL: http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map