const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["new", "in_progress", "blocked", "done"],
      default: "new",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

const Case = mongoose.model("Case", caseSchema);

module.exports = { Case };
