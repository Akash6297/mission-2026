import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // These two are for the Forgot Password feature
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
});

// VERY IMPORTANT: Use User (capital U)
export default mongoose.models.User || mongoose.model('User', UserSchema);