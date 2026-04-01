import { getRandomStory } from '../../../lib/stories';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import dbConnect from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send("Method Not Allowed");
  await dbConnect();
  
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;
  if (!token) return res.status(401).send("Unauthorized");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id);
    if (!admin || admin.role !== 'admin') return res.status(403).send("Denied");

    const story = getRandomStory();
    res.status(200).json(story);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
