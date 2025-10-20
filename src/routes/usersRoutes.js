import express from "express";
import { createUser, fetchAllUsers, updateUserByUser, fetchSpecificUser } from "../Controller/usersController.js";

const router = express.Router();

router.post('/', createUser);   
router.get('/',fetchAllUsers);
router.put('/:id',updateUserByUser);
router.get('/:id',fetchSpecificUser)

export default router;

