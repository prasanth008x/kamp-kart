"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const VariantSchema = new mongoose_1.Schema({
    size: { type: String },
    color: { type: String },
    stock: { type: Number, required: true, min: 0 },
    price: { type: Number }
});
const ProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: [
            'electronics', 'mobile', 'laptops', 'headphones', 'accessories',
            'fashion', 'men', 'women', 'kids',
            'dresses', 'shirts', 'pants', 'shoes', 'watches',
            'home', 'kitchen', 'furniture', 'decor',
            'beauty', 'skincare', 'makeup', 'fragrance',
            'sports', 'fitness', 'outdoor',
            'books', 'toys', 'games'
        ]
    },
    subcategory: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    discount: { type: Number, min: 0, max: 100 },
    images: [{ type: String, required: true }],
    specifications: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed
    },
    variants: [VariantSchema],
    stock: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
    },
    reviews: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Review' }],
    tags: [{ type: String }],
    seller: {
        name: { type: String, required: true },
        rating: { type: Number, default: 4.0, min: 0, max: 5 },
        location: { type: String, required: true }
    },
    shipping: {
        free: { type: Boolean, default: false },
        cost: { type: Number, default: 0 },
        estimatedDays: { type: Number, default: 7 }
    }
}, {
    timestamps: true
});
// Index for better search performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ 'rating.average': -1 });
ProductSchema.index({ featured: -1, createdAt: -1 });
exports.default = mongoose_1.default.model('Product', ProductSchema);
//# sourceMappingURL=Product.js.map