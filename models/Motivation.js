import mongoose from 'mongoose';

const MotivationSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true }, // 0 (Sun) to 6 (Sat)
  subject: { type: String, required: true },
  story: { type: String, required: true },
  active: { type: Boolean, default: true }
});

export default mongoose.models.Motivation || mongoose.model('Motivation', MotivationSchema);