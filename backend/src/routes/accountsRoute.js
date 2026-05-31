import express from 'express';

import {
    getAccounts,
    getCoursesWithSections,
    addAccount,
    deleteAccount,
    editAccount,
    getAccountActivitiesByID,
    downloadAccounts
} from '../controllers/accountsController.js';

import { upload } from "../middleware/multer.js"; // the multer config above


const router = express.Router();

router.get('/getAccounts', getAccounts);
router.get('/courses-with-sections', getCoursesWithSections);
router.delete('/:student_number', deleteAccount);
router.post("/addAccount", upload.single("profileImage"), addAccount);
router.put('/:student_number', upload.single("profileImage"), editAccount);
router.get('/transactions/:student_number', getAccountActivitiesByID);
router.get('/downloadAccounts', downloadAccounts);

export default router;
