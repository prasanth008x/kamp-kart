"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kampkart';
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Handle connection events
        mongoose_1.default.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.log('Mongoose connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('⚠️  MongoDB connection failed:', error.message);
        console.log('📝 Running in demo mode without database');
        console.log('🚀 Server will start but database features will be limited');
        // Don't exit - continue running for demo purposes
    }
};
exports.default = connectDB;
//# sourceMappingURL=database.js.map