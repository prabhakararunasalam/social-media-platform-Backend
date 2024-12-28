import User from "../Models/authSchema.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import sendEmail from "../Utils/sendEmail.js";
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (req, res) => {
   

    try { 
        const { username, email, password } = req.body;
        //check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        //create new user
        const newUser = new User({
            username,
            email,
            password,
        });

        //save user to database
        await newUser.save();


        //send response
        res.status(201).json({message:"User registered successfully" , User:{
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            password: newUser.password,
        }});
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

//login user
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        //check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        //check if password is correct
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        //generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        user.token = token;
        await user.save();
        const sanitizedUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            follwers: user.followers,
            following: user.following,
            profileimg: user.profileimg,
            coverImg: user.coverImg,
            token: user.token
            
        }

        return res.cookie("token", token, {
            httponly: true,
            samesite:"strict",
            maxAge: 24 * 60 * 60 * 1000,
        }).json({message:`WELCOME BACK ${sanitizedUser.username}`,
            success: true,
            user: sanitizedUser
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

//logout user
export const logoutUser = async (req, res) => {
    try {
        res.cookie("token", "", {maxAge:0});
        return res.status(200).json({ message: "User logged out successfully" , success: true});
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }   
}

//getMe
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
}
//forgot password

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        //check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        //generate token
        const resetToken = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        //send email
        const resetUrl = `process.env.URL/reset-password/${resetToken}`;
        const message = `Click on the link to reset your password: \n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
        await sendEmail({
            email : user.email,
            subject: "Password Reset",
            message,
        });

        //send response
        res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

//REset password 

export const resetPassword = async (req, res) => {
    const {token} = req.params;
    const {password} = req.body;

    try {
        //check if token is valid   
        const user = await User.findOne({ resetPasswordToken: token });
        if (!user) {
            return res.status(404).json({ message: "Invalid token" });
        }

        //check if token has expired
        if (user.resetPasswordExpire < Date.now()) {
            return res.status(400).json({ message: "Token has expired" });
        }

        //update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        //send response        
        res.status(200).json({message:"Password reset successfully"});
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}
