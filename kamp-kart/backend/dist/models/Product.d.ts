import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IProduct, {}, {}, {}, mongoose.Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Product.d.ts.map