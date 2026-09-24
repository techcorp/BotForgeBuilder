import mongoose from "mongoose";

const BotSchema = new mongoose.Schema({
  id:             { type: String, required: true, unique: true },
  teamId:         { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  logo:           { type: String, default: "" },
  name:           { type: String, default: "" },
  businessName:   { type: String, default: "" },
  businessType:   { type: String, default: "" },
  businessDetails:{ type: String, default: "" },
  tone:           { type: String, default: "Friendly" },
  language:       { type: String, default: "English" },
  model:          { type: mongoose.Schema.Types.Mixed, default: {} },
  customInstructions: { type: String, default: "" },
  welcomeMessage: { type: String, default: "" },
  systemPrompt:   { type: String, default: "" },
  status:         { type: String, enum: ["draft", "published", "archived"], default: "draft" },
  visibility:     { type: String, enum: ["private", "team", "public"], default: "private" },
  conversations:  { type: Number, default: 0 },
  lastConversation: Date,
}, { timestamps: true, id: false });

BotSchema.index({ teamId: 1 });
BotSchema.index({ createdBy: 1 });
BotSchema.index({ createdAt: -1 });

export default mongoose.models.Bot || mongoose.model("Bot", BotSchema);
