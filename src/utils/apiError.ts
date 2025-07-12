export interface IApiError {
  statusCode: number;
  message: string;
  errors: string[];
  stack: string;
  data: null;
  success: boolean;
}

class ApiError extends Error {
  statusCode: number;
  message: string;
  errors: string[];
  stack = "";
  data = null;
  success = false;

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
