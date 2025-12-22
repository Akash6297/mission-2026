import dbConnect from '../../lib/mongodb';
import Setting from '../../models/Setting';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  await dbConnect();
  
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (req.method === 'GET') {
    const settings = await Setting.findOne({ userId: decoded.id });
    return res.status(200).json(settings || { weeklyGoal: 2000, monthlyGoal: 8000, perks: [] });
  }

  if (req.method === 'POST') {
    const { weeklyGoal, monthlyGoal, perks } = req.body;
    const updated = await Setting.findOneAndUpdate(
      { userId: decoded.id }, 
      { userId: decoded.id, weeklyGoal, monthlyGoal, perks }, 
      { upsert: true, new: true }
    );
    return res.status(200).json(updated);
  }
}