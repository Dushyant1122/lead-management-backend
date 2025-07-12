import { body } from "express-validator";
import validate from "./validate";

const firstName = () =>
  body("firstName")
    .isString()
    .withMessage("givenName must be defined of type string")
    .notEmpty()
    .withMessage("givenName cannot be empty");

// const avatarUrl = () =>
//   body("avatarUrl")
//     .isString()
//     .withMessage("avatarUrl must be defined of type string")
//     .isURL()
//     .withMessage("avatarUrl must be a valid url")
//     .notEmpty()
//     .withMessage("avatarUrl cannot be empty");

const lastName = () =>
  body("lastName")
    .optional()
    .isString()
    .withMessage("lastName must be defined of type string");

const email = () =>
  body("email")
    .isString()
    .withMessage("email must be defined of type string")
    .notEmpty()
    .withMessage("email cannot be empty")
    .isEmail()
    .withMessage("email must be a valid email");


const password = (field: string) =>
  body(field)
    .isString()
    .withMessage(`${field} must be defined of type string`)
    .matches(/^\S*$/)
    .withMessage(`${field} should not contain spaces`)
    .matches(/^(?=.*[A-Z])/)
    .withMessage(`${field} must contains at least one uppercase character`)
    .matches(/^(?=.*[a-z])/)
    .withMessage(`${field} must contains at least one lowercase character`)
    .matches(/(?=.[@$!%?&])/)
    .withMessage(`${field} must contains at least one special character`)
    .isLength({ min: 8 })
    .withMessage(`${field} must be at least 8 characters long`);
    
    
const registerUserValidator = validate([
  firstName(),
  lastName(),
  email(),
  password("password"),
]);

const loginUserValidator = validate([firstName(), password("password")]);

// const updateAvatarUserValidator = validate([avatarUrl()]);

const changePasswordUserValidator = validate([
  password("oldPassword"),
  password("newPassword"),
]);

export {
  registerUserValidator,
  loginUserValidator,
  changePasswordUserValidator,
};
