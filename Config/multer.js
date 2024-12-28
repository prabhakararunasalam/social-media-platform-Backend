import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "social-media-platform",
        allowedFormats: ["jpg", "png", "jpeg", "mp4", "avi", "gif", "webp", "mov", "mkv"],
    },
});

const upload = multer({ storage: storage });

export default upload;