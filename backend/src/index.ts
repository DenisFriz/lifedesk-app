import 'dotenv/config';
import cluster from 'node:cluster';
import os from 'node:os';
import app from './app.js';
import { connectDB } from '@db/connection.js';

const PORT = process.env.PORT || 3001;
const numCPUs = os.cpus().length;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`✅ Worker ${process.pid} running on port ${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}`);
  });
}

if (cluster.isPrimary) {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`🧠 Spawning ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}
