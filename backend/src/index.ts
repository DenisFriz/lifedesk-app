import 'dotenv/config';
import app from './app.js';
import { connectDB } from '@db/connection.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
