import './config.js';
import express from 'express';
import cors from "cors";
import multer from "multer";
import path from "path";
import errorHandling from './middleware/errorHandling.js';
import loggerHandling from './middleware/loggerHandling.js';
import notFoundHandling from './middleware/notFoundHandling.js';
import resourcesRoutes from './routes/resourcesRoute.js';
import accountsRoutes from './routes/accountsRoute.js';
import activitiesRoutes from './routes/activitiesRoute.js';
import transactionsRoutes from './routes/transactionsRoutes.js';
import chartsRoutes from './routes/chartsRoutes.js';
import authsRoutes from './routes/authsRoutes.js';
import db from './db.js';
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


app.use(loggerHandling);
app.use(express.json());

async function testDbConnection() {
  try {
    const result = await db.query("SELECT NOW()");
    console.log("PostgreSQL connection successful:", result.rows[0]);
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

app.use('/api/resources', resourcesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/activity', activitiesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/charts/', chartsRoutes);
app.use('/api/auth', authsRoutes);

// FINAL MIDDLEWARES
app.use(notFoundHandling);
app.use(errorHandling);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await testDbConnection();
}); 
