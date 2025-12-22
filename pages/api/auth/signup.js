import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User'; // Double check this path
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  await dbConnect();

  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: "Username or Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({ username, email, password: hashedPassword });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}