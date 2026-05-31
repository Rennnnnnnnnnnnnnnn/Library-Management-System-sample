import express from 'express';
import { getAccountDetails, getItemDetails, addActivity, getActivities, getBorrowedItemDetails, editActivity, deleteActivity, downloadActivities } from '../controllers/activitiesController.js';

const router = express.Router();

router.get('/account/:student_number', getAccountDetails);
router.get("/item/:item_id", getItemDetails);
router.post("/addActivity", addActivity);
router.get('/getActivities', getActivities);
router.get('/getBorrowedItemDetails/:item_id', getBorrowedItemDetails);
router.put('/editActivity/:act_id', editActivity);
router.delete('/deleteActivity/:act_id', deleteActivity);
router.get('/downloadActivities', downloadActivities);

export default router;
