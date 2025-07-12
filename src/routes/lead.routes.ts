import { Router } from "express";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/auth.middlewares";
import { UserRoleValues } from "../constants";
import {
  assignLeadsToTelecaller,
  getManagerLeads,
  getMyLeads,
  uploadLeads,
} from "../controllers/lead.controller";
import upload from "../middlewares/multer.middleware";
function leadRouter() {
  const router = Router();

  // Only MANAGER can upload leads via Excel
  router.post(
    "/upload",
    verifyAccessToken,
    authorizeRoles([UserRoleValues.MANAGER]),
    upload.single("file"),
    uploadLeads
  );

  router.patch(
    "/assign-bulk",
    verifyAccessToken,
    authorizeRoles([UserRoleValues.MANAGER]),
    assignLeadsToTelecaller
  );

  router.get(
    "/my-leads",
    verifyAccessToken,
    authorizeRoles([UserRoleValues.TELECALLER]),
    getMyLeads
  );

  router.get(
    "/manager-leads",
    verifyAccessToken,
    authorizeRoles([UserRoleValues.MANAGER]),
    getManagerLeads
  );
  return router;
}

export default leadRouter;
