import dbConnect from '../../lib/mongodb';
import DailyLog from '../../models/Log';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  try {
    await dbConnect();
    
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { label, xp } = req.body;
    
    await DailyLog.create({ 
      userId: decoded.id, // Added this line
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