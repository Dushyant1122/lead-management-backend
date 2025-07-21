import { Router } from "express";
import {
  createTVR,
  getAllTVRs,
  getTVRById,
  updateTVR,
  deleteTVR,
} from "../controllers/tvr.controller";
import { verifyAccessToken } from "../middlewares/auth.middlewares";

function tvrRouter() {
  const router = Router();

  router.use(verifyAccessToken);

  router.route("/").get(getAllTVRs);
  router.route("/lead/:leadId").post(createTVR);

  router
    .route("/:id")
    
    .get(getTVRById)
    .put(updateTVR)
    .delete(deleteTVR);

  return router;
}

export default tvrRouter;
