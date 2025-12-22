import dbConnect from '../../lib/mongodb';
import DailyLog from '../../models/Log';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  try {
    await dbConnect();

    const { text, tasksCompleted, mood } = req.body;
    
    // CALCULATE XP: 100 XP per quest. If no quests, give 50 XP for the log text.
    const questCount = tasksCompleted ? tasksCompleted.length : 0;
    const calculatedXP = questCount > 0 ? questCount * 100 : 50;

    const newEntry = await DailyLog.create({ 
      text, 
      tasksCompleted: tasksCompleted || [], 
      mood: mood || "Smile", 
      xpGained: calculatedXP 
    });

    console.log(`✅ MISSION SUCCESS: Saved ${questCount} quests. Total XP: ${calculatedXP}`);
    return res.status(200).json({ success: true, data: newEntry });
  } catch (error) {
    console.error("API ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}