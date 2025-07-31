import mongoose, { Document } from 'mongoose';
export interface IOrder extends Document {
    orderNumber: string;
    user: mongoose.Types.ObjectId;
    items: Array<{
        product: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        size?: string;
        color?: string;
        image: string;
    }>;
    shippingAddress: {
        name: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentMethod: string;
    paymentStatus: string;
    paymentId?: string;
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    total: number;
    status: string;
    tracking?: {
        number: string;
        carrier: string;
        url: string;
    };
    estimatedDelivery: Date;
    deliveredAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Order.d.ts.map