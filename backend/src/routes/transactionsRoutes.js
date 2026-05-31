import express, { Router } from 'express';
import { downloadTransactions, getTransactionByItemId, getTransactions } from '../controllers/transactionsController.js';

const router = express.Router();

router.get('/', getTransactions);
router.get('/getTransactionByItemId/:item_id', getTransactionByItemId);
router.get('/downloadTransactions', downloadTransactions);

export default router;
