import mongoose, { Document, Schema } from 'mongoose';

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

const OrderItemSchema = new Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String },
  color: { type: String },
  image: { type: String, required: true }
});

const ShippingAddressSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: 'India' }
});

const TrackingSchema = new Schema({
  number: { type: String },
  carrier: { type: String },
  url: { type: String }
});

const OrderSchema = new Schema<IOrder>({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return 'KK' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  shippingAddress: ShippingAddressSchema,
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['cod', 'phonepe', 'gpay', 'paytm', 'card', 'netbanking', 'upi', 'qr']
  },
  paymentStatus: { 
    type: String, 
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded']
  },
  paymentId: { type: String },
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'placed',
    enum: ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned']
  },
  tracking: TrackingSchema,
  estimatedDelivery: { 
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 7); // Default 7 days delivery
      return date;
    }
  },
  deliveredAt: { type: Date },
  notes: { type: String }
}, {
  timestamps: true
});

// Index for better query performance
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);