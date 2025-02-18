import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './User.js'; // Import the IUser interface

export interface ICar extends Document {
  make: string;
  carModel: string; // Renamed from 'model' to 'carModel'
  year: number;
  price: number;
  description: string;
  imageUrl: string;
  owner: Types.ObjectId | IUser; // Can be an ObjectId or a populated User document
  interestedInExchange: boolean;
  interestedCars: Types.ObjectId[];
}

const CarSchema = new Schema<ICar>({
  make: { type: String, required: true },
  carModel: { type: String, required: true }, // Updated to 'carModel'
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  interestedInExchange: { type: Boolean, default: false },
  interestedCars: [{ type: Schema.Types.ObjectId, ref: 'Car' }],
});

export default model<ICar>('Car', CarSchema);