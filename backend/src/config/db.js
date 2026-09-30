const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pydahsoft';
    const uri = rawUri.trim().replace(/^["']|["']$/g, '');
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
