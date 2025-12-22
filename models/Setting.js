import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  weeklyGoal: { type: Number, default: 2000 },
  monthlyGoal: { type: Number, default: 8000 },
  perks: [
    { label: String, xp: Number }
  ]
});

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);