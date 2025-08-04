import { Router } from "express";
import {
  verifyAccessToken,
  authorizeRoles,
} from "../middlewares/auth.middlewares";
import { UserRoleValues } from "../constants";
import upload from "../middlewares/multer.middleware";

import {
  // Manager
  uploadLeads,
  assignLeadsToTelecaller,
  getManagerLeads,
  exportLeads,
  getLeadsByStatus,
  deleteLead,
  getLeadById,
  deleteLeadsBulk,
  reassignLead, // Telecaller
  getMyLeads,
  getUpcomingFollowups,
  updateLeadStatus,
} from "../controllers/lead.controller";

function leadRouter() {
  const router = Router();
  /** -------------------- MANAGER ROUTES -------------------- **/ 
  
  // ➤ Upload Excel file (Only Manager)
  router.post(
    "/upload",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER]),
    upload.single("file"),
    uploadLeads
  );

  // ➤ Bulk assign to telecallers
  router.patch(
    "/assign-bulk",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER]),
    assignLeadsToTelecaller
  );

  // ➤ Reassign single lead to another telecaller
  router.patch(
    "/:id/reassign",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER]),
    reassignLead
  );

  // ➤ Get all manager leads (with optional filter ?type=assigned/unassigned)
  router.get(
    "/manager-leads",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER]),
    getManagerLeads
  );

  // ➤ Get leads by status
  router.get(
    "/status",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER]),
    getLeadsByStatus
  );

  // ➤ Export leads as XLSX
  router.get(
    "/export",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER]),
    exportLeads
  );

  // ➤ Delete a single lead (uploaded by this manager)
  router.delete(
    "/:id",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER]),
    deleteLead
  );

  // ➤ Bulk delete leads (pass array of IDs)
  router.post(
    "/delete-bulk",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER]),
    deleteLeadsBulk
  );

  router.get(
    "/my-leads",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.TELECALLER]),
    getMyLeads
  );

  // ➤ Get Single Lead Details (Manager or Telecaller)
  router.get(
    "/:id",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.MANAGER, UserRoleValues.TELECALLER]),
    getLeadById
  );

  /** -------------------- TELECALLER ROUTES -------------------- **/ 
  // ➤ Telecaller: Get only my assigned leads


  // ➤ Telecaller: Get upcoming followups
  router.get(
    "/followups/upcoming",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.TELECALLER]),
    getUpcomingFollowups
  );

  // ➤ Telecaller: Update status, call, notes, follow-ups
  router.patch(
    "/:leadId",
    // verifyAccessToken,
    // authorizeRoles([UserRoleValues.TELECALLER]),
    updateLeadStatus
  );

  return router;
}

export default leadRouter;
