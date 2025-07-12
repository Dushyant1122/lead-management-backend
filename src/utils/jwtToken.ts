import { Response } from "express";

/**
 *
 * @param {Response} res
 */
const sendToken = async (
  user: any,
  statusCode: number,
  res: Response
): Promise<void> => {
  const token: string = user.getJWTToken();
  user.token = token;
  await user.save();

  res.status(statusCode).cookie("AccessToken", token).json({
    success: true,
    user,
  });
};

export default sendToken;
