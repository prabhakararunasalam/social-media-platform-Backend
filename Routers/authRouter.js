import express from "express";
import { forgotPassword, getMe, loginUser, registerUser, resetPassword } from "../Controllers/authController.js";


const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", getMe);

export default router;