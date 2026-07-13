import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const subscriptionSchema = new mongoose.Schema({
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', required: true },
  orderId: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  amount: { type: Number, default: 0 },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, select: false }, // `select: false` to not send it by default
  hasPassword: { type: Boolean, default: false },
  googleId: { type: String },
  loginMethod: { type: String, enum: ['email', 'google', 'otp'], default: 'otp' },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  profileImage: { type: String, default: null },
  
  // Fields from other parts of the app
  preferredLanguage: { type: String, default: 'en' },
  testsTaken: { type: Number, default: 0 },
  totalMockTestsTaken: { type: Number, default: 0 },
  totalPracticeSetsTaken: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  subscriptions: { type: [subscriptionSchema], default: [] },

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