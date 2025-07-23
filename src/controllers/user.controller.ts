import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import ApiError from "../utils/apiError";
import ApiResponse from "../utils/apiResponse";
import { sendMail } from "../utils/sendMail";
import { UserRoleTypes } from "../constants";
import { generateOTP } from "../utils/otpGenerator";
import jwt from "jsonwebtoken";

// Define role-based permissions
const allowedToCreate: Record<UserRoleTypes, UserRoleTypes[]> = {
  ADMIN: ["MANAGER"],
  MANAGER: ["TELECALLER", "BACKEND"],
  BACKEND: [],
  TELECALLER: [],
};

//DONE
async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      throw new ApiError(401, "Unauthorized");
    }

    const {
      firstName,
      lastName,
      userName,
      email,
      phone,
      role,
    }: {
      firstName: string;
      lastName: string;
      userName: string;
      email: string;
      phone?: string;
      role: UserRoleTypes;
    } = req.body;

    if (!(firstName && lastName && userName && email && role)) {
      throw new ApiError(400, "All required fields must be filled.");
    }

    const creatorRole = currentUser.role as UserRoleTypes;
    const allowedRoles = allowedToCreate[creatorRole];

    if (!allowedRoles?.includes(role)) {
      throw new ApiError(
        403,
        "You are not allowed to create this type of user."
      );
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (existingUser) {
      throw new ApiError(409, "Email or Username already in use.");
    }

    // 🔐 Generate OTP for new user
    const otp = generateOTP(); // e.g., returns 6-digit code
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUserData: any = {
      firstName,
      lastName,
      userName,
      email,
      phone,
      role,
      isActive: true,
      otp,
      otpExpiry,
      isVerified: false,
    };

    if (role === "TELECALLER" || role === "BACKEND") {
      if (creatorRole !== "MANAGER") {
        throw new ApiError(
          403,
          "Only managers can create telecaller/backend users."
        );
      }
      newUserData.manager = currentUser._id;
    }

    const user = await User.create(newUserData);

    // 📧 Send OTP Mail
    await sendMail({
      email: user.email,
      subject: "Welcome to FINYARA – Verify Your Account",
      content: `Hi ${user.firstName}, your OTP is: ${otp}. It will expire in 10 minutes.`,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          _id: user._id,
          email: user.email,
          role: user.role,
        },
        "User created successfully. OTP sent to email."
      )
    );
  } catch (error) {
    next(error);
  }
}

//DONE
async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { emailOrUsername }: { emailOrUsername: string } = req.body;

    if (!emailOrUsername?.trim()) {
      throw new ApiError(400, "Email or Username is required");
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { userName: emailOrUsername }],
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendMail({
      email: user.email,
      subject: "Your OTP for FINYARA Login",
      content: `Hello ${user.firstName},\n\nYour OTP is: ${otp}\nIt will expire in 10 minutes.`,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "OTP sent successfully"));
  } catch (error) {
    next(error);
  }
}

//DONE
async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { emailOrUsername, otp }: { emailOrUsername: string; otp: string } =
      req.body;

    if (!emailOrUsername?.trim() || !otp?.trim()) {
      throw new ApiError(400, "Email/Username and OTP are required");
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { userName: emailOrUsername }],
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // OTP validation
    if (
      !user.otp ||
      !user.otpExpiry ||
      user.otp !== otp ||
      new Date() > user.otpExpiry
    ) {
      throw new ApiError(403, "Invalid or expired OTP");
    }

    // Clear OTP and login user
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Sanitize full user data (remove sensitive fields)
    const { password, otp: _, otpExpiry, ...safeUser } = user.toObject();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token,
          user: safeUser, // full safe user object
        },
        "OTP verified and login successful"
      )
    );
  } catch (error) {
    next(error);
  }
}

//DONE
async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      throw new ApiError(401, "Unauthorized");
    }

    const { role, _id } = currentUser;
    const managerIdFromQuery = req.query.managerId as string | undefined;

    if (role === "ADMIN") {
      let managers;

      if (managerIdFromQuery) {
        managers = await User.find({ _id: managerIdFromQuery, role: "MANAGER" })
          .select("firstName lastName userName phone role")
          .lean();
      } else {
        managers = await User.find({ role: "MANAGER" })
          .select("firstName lastName userName phone role")
          .lean();
      }

      const managerIds = managers.map((m) => m._id);
      const allTeams = await User.find({
        manager: { $in: managerIds },
        role: { $in: ["TELECALLER", "BACKEND"] },
      })
        .select("firstName lastName userName phone role manager")
        .lean();

      const result = managers.map((manager) => ({
        ...manager,
        team: allTeams.filter(
          (user) => user.manager?.toString() === manager._id.toString()
        ),
      }));

      return res
        .status(200)
        .json(
          new ApiResponse(200, { users: result }, "Users fetched successfully")
        );
    }

    if (role === "MANAGER") {
      const manager = await User.findById(_id)
        .select("firstName lastName userName phone role")
        .lean();

      if (!manager) {
        throw new ApiError(404, "Manager not found");
      }

      const team = await User.find({
        manager: _id,
        role: { $in: ["TELECALLER", "BACKEND"] },
      })
        .select("firstName lastName userName phone role")
        .lean();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { users: [{ ...manager, team }] },
            "Users fetched successfully"
          )
        );
    }

    throw new ApiError(403, "Forbidden");
  } catch (error) {
    next(error);
  }
}

