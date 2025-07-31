"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Order_1 = __importDefault(require("../models/Order"));
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Create new order (checkout)
router.post('/create', auth_1.authenticateToken, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, paymentId, couponCode } = req.body;
        if (!items || !items.length) {
            return res.status(400).json({ message: 'Order items are required' });
        }
        if (!shippingAddress) {
            return res.status(400).json({ message: 'Shipping address is required' });
        }
        if (!paymentMethod) {
            return res.status(400).json({ message: 'Payment method is required' });
        }
        // Validate and calculate order totals
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await Product_1.default.findById(item.productId);
            if (!product || !product.isActive) {
                return res.status(400).json({
                    message: `Product ${item.productId} not found or unavailable`
                });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}`
                });
            }
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                image: product.images[0]
            });
            // Update product stock
            product.stock -= item.quantity;
            await product.save();
        }
        // Calculate shipping and tax
        const shippingCost = subtotal > 500 ? 0 : 50;
        const tax = Math.round(subtotal * 0.18); // 18% GST
        let discount = 0;
        // Apply coupon if provided
        if (couponCode) {
            // Simple discount logic - you can expand this
            if (couponCode === 'FIRST10') {
                discount = Math.round(subtotal * 0.1);
            }
            else if (couponCode === 'SAVE20') {
                discount = Math.round(subtotal * 0.2);
            }
        }
        const total = subtotal + shippingCost + tax - discount;
        // Create order
        const order = new Order_1.default({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            paymentId,
            subtotal,
            shippingCost,
            tax,
            discount,
            total,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed'
        });
        await order.save();
        // Clear user's cart
        const user = await User_1.default.findById(req.user._id);
        if (user) {
            user.cart = [];
            user.orders.push(order._id);
            await user.save();
        }
        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                id: order._id,
                orderNumber: order.orderNumber,
                total: order.total,
                status: order.status,
                estimatedDelivery: order.estimatedDelivery
            }
        });
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Server error during order creation' });
    }
});
// Get user's orders
router.get('/my-orders', auth_1.authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const filter = { user: req.user._id };
        if (status)
            filter.status = status;
        const [orders, totalCount] = await Promise.all([
            Order_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('items.product', 'name images'),
            Order_1.default.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        res.json({
            orders,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get order by ID
router.get('/:orderId', auth_1.authenticateToken, async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.orderId)
            .populate('items.product', 'name images category brand')
            .populate('user', 'name email');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Check if user owns this order or is admin
        if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.json({ order });
    }
    catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Cancel order
router.put('/:orderId/cancel', auth_1.authenticateToken, async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Check if user owns this order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        // Check if order can be cancelled
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ message: 'Order cannot be cancelled' });
        }
        // Restore product stock
        for (const item of order.items) {
            const product = await Product_1.default.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
        order.status = 'cancelled';
        order.paymentStatus = 'refunded';
        await order.save();
        res.json({
            message: 'Order cancelled successfully',
            order
        });
    }
    catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Admin routes
// Get all orders (Admin only)
router.get('/admin/all', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, paymentStatus, search, startDate, endDate } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const filter = {};
        if (status)
            filter.status = status;
        if (paymentStatus)
            filter.paymentStatus = paymentStatus;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate)
                filter.createdAt.$gte = new Date(startDate);
            if (endDate)
                filter.createdAt.$lte = new Date(endDate);
        }
        if (search) {
            filter.$or = [
                { orderNumber: new RegExp(search, 'i') },
                { 'shippingAddress.name': new RegExp(search, 'i') },
                { 'shippingAddress.phone': new RegExp(search, 'i') }
            ];
        }
        const [orders, totalCount] = await Promise.all([
            Order_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('user', 'name email')
                .populate('items.product', 'name images'),
            Order_1.default.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        res.json({
            orders,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Admin get orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Update order status (Admin only)
router.put('/admin/:orderId/status', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { status, tracking } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        const order = await Order_1.default.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        order.status = status;
        if (tracking) {
            order.tracking = tracking;
        }
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }
        await order.save();
        res.json({
            message: 'Order status updated successfully',
            order
        });
    }
    catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get order statistics (Admin only)
router.get('/admin/stats/overview', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const [totalOrders, monthlyOrders, weeklyOrders, totalRevenue, monthlyRevenue, weeklyRevenue, statusStats, paymentStats] = await Promise.all([
            Order_1.default.countDocuments(),
            Order_1.default.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Order_1.default.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Order_1.default.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
            Order_1.default.aggregate([
                { $match: { createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            Order_1.default.aggregate([
                { $match: { createdAt: { $gte: startOfWeek } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            Order_1.default.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Order_1.default.aggregate([
                { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
            ])
        ]);
        res.json({
            orders: {
                total: totalOrders,
                monthly: monthlyOrders,
                weekly: weeklyOrders
            },
            revenue: {
                total: totalRevenue[0]?.total || 0,
                monthly: monthlyRevenue[0]?.total || 0,
                weekly: weeklyRevenue[0]?.total || 0
            },
            statusDistribution: statusStats,
            paymentMethodDistribution: paymentStats
        });
    }
    catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map