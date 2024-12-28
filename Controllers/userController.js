import User from "../Models/authSchema.js";
import cloudinary from "../Config/cloudinary.js";
import Notification from "../Models/notificationSchema.js";
import bcrypt from "bcrypt";

export const getUserProfile = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("error in getUserProfile", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const Follow = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const userToFollowId = req.params.id;

    const userToFollow = await User.findById(userToFollowId);
    const currentUser = await User.findById(loggedInUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    //check the current user is already following the user
    if (!userToFollow.followers.includes(loggedInUserId)) {
      //user is not following the user, so follow the user
      await userToFollow.updateOne({ $push: { followers: loggedInUserId } });
      await currentUser.updateOne({ $push: { following: userToFollowId } });

      //notification
      const notification = new Notification({
        from: loggedInUserId,
        to: userToFollowId,
        type: "follow",
      });
      await notification.save();

      //send response
      res.status(200).json({ message: "User followed successfully" });
    } else {
      //user is already following the user, return an simple message
      res.status(400).json({
        message: `You are already following ${userToFollow.username}`,
      });
    }
  } catch (error) {
    console.log("error in Follow", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//unfollow

export const unfollow = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const userToUnfollowId = req.params.id;

    const userToUnfollow = await User.findById(userToUnfollowId);
    const currentUser = await User.findById(loggedInUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    //check the current user is already following the user
    if (userToUnfollow.followers.includes(loggedInUserId)) {
      //user is following the user, so unfollow the user
      await userToUnfollow.updateOne({ $pull: { followers: loggedInUserId } });
      await currentUser.updateOne({ $pull: { following: userToUnfollowId } });

      //send response
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      //user is not following the user, return an simple message
      res.status(400).json({
        message: `You are not following ${userToUnfollow.username}`,
      });
    }
  } catch (error) {
    console.log("error in unfollow", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//suggestions

export const getSuggestedUsers = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const otherUsers = await User.find({ _id: { $ne: id } }).select(
      "-password"
    );

    //check if no other users are found
    if (otherUsers.length === 0) {
      return res
        .status(404)
        .json({ message: "currently, No Users are available To Follow" });
    }

    return res.status(200).json(otherUsers);
  } catch (error) {
    console.log("error in getSuggestedUsers", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//update Profile

export const updateProfile = async (req, res) => {
  const { fullName, bio, username, currentpassword, newPassword, link } =
    req.body;

  let { profileImg, coverImg, ...otherData } = req.body;

  const userId = req.user._id;

  try {
    const updatedFields = { ...otherData };
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      (!newPassword && currentpassword) ||
      (newPassword && !currentpassword)
    ) {
      return res
        .status(400)
        .json({ message: "Current Password and New Password are required" });
    }

    if (newPassword && currentpassword) {
      const isMatch = await bcrypt.compare(currentpassword, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current Password is incorrect" });
      }
      if (newPassword.length < 5) {
        return res
          .status(400)
          .json({ message: "Password must be at least 5 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/")[4].split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    //password should be null in response

    user.password = null;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedFields,
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.log("error in updateProfile", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//search user

export const searchUser = async (req, res) => {
  try {
    const { query } = req.query; //get theserch terms in query parameters

    //search for users by username or fullname
    const users = await User
      .find({
        $or: [
          { username: { $regex: query, $options: "i" } },
          { fullName: { $regex: query, $options: "i" } },
        ],
      })
      .select("-password");

    // Return matching users
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error in searchUsers: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

//get notification

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification
      .find({ to: userId })
      .populate("from", "username profileImg")
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.log("Error fetching notifications: ", error.message);
    res.status(500).json({ error: error.message });
  }
};
