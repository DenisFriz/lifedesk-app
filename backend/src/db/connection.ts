import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/lifedesk';

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err);
  });
}
