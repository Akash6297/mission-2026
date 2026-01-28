import dbConnect from '../../../lib/mongodb';
import GlobalSetting from '../../../models/GlobalSetting';
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
    const settings = await GlobalSetting.findOne({ configId: "master_config" });
    return res.status(200).json(settings || { isMailActive: true, mailTarget: "both" });
  }

 // GET SETTINGS
  if (req.method === 'GET') {
    const settings = await GlobalSetting.findOne({ configId: "master_config" });
    return res.status(200).json(settings || { isMorningActive: true, isEveningActive: true, mailTarget: "both" });
  }

  // UPDATE SETTINGS
  if (req.method === 'POST') {
    const { isMorningActive, isEveningActive, mailTarget } = req.body;
    
    console.log("Updating DB with:", { isMorningActive, isEveningActive, mailTarget });

    const updated = await GlobalSetting.findOneAndUpdate(
      { configId: "master_config" }, // Find by this ID
      { 
        $set: { 
          isMorningActive: Boolean(isMorningActive), 
          isEveningActive: Boolean(isEveningActive), 
          mailTarget: mailTarget 
        } 
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json(updated);
  }
} 

