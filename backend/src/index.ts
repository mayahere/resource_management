import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import userRouter from './routes/users';
import employeeRouter from './routes/employees';
import projectRouter from './routes/projects';
import allocationRouter, { releaseExpiredAllocations } from './routes/allocations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/projects', projectRouter);
app.use('/api/resource-requests', allocationRouter);

// Root test route
app.get('/', (req, res) => {
  res.json({ message: 'HRRAMS API Server is running' });
});

// Periodic release of expired allocations (every 1 hour)
setInterval(() => {
  console.log('Running scheduled allocation release...');
  releaseExpiredAllocations();
}, 1000 * 60 * 60);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Initial run of auto-release on server start
  releaseExpiredAllocations();
});
