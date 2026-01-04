import express from "express";
import { sendContactMail} from "../utils/contactMail.js";



const router = express.Router();

router.post("/send", sendContactMail);




export default router;