//DONE
async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const currentUser = (req as any).user;

    if (!currentUser) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid user ID format.");
    }

    const user = await User.findById(userId)
      .select("-otp -otpExpiry")
      .populate({
        path: "manager",
        select: "firstName lastName",
      });

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const currentUserRole = currentUser.role as UserRoleTypes;

    // Access Control
    if (currentUserRole === "ADMIN") {
      // Admin can fetch anyone
    } else if (currentUserRole === "MANAGER") {
      // Manager can only fetch TELECALLER or BACKEND under them
      if (
        (user.role === "TELECALLER" || user.role === "BACKEND") &&
        user.manager?.toString() === currentUser._id.toString()
      ) {
        // allowed
      } else if (user._id.toString() === currentUser._id.toString()) {
        // Manager accessing self
      } else {
        throw new ApiError(403, "Access denied");
      }
    } else {
      // TELECALLER/BACKEND: only allowed to fetch self
      if (user._id.toString() !== currentUser._id.toString()) {
        throw new ApiError(403, "Access denied");
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { user }, "User fetched successfully"));
  } catch (error) {
    next(error);
  }
}

//Done
async function updateUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user;
    const { userId } = req.params;

    if (!currentUser) {
      throw new ApiError(401, "Unauthorized");
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      throw new ApiError(404, "User not found");
    }

    const currentRole = currentUser.role as UserRoleTypes;

    // Admin can update anyone
    // Manager can only update their own Telecaller/Backend
    if (currentRole === "MANAGER") {
      if (
        userToUpdate.manager?.toString() !== currentUser._id.toString() ||
        !["TELECALLER", "BACKEND"].includes(userToUpdate.role)
      ) {
        throw new ApiError(
          403,
          "You can only update your assigned Telecaller or Backend users"
        );
      }
    }

    // Define allowed fields
    const updatableFields: (keyof typeof req.body)[] = [
      "firstName",
      "lastName",
      "userName",
      "email",
      "phone",
    ];

    if (currentRole === "ADMIN") {
      updatableFields.push("role", "isActive", "status");
    }

    if (currentRole === "MANAGER") {
      // Manager can only switch between TELECALLER and BACKEND
      if (req.body.role && ["TELECALLER", "BACKEND"].includes(req.body.role)) {
        updatableFields.push("role");
      }
    }

    // Update fields
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        userToUpdate[field] = req.body[field];
      }
    }

    await userToUpdate.save();

    // Only return safe fields
    const safeKeys = [
      "_id",
      "firstName",
      "lastName",
      "userName",
      "email",
      "phone",
      "role",
      "isActive",
      "status",
      "updatedAt",
    ];
    const responseUser: Record<string, any> = {};
    for (const key of safeKeys) {
      if (userToUpdate[key] !== undefined) {
        responseUser[key] = userToUpdate[key];
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, responseUser, "User updated successfully"));
  } catch (error) {
    next(error);
  }
}

//DONE
async function logoutUser(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

// DONE
async function getMyUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      throw new ApiError(401, "Unauthorized");
    }

    // Extract query role and normalize it properly
    const queryRoleRaw = req.query.role;
    const queryRole =
      typeof queryRoleRaw === "string" ? queryRoleRaw.toUpperCase() : "";

    // Determine Manager ID
    let managerId: mongoose.Types.ObjectId | undefined;

    if (currentUser.role === "MANAGER") {
      if (!mongoose.Types.ObjectId.isValid(currentUser._id)) {
        throw new ApiError(400, "Invalid manager ID format");
      }
      managerId = new mongoose.Types.ObjectId(String(currentUser._id));
    } else if (currentUser.role === "TELECALLER") {
      if (
        !currentUser.manager ||
        !mongoose.Types.ObjectId.isValid(currentUser.manager)
      ) {
        throw new ApiError(400, "No valid manager assigned to this Telecaller");
      }
      managerId = new mongoose.Types.ObjectId(String(currentUser.manager));
    } else {
      throw new ApiError(403, "Access denied for this role");
    }

    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      throw new ApiError(400, "Invalid manager ID format");
    }

    // Create filter based on query
    const filter: Record<string, any> = {
      manager: managerId,
    };

    if (queryRole) {
      filter.role = queryRole;
    }

    const users = await User.find(filter)
      .select("firstName lastName userName phone role")
      .lean();

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      userName: user.userName,
      phone: user.phone,
      role: user.role,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { users: formattedUsers },
          "Users fetched successfully"
        )
      );
  } catch (error) {
    next(error);
  }
}

export {
  createUser,
  updateUserById,
  getAllUsers,
  getUserById,
  sendOtp,
  verifyOtp,
  logoutUser,
  getMyUsers,
};
