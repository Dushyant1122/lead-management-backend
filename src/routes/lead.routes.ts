import { Router } from "express";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/auth.middlewares";
import { UserRoleValues } from "../constants";
import upload from "../middlewares/multer.middleware";

import {
  uploadLeads,
  assignLeadsToTelecaller,
  getManagerLeads,
  exportLeads,
  getLeadsByStatus,
  deleteLead,
  getLeadById,
  deleteLeadsBulk,
  reassignLead,
  getMyLeads,
  getUpcomingFollowups,
  updateLeadStatus,
} from "../controllers/lead.controller";

function leadRouter() {
  const router = Router();

  /** -------------------- MANAGER ROUTES -------------------- **/
  const managerRouter = Router();
  managerRouter.use(
    verifyAccessToken,
    authorizeRoles([UserRoleValues.MANAGER])
  );

  // Upload Excel file
  managerRouter.post("/upload", upload.single("file"), uploadLeads);

  // Bulk assign to telecallers
  managerRouter.patch("/assign-bulk", assignLeadsToTelecaller);

  // Reassign single lead
  managerRouter.patch("/:id/reassign", reassignLead);

  // Get all manager leads (with optional filter ?type=assigned/unassigned)
  managerRouter.get("/manager-leads", getManagerLeads);

  // Get leads by status
  managerRouter.get("/status", getLeadsByStatus);

  // Export leads
  managerRouter.get("/export", exportLeads);

  // Delete single lead
  managerRouter.delete("/:id", deleteLead);

  // Bulk delete leads
  managerRouter.post("/delete-bulk", deleteLeadsBulk);

  // Manager + Telecaller both can view single lead details
  router.get(
    "/:id",
    verifyAccessToken,
    authorizeRoles([UserRoleValues.MANAGER, UserRoleValues.TELECALLER]),
    getLeadById
  );

  /** -------------------- TELECALLER ROUTES -------------------- **/
  const telecallerRouter = Router();
  telecallerRouter.use(
    verifyAccessToken,
    authorizeRoles([UserRoleValues.TELECALLER])
  );

  // Get only my leads
  telecallerRouter.get("/my-leads", getMyLeads);

  // Get upcoming followups
  telecallerRouter.get("/followups/upcoming", getUpcomingFollowups);

  // Update lead status, notes, follow-ups
  telecallerRouter.patch("/:leadId", updateLeadStatus);

  /** Mount sub-routers */
  router.use("/manager", managerRouter);
  router.use("/telecaller", telecallerRouter);

  return router;
}

export default leadRouter;
