import express from "express";
import { createOwnerInfo , fetchOwnerIdDocPic_Categories,fetchOwnerResidentialDocPdf_Categories} from "../Controller/ownerController.js";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";
import multer from "multer";


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });



// http://localhost:3000/api/owner/ownerinfo

router.post(
  "/ownerinfo",
  verifyAuthentication,
  upload.fields([{ name: "iddocpic", maxCount: 1 }, { name: "residentialdocpdf", maxCount: 1 }]),
  createOwnerInfo
);





router.get("/ownerdocpictypes", verifyAuthentication, fetchOwnerIdDocPic_Categories);
router.get("/ownerdocpdftypes",  verifyAuthentication, fetchOwnerResidentialDocPdf_Categories);


export default router;