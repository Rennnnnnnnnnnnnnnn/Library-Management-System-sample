import express from 'express';
import {
    getResourcesTypes,
    getTotalAccounts,
    getTotalCheckedOutItems,
    getTopBorrowedItems,
    getActivityStats,
    getTotalAcademicPapers,
    getTotalBooks
}
    from '../controllers/chartsController.js';

const router = express.Router();

router.get('/getResourcesTypes/:selectedCategory', getResourcesTypes);
router.get('/getTotalAccounts', getTotalAccounts);
router.get('/getTotalCheckedOutItems', getTotalCheckedOutItems);
router.get("/top-borrowed-items", getTopBorrowedItems);
router.get("/activity-stats", getActivityStats);
router.get("/getTotalAcademicPapers", getTotalAcademicPapers);
router.get("/getTotalBooks", getTotalBooks);

export default router;
