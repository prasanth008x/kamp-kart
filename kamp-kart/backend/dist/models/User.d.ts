import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    avatar?: string;
    phone?: string;
    addresses: Array<{
        type: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        isDefault: boolean;
    }>;
    cart: Array<{
        product: mongoose.Types.ObjectId;
        quantity: number;
        size?: string;
        color?: string;
        addedAt: Date;
    }>;
    wishlist: mongoose.Types.ObjectId[];
    orders: mongoose.Types.ObjectId[];
    isAdmin: boolean;
    isActive: boolean;
    lastLogin: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map