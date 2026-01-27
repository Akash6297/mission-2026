import mongoose from 'mongoose';

const GlobalSettingSchema = new mongoose.Schema({
  configId: { type: String, default: "master_config" }, // Helper to find the single doc
  isMailActive: { type: Boolean, default: true },
  mailTarget: { type: String, default: "both" }, // "users", "admins", "both"
});

export default mongoose.models.GlobalSetting || mongoose.model('GlobalSetting', GlobalSettingSchema);