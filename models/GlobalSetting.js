import mongoose from 'mongoose';

const GlobalSettingSchema = new mongoose.Schema({
  configId: { type: String, default: "master_config" },
  isMorningActive: { type: Boolean, default: true }, // Independent Switch
  isEveningActive: { type: Boolean, default: true }, // Independent Switch
  mailTarget: { type: String, default: "both" },
});

export default mongoose.models.GlobalSetting || mongoose.model('GlobalSetting', GlobalSettingSchema);