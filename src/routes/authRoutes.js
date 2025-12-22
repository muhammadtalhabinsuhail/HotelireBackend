import express from "express";
import { getGoogleLoginPage, handleGoogleCallback, checkEmail, verifyCode,forgotPassword, signUp, login, getCanadianProvinces,getCanadianCities,me, logout, specificCityById, specificProvinceById} from "../Controller/authController.js";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.get("/", (req, res) => res.send("Hello"));
router.post("/checkEmail",checkEmail)
router.post("/verifyCode",verifyCode)
router.post("/signUp",signUp)
router.post("/login",login)
router.get("/google", getGoogleLoginPage);
router.get("/google/callback", handleGoogleCallback);
router.get("/getCanadianProvinces/:id", getCanadianProvinces);
router.get("/getCanadianProvinces", getCanadianProvinces);
router.get("/getCanadianCities/:id", getCanadianCities);  //by province id
router.get("/specificCityById/:id", specificCityById);  
router.get("/specificProvinceById/:id", specificProvinceById);
router.get('/me', verifyAuthentication, me);
router.post('/forgotPassword', forgotPassword);


router.post("/logout",logout)
// router.get("/profile", verifyAuthentication, getProfile);

export default router;