import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'user' or 'admin'
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);