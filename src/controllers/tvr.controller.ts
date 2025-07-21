import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError";
import { TVR } from "../models/tvr.model";
import { Lead } from "../models/lead.model";


// --- CREATE a new TVR and link to a Lead ---
/**
 * @description Create a new TVR and link it to a lead
 * @route POST /api/tvr/lead/:leadId
 * @access Private (Backend Agent, Telecaller)
 */
export async function createTVR(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { leadId } = req.params; // Get leadId from the URL parameters
    const tvrData = req.body;

    if (!leadId) {
      throw new ApiError(400, "Lead ID is required in the URL.");
    }

    // Check if a TVR already exists for this lead
    const existingTVR = await TVR.findOne({ leadId });
    if (existingTVR) {
      throw new ApiError(409, "A TVR form already exists for this lead.");
    }

    // Create a new TVR and save the leadId in it
    const newTVR = new TVR({
      ...tvrData,
      leadId: leadId,
    });
    const savedTVR = await newTVR.save();

    // Now, find the Lead and update it with the new TVR's ID
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { tvrForm: savedTVR._id },
      { new: true }
    );

    if (!updatedLead) {
      // If the lead is not found, delete the created TVR to roll back
      await TVR.findByIdAndDelete(savedTVR._id);
      throw new ApiError(
        404,
        "Lead not found. TVR creation has been rolled back."
      );
    }

    res.status(201).json({
      message: "TVR created and linked to the lead successfully.",
      data: savedTVR,
    });
  } catch (error) {
    next(error);
  }
}

// --- READ all TVRs ---
export async function getAllTVRs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const tvrs = await TVR.find()
      .populate("leadId", "name phone") // also populate lead details
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TVR.countDocuments();

    res.status(200).json({
      message: "TVRs retrieved successfully.",
      data: tvrs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// --- READ a single TVR by ID ---
export async function getTVRById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const tvr = await TVR.findById(id).populate("leadId", "name phone"); // also populate lead details

    if (!tvr) {
      throw new ApiError(404, "TVR not found with the provided ID.");
    }

    res.status(200).json({
      message: "TVR retrieved successfully.",
      data: tvr,
    });
  } catch (error) {
    next(error);
  }
}

// --- UPDATE a TVR by ID ---
export async function updateTVR(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTVR = await TVR.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedTVR) {
      throw new ApiError(404, "TVR not found with the provided ID.");
    }

    res.status(200).json({
      message: "TVR updated successfully.",
      data: updatedTVR,
    });
  } catch (error) {
    next(error);
  }
}

// --- DELETE a TVR by ID ---
export async function deleteTVR(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const tvrToDelete = await TVR.findById(id);

    if (!tvrToDelete) {
      throw new ApiError(404, "TVR not found with the provided ID.");
    }

    // Before deleting the TVR, remove its reference from the associated lead
    await Lead.findByIdAndUpdate(tvrToDelete.leadId, {
      $unset: { tvrForm: 1 }, // remove the tvrForm field
    });

    await TVR.findByIdAndDelete(id);

    res.status(200).json({
      message: "TVR deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}
