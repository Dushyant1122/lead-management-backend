import express from "express";
import { validationResult, ValidationChain } from "express-validator";
import ApiError from "../utils/apiError";

// sequential processing, stops running validations chain if the previous one fails.
const validate = (validations: ValidationChain[]) => {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    for (let validation of validations) {
      const result = await validation.run(req);

      // If there are errors then break
      if (!result.isEmpty()) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

      throw new ApiError(400, "Validate Failed")
  };
};

export default validate;
