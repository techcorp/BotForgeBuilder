import mongoose from "mongoose";

const BotSchema = new mongoose.Schema({
  id:             { type: String, required: true, unique: true },
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
  createdAt:      { type: String, default: "" },
  systemPrompt:   { type: String, default: "" },
}, { timestamps: true, id: false });

export default mongoose.models.Bot || mongoose.model("Bot", BotSchema);
