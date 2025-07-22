
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  guest: mongoose.Types.ObjectId;
  cocktail: string;
  status: 'pending' | 'complete';
}

const OrderSchema: Schema = new Schema({
  guest: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  cocktail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'complete'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);
