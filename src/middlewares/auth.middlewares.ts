import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/user.model";
import { AvailableUserRoles } from "../constants";

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // ✅ for req.user typing
    }
  }
}

// ✅ Auth middleware
async function verifyAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const accessToken = req.cookies.token;

    if (!accessToken) {
      throw new ApiError(401, "No Access Token Provided!");
    }

    const decodedToken = jwt.verify(
      accessToken,
      String(process.env.JWT_SECRET)
    ) as { id: string };

    const user = await User.findById(decodedToken.id);

    if (!user) {
      throw new ApiError(400, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// ✅ Role authorizer
function authorizeRoles(roles: typeof AvailableUserRoles) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      throw new ApiError(
        403,
        `Role: ${user?.role} is not allowed to access this resource`
      );
    }
    next();
  };
}

export { verifyAccessToken, authorizeRoles };
