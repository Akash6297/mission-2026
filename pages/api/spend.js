import mongoose from 'mongoose';
import DailyLog from '../../models/Log';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  try {
    if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI);
    const { label, xp } = req.body;
    
    // Create a log entry with NEGATIVE XP
    await DailyLog.create({ 
      text: `REWARD CLAIMED: ${label}`, 
      xpGained: -xp, 
      type: "spend",
      mood: "Smile"
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}