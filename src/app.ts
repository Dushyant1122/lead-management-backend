import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes";
import errorHandler from "./middlewares/error.middlewares";
import ApiError from "./utils/apiError";
import ApiResponse from "./utils/apiResponse";
import leadRouter from "./routes/lead.routes";

const app = express();

function startApp() {
  // CORS settings
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Parse the request body data into json format
  app.use(express.json());

  app.use(cookieParser());

  // api for test purpose
  app.get("/homeone", (req, res) => {
    res.json(
      new ApiResponse(200, { route: "homeone" }, "test working properly")
    );
  });

  app.use("/api/v1/users", userRouter());
  app.use("/api/v1/leads", leadRouter());

  // Handle any route which is not defined
  app.use((req, res) => {
    throw new ApiError(
      404,
      `The requested URL ${req.baseUrl} was not found on this server`
    );
  });

  // Error handle middleware
  app.use(errorHandler);
}

export { startApp };
export default app;
