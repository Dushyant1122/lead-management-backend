import { Router } from "express";
import {
  createUser,
  updateUserById,
  getAllUsers,
  getUserById,
  sendOtp,
  verifyOtp,
  logoutUser,
  getMyBackends,
} from "../controllers/user.controller";
import { verifyAccessToken } from "../middlewares/auth.middlewares";

function userRouter() {
  const router = Router();

  router.route("/send-otp").post(sendOtp);
  router.route("/verify-otp").post(verifyOtp);
  router.use(verifyAccessToken);

  router.route("/").post(createUser);

  router.route("/").get(getAllUsers);
  router.route("/:userId").get(getUserById).patch(updateUserById);
  // .delete();
  router.route("/logout").post(logoutUser);
  router.route("/get-backend").post(getMyBackends);

  return router;
}

export default userRouter;
