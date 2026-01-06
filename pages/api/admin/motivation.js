import dbConnect from '../../../lib/mongodb';
import Motivation from '../../../models/Motivation';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  await dbConnect();
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;
  if (!token) return res.status(401).send("Unauthorized");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const admin = await User.findById(decoded.id);
  if (!admin || admin.role !== 'admin') return res.status(403).send("Denied");

  if (req.method === 'GET') {
    const list = await Motivation.find({});
    return res.status(200).json(list);
  }

  if (req.method === 'POST') {
    const { dayOfWeek, subject, story } = req.body;
    // Update if exists for that day, otherwise create
    const updated = await Motivation.findOneAndUpdate(
      { dayOfWeek },
      { subject, story, active: true },
      { upsert: true, new: true }
    );
    return res.status(200).json(updated);
  }
}