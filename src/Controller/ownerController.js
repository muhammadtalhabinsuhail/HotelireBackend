import { uploadImageToCloudinary, uploadPdfToCloudinary } from "../middlewares/uploadHandler.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

dotenv.config();


const createOwnerInfo = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "User is not Signed In" });
    }

    // console.log("USERID = ", req.user.user.userid);

    const data = {
      legalfullname: req.body.legalfullname,
      displayname: req.body.displayname,
      iddocpic: null,
      residentialdocpdf: null,

      owner_iddocpictype: {
        connect: {
          pictypeid: parseInt(req.body.idType),
        }
      },

      owner_residentialdocpdftype: {
        connect: {
          pdftypeid: parseInt(req.body.proofType),
        }
      },

      // selected type for doc img of owner ki id hai
      // selected type for doc pdf of owner ki id hai
      User: {
        connect: { userid: req.user.user.userid }   // Connect existing user by ID
      }
    };

    const data2 = {
      email: req.body.email,
      address: req.body.address,
      postalcode: req.body.postalCode,
      phoneno: req.body.phone,

      canadian_states: {
        connect: { canadian_province_id: parseInt(req.body.canadian_provinceid) }
      },
      canadian_cities: {
        connect: { canadian_city_id: parseInt(req.body.canadian_cityid) }
      },

      role: {
        connect: { roleid: 2 }
      }

    };



    console.log(data)
    console.log(data2)


    if (!data.legalfullname) {
      return res.status(400).json({ message: "Legal Full Name is required." });
    }

    const idDoc = req.files?.iddocpic?.[0];
    const pdfDoc = req.files?.residentialdocpdf?.[0];

    if (!idDoc || !pdfDoc) {
      return res
        .status(400)
        .json({ message: "Both ID document and residential PDF are required" });
    }

    // Validate sizes
    if (idDoc && idDoc.size > 1 * 1024 * 1024)
      return res.status(400).json({ message: "Image size must be less than 1MB" });

    if (pdfDoc && pdfDoc.size > 3 * 1024 * 1024)
      return res.status(400).json({ message: "PDF size must be less than 3MB" });

    // Upload files to different Cloudinary accounts
    const imageUrl = await uploadImageToCloudinary(
      idDoc.buffer,
      idDoc.originalname
    );
    const pdfUrl = await uploadPdfToCloudinary(
      pdfDoc.buffer,
      pdfDoc.originalname
    );

    data.iddocpic = imageUrl;
    data.residentialdocpdf = pdfUrl;

    console.log(data)
    console.log(data2)

    const ExistingUser = await prisma.ownerinfo.findFirst({
      where: { userid: req.user.user.userid },
    });
    console.log('ExistingUser', ExistingUser)

    if (ExistingUser) {
      const updatedUserInfo = await prisma.ownerinfo.update({
        where: { userid: req.user.user.userid },
        data: data,
      });
    } else {
      const newUserInfo = await prisma.ownerinfo.create({
        data: data,
      });
    }

    const SignUpUser = prisma.User.findUnique({
      where: { userid: req.user.user.userid },
    });

    if (!SignUpUser) {
      res.status(500).json({
        message: "Error creating OwnerInfo! User must sign in again.",
        error: error.message,
      });
    }

    const SignUpUserUpdate = await prisma.User.update({
      where: { userid: req.user.user.userid },
      data: data2,
    });


      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      });

      const isUserExist = await prisma.User.findFirst(
        {
          where: { email: data2.email }
        }
      );

      console.log('isUserExist', isUserExist);


      const { passwordhash, ...userWithoutPassword } = isUserExist;

      console.log('userWithoutPassword', userWithoutPassword);

      const token = await jwt.sign({ user: userWithoutPassword }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });


      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });


    res.status(201).json({
      message: "OwnerInfo successfully saved.",
    });

  } catch (error) {
    console.error(error);
    console.log("Error creating OwnerInfo:", error);
    res.status(500).json({
      message: "Error creating OwnerInfo",
      error: error.message,
    });
  }
};



const fetchOwnerIdDocPic_Categories = async (req, res) => {
  try {
    var OwnerIdDocPic_Categories = await prisma.owner_iddocpictype.findMany();
    if (OwnerIdDocPic_Categories == "") {
      return res.status(404).json({
        message: " Owner ID Document Picture Categories not found"
      });
    }
    res.status(200).json({
      message: " Owner ID Document Picture Categories fetched successfully",
      data: OwnerIdDocPic_Categories
    });
  } catch (ex) {

    res.json({
      message: "Error in fetching Owner ID Document Picture Categories",
      error: ex.message
    });
  }
}


const fetchOwnerResidentialDocPdf_Categories = async (req, res) => {
  try {
    var OwnerResidentialDocPdf_Categories = await prisma.owner_residentialdocpdftype.findMany();
    if (OwnerResidentialDocPdf_Categories == "") {
      return res.status(404).json({
        message: " Owner Residential Document Pdf Categories not found"
      });
    }
    res.status(200).json({
      message: " Owner  Residential Document Pdf  Categories fetched successfully",
      data: OwnerResidentialDocPdf_Categories
    });
  } catch (ex) {

    res.json({
      message: "Error in fetching Owner Residential Document Pdf  Categories",
      error: ex.message
    });
  }
}


export { createOwnerInfo, fetchOwnerIdDocPic_Categories, fetchOwnerResidentialDocPdf_Categories }; 
