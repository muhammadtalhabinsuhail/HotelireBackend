import express from "express";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";
import { 
  getOwnerProperties, 
  updatePropertyStatus 
} from "../Controller/propertyStatusController.js";

const router = express.Router();

router.get("/properties", verifyAuthentication, getOwnerProperties);
router.post("/update-property-status", verifyAuthentication, updatePropertyStatus);

export default router;
