import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  await dbConnect();
  
  // Security Check
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findById(decoded.id);
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: "Access Denied" });

    // GET: List all users
    if (req.method === 'GET') {
      const users = await User.find({}, '-password').sort({ username: 1 });
      return res.status(200).json(users);
    }

    // PATCH: Update user role (Promote/Demote)
    if (req.method === 'PATCH') {
      const { targetId, newRole } = req.body;
      
      // Prevent admin from demoting themselves (safety feature)
      if (targetId === decoded.id) {
        return res.status(400).json({ error: "You cannot change your own role!" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        targetId, 
        { role: newRole }, 
        { new: true }
      );
      return res.status(200).json({ success: true, user: updatedUser });
    }

    // DELETE: Remove user
    if (req.method === 'DELETE') {
      const { targetId } = req.body;
      if (targetId === decoded.id) return res.status(400).json({ error: "Cannot delete yourself" });
      
      await User.findByIdAndDelete(targetId);
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}