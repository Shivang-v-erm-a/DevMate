import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error('MongoDB URI is undefined. Please check your .env file.');
    process.exit(1); // Exit process if URI is undefined
}

mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));
