import dbConnect from '../../lib/mongodb';
import DailyLog from '../../models/Log';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  try {
    await dbConnect();

    // 1. Get User ID from Cookie
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Please login first" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2. Calculate XP
    const { text, tasksCompleted, mood } = req.body;
    const questCount = tasksCompleted ? tasksCompleted.length : 0;
    const calculatedXP = questCount > 0 ? questCount * 100 : 50;

    // 3. Create entry WITH userId
    const newEntry = await DailyLog.create({ 
      userId: userId, // Added this line
      text, 
      tasksCompleted: tasksCompleted || [], 
      mood: mood || "Smile", 
      xpGained: calculatedXP 
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("API ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
}