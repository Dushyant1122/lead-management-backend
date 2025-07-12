import { Request, Response, NextFunction } from "express";
import xlsx from "xlsx";
import ApiError from "../utils/apiError";
import { Lead } from "../models/lead.model"; // Create this model later

export async function uploadLeads(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) throw new ApiError(400, "No file uploaded");

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet); // ✅ Converts to array of objects

    const managerId = req.user?._id;

    const leadsToInsert = rows.map((row: any) => ({
      name: row["Name"], // ✅ map Excel "Name"
      phone: row["Phone"], // ✅ map Excel "Phone"
      uploadedBy: managerId,
      status: "Not Called",
    }));

    const inserted = await Lead.insertMany(leadsToInsert);

    res.status(200).json({
      message: "Leads uploaded successfully",
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
}
  

export const assignLeadsToTelecaller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { telecallerId, count } = req.body;
    const managerId = req.user._id;

    if (!telecallerId || !count) {
      throw new ApiError(400, "telecallerId and count are required");
    }

    // Fetch unassigned leads uploaded by this manager
    const leads = await Lead.find({
      uploadedBy: managerId,
      assignedTo: { $exists: false },
    }).limit(count);

    if (leads.length === 0) {
      throw new ApiError(404, "No unassigned leads available");
    }

    const leadIds = leads.map((lead) => lead._id);

    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      { assignedTo: telecallerId }
    );

    res.status(200).json({
      message: "Leads assigned successfully",
      assignedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const telecallerId = req.user._id;

    const leads = await Lead.find({ assignedTo: telecallerId });

    res.status(200).json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
};


export const getManagerLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const managerId = req.user._id;
    const { type } = req.query;

    let filter: any = { uploadedBy: managerId };

    if (type === "assigned") {
      filter.assignedTo = { $exists: true };
    } else if (type === "unassigned") {
      filter.assignedTo = { $exists: false };
    }

    const leads = await Lead.find(filter);

    res.status(200).json({
      type: type || "all",
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
};