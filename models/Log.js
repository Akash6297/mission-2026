import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  text: { type: String, required: true },
  tasksCompleted: [String], 
  mood: { type: String, default: "Smile" },
  xpGained: { type: Number, default: 0 },
  type: { type: String, default: "gain" }, // "gain" or "spend"
  date: { type: Date, default: Date.now },
});

export default mongoose.models.DailyLog || mongoose.model('DailyLog', LogSchema);