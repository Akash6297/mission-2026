import dbConnect from '../../lib/mongodb';
import Setting from '../../models/Setting';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const settings = await Setting.findOne();
    return res.status(200).json(settings || { weeklyGoal: 2000, monthlyGoal: 8000, perks: [] });
  }

  if (req.method === 'POST') {
    const { weeklyGoal, monthlyGoal, perks } = req.body;
    const updated = await Setting.findOneAndUpdate(
      {}, 
      { weeklyGoal, monthlyGoal, perks }, 
      { upsocert: true, new: true, upsert: true }
    );
    return res.status(200).json(updated);
  }
}