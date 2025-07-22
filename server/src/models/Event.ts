import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  date: Date;
  description: string;
  qrCode: string;
  guests: string[];
  cocktails: { name: string; description: string; imageUrl?: string; }[];
  defaultCoupons: number;
}

const EventSchema: Schema = new Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  qrCode: { type: String, required: true },
  guests: [{ type: String }],
  defaultCoupons: { type: Number, default: 5 },
  cocktails: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String },
  }],
});

export default mongoose.model<IEvent>('Event', EventSchema);