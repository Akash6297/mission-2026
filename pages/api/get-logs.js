import mongoose from 'mongoose';
import DailyLog from '../../models/Log';

export default async function handler(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    // Remove the .limit(5) so it calculates the TOTAL XP of all your entries
    const logs = await DailyLog.find().sort({ date: -1 }); 
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}