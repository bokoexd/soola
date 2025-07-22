import mongoose, { Schema, Document } from 'mongoose';

export interface IGuest extends Document {
  email: string;
  event: mongoose.Types.ObjectId;
  claimed: boolean;
  coupons: number;
  couponHistory: { cocktail: string; timestamp: Date; }[];
}

const GuestSchema: Schema = new Schema({
  email: { type: String, required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  claimed: { type: Boolean, default: false },
  coupons: { type: Number, default: 5 },
  couponHistory: [{ 
    cocktail: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
});

export default mongoose.model<IGuest>('Guest', GuestSchema);
