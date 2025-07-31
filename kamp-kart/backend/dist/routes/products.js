"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Product_1 = __importDefault(require("../models/Product"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all products with filtering and pagination
router.get('/', auth_1.optionalAuth, async (req, res) => {
    try {
        const { category, subcategory, brand, minPrice, maxPrice, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20, featured } = req.query;
        // Build filter object
        const filter = { isActive: true };
        if (category)
            filter.category = category;
        if (subcategory)
            filter.subcategory = subcategory;
        if (brand)
            filter.brand = new RegExp(brand, 'i');
        if (featured === 'true')
            filter.featured = true;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice)
                filter.price.$gte = Number(minPrice);
            if (maxPrice)
                filter.price.$lte = Number(maxPrice);
        }
        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { tags: new RegExp(search, 'i') },
                { brand: new RegExp(search, 'i') }
            ];
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Pagination
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        // Execute query
        const [products, totalCount] = await Promise.all([
            Product_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .select('-specifications'),
            Product_1.default.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        res.json({
            products,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            filters: {
                category,
                subcategory,
                brand,
                minPrice,
                maxPrice,
                search
            }
        });
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get product by ID
router.get('/:id', auth_1.optionalAuth, async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product || !product.isActive) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ product });
    }
    catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get products by category
router.get('/category/:category', auth_1.optionalAuth, async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const [products, totalCount] = await Promise.all([
            Product_1.default.find({ category, isActive: true })
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .select('-specifications'),
            Product_1.default.countDocuments({ category, isActive: true })
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        res.json({
            products,
            category,
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
        console.error('Get category products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get featured products
router.get('/featured/all', auth_1.optionalAuth, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const limitNum = Math.min(20, Math.max(1, Number(limit)));
        const products = await Product_1.default.find({ featured: true, isActive: true })
            .sort({ 'rating.average': -1, createdAt: -1 })
            .limit(limitNum)
            .select('-specifications');
        res.json({ products });
    }
    catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get all categories with product counts
router.get('/categories/all', async (req, res) => {
    try {
        const categories = await Product_1.default.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    subcategories: { $addToSet: '$subcategory' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        res.json({ categories });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Search products
router.get('/search/:query', auth_1.optionalAuth, async (req, res) => {
    try {
        const { query } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        // Text search with scoring
        const [products, totalCount] = await Promise.all([
            Product_1.default.find({
                $text: { $search: query },
                isActive: true
            }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .skip(skip)
                .limit(limitNum)
                .select('-specifications'),
            Product_1.default.countDocuments({
                $text: { $search: query },
                isActive: true
            })
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        res.json({
            products,
            query,
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
        console.error('Search products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get related products
router.get('/:id/related', auth_1.optionalAuth, async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const relatedProducts = await Product_1.default.find({
            _id: { $ne: product._id },
            $or: [
                { category: product.category },
                { brand: product.brand },
                { tags: { $in: product.tags } }
            ],
            isActive: true
        })
            .sort({ 'rating.average': -1, createdAt: -1 })
            .limit(8)
            .select('-specifications');
        res.json({ relatedProducts });
    }
    catch (error) {
        console.error('Get related products error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map