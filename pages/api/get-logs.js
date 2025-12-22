import dbConnect from '../../lib/mongodb';
import DailyLog from '../../models/Log';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  try {
    await dbConnect();

    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find logs only for this specific user
    const logs = await DailyLog.find({ userId: decoded.id }).sort({ date: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}