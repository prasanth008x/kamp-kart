import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  specifications: Map<string, any>;
  variants: Array<{
    size?: string;
    color?: string;
    stock: number;
    price?: number;
  }>;
  stock: number;
  isActive: boolean;
  featured: boolean;
  rating: {
    average: number;
    count: number;
  };
  reviews: mongoose.Types.ObjectId[];
  tags: string[];
  seller: {
    name: string;
    rating: number;
    location: string;
  };
  shipping: {
    free: boolean;
    cost: number;
    estimatedDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema({
  size: { type: String },
  color: { type: String },
  stock: { type: Number, required: true, min: 0 },
  price: { type: Number }
});

const ProductSchema = new Schema<IProduct>({
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
    of: Schema.Types.Mixed
  },
  variants: [VariantSchema],
  stock: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
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

export default mongoose.model<IProduct>('Product', ProductSchema);