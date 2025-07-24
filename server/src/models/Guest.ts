import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IGuest extends Document {
  email: string;
  password?: string; // Make password optional for now, will be required on first claim
  event: mongoose.Types.ObjectId;
  claimed: boolean;
  coupons: number;
  couponHistory: { cocktail: string; timestamp: Date; }[];
  claimedCocktails: string[]; // New field to store claimed cocktails
  matchPassword(enteredPassword: string): Promise<boolean>; // Add this method to the interface
}

const GuestSchema: Schema = new Schema({
  email: { type: String, required: true },
  password: { type: String, select: false }, // Password will not be returned by default queries
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  claimed: { type: Boolean, default: false },
  coupons: { type: Number, default: 5 },
  couponHistory: [{
    cocktail: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  claimedCocktails: [{ type: String }] // New field to store claimed cocktails
});

GuestSchema.index({ email: 1, event: 1 }, { unique: true });

// Hash password before saving
GuestSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  // Ensure password is a non-empty string before hashing
  if (this.password && typeof this.password === 'string' && this.password.trim() !== '') {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare passwords with proper type checking
GuestSchema.methods.matchPassword = async function (enteredPassword: string) {
  // If there's no password set or it's not a string, authentication fails
  if (!this.password || typeof this.password !== 'string') {
    return false;
  }
  
  // Only compare if both passwords are valid strings
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IGuest>('Guest', GuestSchema);
