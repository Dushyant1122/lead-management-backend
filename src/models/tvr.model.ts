import mongoose from "mongoose";
const { Schema } = mongoose;

// Schema for the 'references' array
const ReferenceSchema = new Schema({
  name: {
    type: String,
    required: [true, "Reference name is required."],
  },
  mobile: {
    type: String,
    required: [true, "Reference mobile number is required."],
  },
  address: {
    type: String,
    required: [true, "Reference address is required."],
  },
});

// Schema for the 'existingLoans' array
const ExistingLoanSchema = new Schema({
  bank: {
    type: String,
    required: [true, "Bank name for existing loan is required."],
  },
  amount: {
    type: String, // Storing as String as per frontend, can be changed to Number
    required: [true, "Remaining loan amount is required."],
  },
  tenure: {
    type: String, // Storing as String as per frontend, can be changed to Number
    required: [true, "Remaining tenure is required."],
  },
});

// Schema for the 'creditCards' array
const CreditCardSchema = new Schema({
  bank: {
    type: String,
    required: [true, "Bank name for credit card is required."],
  },
  cardNumber: {
    type: Number,
    required: [true, "Card number (last 4 digits) is required."],
    length: [4, "Card number must be the last 4 digits."],
  },
  cardLimit: {
    type: Number,
    required: [true, "Card limit is required."],
  },
});

// Main TVR (Tele-Verification Report) Schema
const TVRSchema = new Schema(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: [true, "Lead ID is required to associate the TVR."],
      index: true,
      unique: true,
    },
    // --- Personal Details ---
    customerName: {
      type: String,
      required: [true, "Customer name is required."],
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required."],
    },
    motherName: {
      type: String,
      required: [true, "Mother's name is required."],
    },
    spouseName: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      required: [true, "Education is required."],
    },
    personalEmail: {
      type: String,
      required: [true, "Personal email is required."],
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    officialEmail: {
      type: String,
      required: [true, "Official email is required."],
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },

    // --- Address Details ---
    currentAddress: {
      type: String,
      required: [true, "Current address is required."],
    },
    houseType: {
      type: String,
      enum: ["owned", "parentsOwned", "companyProvided", "rented"],
      required: [true, "House type is required."],
    },
    yearsAtCurrentAddress: {
      type: String,
      required: [true, "Years at current address is required."],
    },
    yearsAtCurrentCity: {
      type: String,
      required: [true, "Years at current city is required."],
    },
    currentLandmark: {
      type: String,
      required: [true, "Current landmark is required."],
    },
    permanentAddress: {
      type: String,
      required: [true, "Permanent address is required."],
    },
    sameAddress: {
      // This is a helper on the frontend, but can be stored if needed
      type: Boolean,
      default: false,
    },

    // --- Office & Work Details ---
    officeName: {
      type: String,
      required: [true, "Office name is required."],
    },
    officeAddress: {
      type: String,
      required: [true, "Office address is required."],
    },
    officeLandmark: {
      type: String,
      required: [true, "Office landmark is required."],
    },
    designation: {
      type: String,
      required: [true, "Designation is required."],
    },
    currentCompanyExp: {
      type: String,
      required: [true, "Current company experience is required."],
    },
    totalWorkExp: {
      type: String,
      required: [true, "Total work experience is required."],
    },
    seniorMobile: {
      type: String,
      default: "",
    },

    // --- Loan Details ---
    loanAmount: {
      type: Number,
      required: [true, "Loan amount is required."],
    },
    tenure: {
      type: Number,
      required: [true, "Tenure is required."],
    },

    // --- Embedded Documents ---
    references: [ReferenceSchema],
    existingLoans: [ExistingLoanSchema],
    creditCards: [CreditCardSchema],

    // --- Optional Passwords & Reference ---
    refPersonName: {
      type: String,
      default: "",
    },
    bankingPassword: {
      type: String,
      default: "",
    },
    payslipPassword: {
      type: String,
      default: "",
    },
    aadharPassword: {
      type: String,
      default: "",
    },
    btDocsPasswords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create the model from the schema
export const TVR = mongoose.model("TVR", TVRSchema);
