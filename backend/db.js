import mongoose from 'mongoose'
import { config } from 'dotenv';

config(); // Load environment variables

// Connect to MongoDB
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloudwallet');
  console.log('Connected to MongoDB successfully');
} catch (error) {
  console.error('MongoDB connection error:', error);
}

const UserSchema = mongoose.Schema({
    email: String,
    password: String,
    publicKey: String,
    privateKey: String
}) 

const userModel = mongoose.model("users", UserSchema);

export { userModel };