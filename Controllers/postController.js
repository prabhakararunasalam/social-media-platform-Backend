import Post from "../Models/postSchema.js";
import User from "../Models/authSchema.js";
import cloudinary from "../Config/cloudinary.js";
import Notification from "../Models/notificationSchema.js";


export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let mediaUrl = "";
    let mediaType = "none";
    //check if a file is uploaded
    if (req.file && req.file.path) {
      try {
        const fileType = req.file.mimetype.split("/")[0]; //image or video
        if (fileType === "image") {
          //upload image to cloudinary
          const uploadResponse = await cloudinary.uploader.upload(
            req.file.path
          );
          mediaUrl = uploadResponse.secure_url;
          mediaType = "image";
        } else if (fileType === "video") {
          //upload video to cloudinary
          const uploadResponse = await cloudinary.uploader.upload(
            req.file.path,
            {
              resource_type: "video",
              folder: "social-media-platform/videos",
            }
          );
          mediaUrl = uploadResponse.secure_url;
          mediaType = "video";
        } else {
          return res
            .status(400)
            .json({
              message: "Invalid file type.Only images and videos are allowed",
            });
        }
      } catch (error) {
        return res
          .status(500)
          .json({ message: "file upload failed", error: error.message });
      }
    }
    //validate input
    if (!text && mediaUrl) {
      return res
        .status(400)
        .json({ message: "both text and media is required" });
    }

    //get the user who is creating the post
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //create and save the post
    const newPost = new Post({
      user: userId,
      text,
      media: mediaUrl, //media is the url of the image or video
      mediaType, //image or video or none
    });

    await newPost.save();

    //send response
    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.log("Error in createPost controller", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

//get all posts
export const getAllPosts = async (req, res) => {
  try {
    const { userId, filtertype } = req.query; //filtertype is either "following" or "all"

    let posts;

    //fetch post of following users
    if (filtertype === "following") {
      const user = await User.findById(userId);
      const followingUsers = user.following;

      posts = await Post.find({ user: { $in: followingUsers } })
        .populate({
          path: "user",
          select: "-password",
        })
        .sort({ createdAt: -1 }),
        populate({
          path: "comments.user",
          select: "-password",
        });
    } else {
      //fetch all posts
      posts = await Post.find({})
        .populate({
          path: "user",
          select: "-password",
        })
        .sort({ createdAt: -1 })
        .populate({
          path: "comments.user",
          select: "-password",
        });
    }

    if (posts.length === 0) {
      //while fetching posts, if no posts found
      return res.status(404).json({ message: "No posts found" });
    }

    //send response
    res.status(200).json({ message: "Posts fetched successfully", posts });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//delete post

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user.id.toString()) {
      return res
        .status(401)
        .json({ message: "you are unauthorised to delete this post" });
    }
    if (post.media) {
      const mediaId = post.media.split("/")[4].split(".")[0];
      await cloudinary.uploader.destroy(mediaId);
    }
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "something went wrong" });
  }
};

//like unlike post

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const User_Liked_post = post.likes.includes(userId);

    if (User_Liked_post) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } }); //this is for likes

      const updatedLikes = await User.updateOne(
        { _id: userId },
        { $pull: { likedPosts: postId } }
      );

      res
        .status(200)
        .json({ message: "Post unliked successfully", updatedLikes });
    } else {
      post.likes.push(userId);

      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });

      await post.save();

      res.status(200).json({ message: "Post liked successfully" });

      //notification
      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();
    }
  } catch (error) {
    console.log("Error in likeUnlikePost controller", error);
    res.status(500).json({ message: "Internal Server error" });
  }
};

//comment post

export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: postId } = req.params;

    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = {
      user: userId,
      text,
      createdAt: new Date(),
    };

    post.comments.push(comment);

    await post.save();

    const populatedPost = await Post.findById(postId).populate(
      "comments.user",
      "username"
    );

    const newComment =
      populatedPost.comments[populatedPost.comments.length - 1];

    res
      .status(200)
      .json({
        message: "Comment added successfully",
        comment: newComment,
        success: true,
      });

    //notification
    const notification = new Notification({
      from: userId,
      to: post.user,
      type: "comment",
    });
    await notification.save();
  } catch (error) {
    console.log("Error in commentPost controller", error);
    res.status(500).json({ message: "Internal Server error" });
  }
};
