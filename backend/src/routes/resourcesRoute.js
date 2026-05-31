import express from 'express';
import { addResources, getResources, getDistinctTypes, getBookCopies, updateResource, deleteResource, downloadResources } from '../controllers/resourcesController.js';

const router = express.Router();

router.get('/', getResources);
router.get('/types', getDistinctTypes);
router.post('/addResources', addResources);
router.get('/getBookCopies', getBookCopies);
router.put("/updateResource", updateResource)
router.delete('/:category/:item_id', deleteResource);
router.get('/downloadResources', downloadResources)

export default router;
