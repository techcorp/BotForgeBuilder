import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["admin", "manager", "editor", "viewer"],
        default: "editor",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  plan: {
    type: String,
    enum: ["free", "pro", "enterprise"],
    default: "free",
  },
  botsLimit: {
    type: Number,
    default: 3,
  },
  logo: String,
  website: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
