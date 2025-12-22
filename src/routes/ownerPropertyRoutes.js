import express from "express";
import { step1, step2, getPropertyAmenities, getPropertySharedSpaces, getPropertySafetyFeatures, step3, fetchPropertyClassificationCategories, isRoomAvailableinProperty, getRoomTypes, getSafetyFeatures, getSharedSpaces, getAmenities, getProperties, getSpecificOwnerProperties } from "../Controller/ownerPropertyController.js";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// http://localhost:3000/api/ownerProperty/step1

router.post(
  "/step1",
  verifyAuthentication,
  upload.fields([{ name: "residentialdocpdf", maxCount: 1 }]),
  step1
);

// http://localhost:3000/api/ownerProperty/fetchPropertyClassificationCategories

router.get("/fetchPropertyClassificationCategories", fetchPropertyClassificationCategories)
router.get("/fetchPropertyClassificationCategories/:id", fetchPropertyClassificationCategories)


// http://localhost:3000/api/ownerProperty/step2

router.post(
  "/step2",
  verifyAuthentication,
  upload.fields([
    { name: "photo1_featured", maxCount: 1 },
    { name: "photo2", maxCount: 1 },
    { name: "photo3", maxCount: 1 },
    { name: "photo4", maxCount: 1 },
    { name: "photo5", maxCount: 1 }
  ]),
  step2
);

router.post(
  "/isRoomAvailableinProperty",
  verifyAuthentication,
  isRoomAvailableinProperty
);


router.post("/getPropertyAmenities", verifyAuthentication, getPropertyAmenities);
router.post("/getPropertySafetyFeatures", verifyAuthentication, getPropertySafetyFeatures);
router.post("/getPropertySharedSpaces", verifyAuthentication, getPropertySharedSpaces);



router.post(
  "/step3",
  verifyAuthentication,
  upload.any(),
  step3
);

// http://localhost:3000/api/ownerProperty/getSpecificOwnerProperties
router.get("/getSpecificOwnerProperties/:id", getSpecificOwnerProperties);
router.get("/roomtypes", getRoomTypes);
router.get("/roomtypes/:id", getRoomTypes);
router.get("/safetyfeatures", getSafetyFeatures);
router.get("/safetyfeatures/:id", getSafetyFeatures);
router.get("/sharedspaces", getSharedSpaces);
router.get("/sharedspaces/:id", getSharedSpaces);
router.get("/amenities", getAmenities);
router.get("/amenities/:id", getAmenities);
router.get("/getProperties/:id", getProperties)
router.get("/getProperties", getProperties)

export default router;