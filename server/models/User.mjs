import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false }, // `select: false` to not send it by default
  hasPassword: { type: Boolean, default: false },
  googleId: { type: String },
  loginMethod: { type: String, enum: ['email', 'google', 'otp'], default: 'otp' },
  
  // Fields from other parts of the app
  preferredLanguage: { type: String, default: 'en' },
  testsTaken: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },

}, { timestamps: true });

// Hash password before saving if it's modified
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.hasPassword = true; // Mark that user now has a password
});
 
// Method to compare entered password with the hashed one in the DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;