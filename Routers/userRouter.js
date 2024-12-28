import express from "express";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import {
  Follow,
  getNotifications,
  getSuggestedUsers,
  getUserProfile,
  searchUser,
  unfollow,
  updateProfile,
} from "../Controllers/userController.js";

const router = express.Router();

router.get("/profile/:id", authMiddleware, getUserProfile);
router.get("/suggested/:id", authMiddleware, getSuggestedUsers);
router.post("/follow/:id", authMiddleware, Follow);
router.post("/Unfollow/:id", authMiddleware, unfollow);
router.post("/update", authMiddleware, updateProfile);
router.get("/search", authMiddleware, searchUser);
router.get("/notifications", authMiddleware, getNotifications);

export default router;
