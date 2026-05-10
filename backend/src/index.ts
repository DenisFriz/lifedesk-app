import 'dotenv/config';
import app from './app.js';
import { connectDB } from '@db/connection.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}`);
      console.log(`🧠 Process ID: ${process.pid}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
