import express from "express";
import dotenv from "dotenv";
import connectDB from "./Config/dbConfig.js";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoute from "./Routers/authRouter.js";
import postRoute from "./Routers/postRouter.js";
import userRoute from "./Routers/userRouter.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

connectDB();

const corsOptions = {
  origin: process.env.URL,
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => res.send("welcome to backend"));

app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("./api/users", userRoute);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`server running on port ${PORT}`));
