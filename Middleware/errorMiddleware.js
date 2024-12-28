import dotenv from "dotenv";
dotenv.config();

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message : err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};

export default errorMiddleware;