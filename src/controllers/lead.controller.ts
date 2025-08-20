import { Request, Response, NextFunction } from "express";
import xlsx from "xlsx";
import ApiError from "../utils/apiError";
import { Lead } from "../models/lead.model";
import * as fs from "fs";

//Upload Leads
export async function uploadLeads(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) throw new ApiError(400, "No file uploaded");

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const managerId = req.user?._id;
    if (!managerId) throw new ApiError(401, "Unauthorized");

    const leadsToInsert = rows
      .map((row: any) => {
        const name = row["Name"]?.toString().trim();
        const phone = row["Phone"]?.toString().trim();
        if (!name || !phone) return null;

        return {
          name,
          phone,
          uploadedBy: managerId,
          status: "Not Called",
          firstCallDate: null,
          nextFollowupDate: null,
          notes: "",
          assignedTo: undefined,
          assignedAt: null,
          tvrForm: undefined,
          sourceFileName: fileName,
        };
      })
      .filter(Boolean);

    if (leadsToInsert.length === 0) {
      throw new ApiError(400, "No valid leads found in the uploaded file.");
    }

    const inserted = await Lead.insertMany(leadsToInsert);

    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
    });

    res.status(200).json({
      message: "Leads uploaded successfully",
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
}

//Assign leads
export const assignLeadsToTelecaller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { telecallerId, count } = req.body;
    const managerId = req.user?._id;

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
      {
        $set: {
          assignedTo: telecallerId,
          assignedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      message: "Leads assigned successfully",
      assignedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

//Get Telecaller Leads
export const getMyLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const role = req.user?.role;
    const userId = req.user?._id;

    let query = {};

    if (role === "ADMIN") {
      // Admin -> all leads
      query = {};
    } else if (role === "MANAGER") {
      // Manager -> leads uploaded by him
      query = { uploadedBy: userId };
    } else if (role === "TELECALLER") {
      // Telecaller -> leads assigned to him
      query = { assignedTo: userId };
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 }) // sorted by creation time
      .populate("uploadedBy", "firstName lastName userName")
      .populate("assignedTo", "firstName lastName userName")
      .lean();

    res.status(200).json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
};

//Get Total Leads
export const getManagerLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const managerId = req.user?._id;
    const { type } = req.query;

    const filter: any = { uploadedBy: managerId };

    if (type === "assigned") {
      filter.assignedTo = { $exists: true };
    } else if (type === "unassigned") {
      filter.assignedTo = { $exists: false };
    } else if (type && type !== "all") {
      throw new ApiError(
        400,
        "Invalid type. Use 'assigned', 'unassigned' or omit for all."
      );
    }

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "firstName lastName userName role")
      .lean();

    res.status(200).json({
      type: type || "all",
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { leadId } = req.params;
    const { status, firstCallDate, nextFollowupDate, notes } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new ApiError(404, "Lead not found");
    }

    // Update fields if provided
    if (status) lead.status = status;
    if (firstCallDate) lead.firstCallDate = new Date(firstCallDate);
    if (nextFollowupDate) lead.nextFollowupDate = new Date(nextFollowupDate);
    if (notes !== undefined) lead.notes = notes;

    await lead.save();

    res.status(200).json({
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id)
      .populate("uploadedBy", "firstName lastName userName")
      .populate("assignedTo", "firstName lastName userName");

    if (!lead) {
      throw new ApiError(404, "Lead not found");
    }

    res.status(200).json({
      message: "Lead fetched successfully",
      lead,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leadId = req.params.id;
    const managerId = req.user?._id;

    const lead = await Lead.findOneAndDelete({
      _id: leadId,
      uploadedBy: managerId,
    });

    if (!lead) {
      throw new ApiError(404, "Lead not found or unauthorized");
    }

    res.status(200).json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const exportLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const managerId = req.user?._id;
    const { type } = req.query;

    const filter: any = { uploadedBy: managerId };

    if (type === "assigned") filter.assignedTo = { $exists: true };
    if (type === "unassigned") filter.assignedTo = { $exists: false };

    // const leads = await Lead.find(filter).populate("assignedTo uploadedBy");
    const leads = await Lead.find()
      .populate("assignedTo", "firstName lastName")
      .populate("uploadedBy", "firstName lastName");

    const data = leads.map((lead) => ({
      Name: lead.name,
      Phone: lead.phone,
      Status: lead.status,
      AssignedTo:
        lead.assignedTo &&
        typeof lead.assignedTo === "object" &&
        "firstName" in lead.assignedTo
          ? `${(lead.assignedTo as any).firstName} ${
              (lead.assignedTo as any).lastName
            }`
          : "Unassigned",
      Notes: lead.notes || "",
      UploadedBy:
        lead.uploadedBy &&
        typeof lead.uploadedBy === "object" &&
        "firstName" in lead.uploadedBy
          ? `${(lead.uploadedBy as any).firstName} ${
              (lead.uploadedBy as any).lastName
            }`
          : "Unknown",
      FirstCallDate: lead.firstCallDate || "",
      NextFollowupDate: lead.nextFollowupDate || "",
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Leads");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename=leads.xlsx`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getLeadsByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const managerId = req.user?._id;
    const { value } = req.query;

    if (!value) throw new ApiError(400, "Status value is required");

    const leads = await Lead.find({
      uploadedBy: managerId,
      status: value,
    });

    res.status(200).json({
      message: `Leads with status "${value}" fetched successfully.`,
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingFollowups = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const telecallerId = req.user?._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leads = await Lead.find({
      assignedTo: telecallerId,
      nextFollowupDate: { $gte: today },
    }).sort({ nextFollowupDate: 1 });

    res.status(200).json({
      message: "Upcoming follow-ups fetched",
      count: leads.length,
      leads,
    });
  } catch (error) {
    next(error);
  }
};

export const reassignLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { newTelecallerId } = req.body;

    if (!newTelecallerId) throw new ApiError(400, "New telecaller ID required");

    const lead = await Lead.findByIdAndUpdate(
      id,
      {
        assignedTo: newTelecallerId,
        assignedAt: new Date(),
      },
      { new: true }
    );

    if (!lead) throw new ApiError(404, "Lead not found");

    res.status(200).json({
      message: "Lead reassigned successfully",
      lead,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLeadsBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "IDs array is required");
    }

    const managerId = req.user?._id;

    const result = await Lead.deleteMany({
      _id: { $in: ids },
      uploadedBy: managerId,
    });

    res.status(200).json({
      message: "Leads deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
