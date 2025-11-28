import multer from "multer";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadImageToCloudinary = async (fileBuffer) => {
 
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_IMAGE_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_IMAGE_API_KEY,
    api_secret: process.env.CLOUDINARY_IMAGE_API_SECRET,
  });

  const compressed = await sharp(fileBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "owner_id_images",
        resource_type: "image",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    ).end(compressed);
  });
};


export const uploadPdfToCloudinary = async (fileBuffer) => {

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_PDF_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_PDF_API_KEY,
    api_secret: process.env.CLOUDINARY_PDF_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "owner_doc_pdfs",
        resource_type: "raw",
        public_id: Date.now().toString(),
        format: "pdf",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};
