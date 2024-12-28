import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendEmail = async ({ email, subject, message }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.PASS_MAIL,
                pass: process.env.PASS_KEY,
            },
        });

        const mailOptions = {
            from: process.env.PASS_MAIL,
            to: email,
            subject,
            text: message,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log("Error sending email:", error);
        throw new Error("Failed to send email");
    }
};