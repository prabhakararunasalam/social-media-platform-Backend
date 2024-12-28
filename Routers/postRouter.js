import express from "express";
import { authMiddleware } from "../Middleware/authMiddleware.js";
import {
  commentPost,
  createPost,
  deletePost,
  getAllPosts,
  likeUnlikePost,
} from "../Controllers/postController.js";

const router = express.Router();

router.post("/create", authMiddleware, createPost);
router.get("/all", authMiddleware, getAllPosts);
router.delete("/delete/:id", authMiddleware, deletePost);
router.post("/like/:id", authMiddleware, likeUnlikePost);
router.post("/comment/:id", authMiddleware, commentPost);

export default router;
