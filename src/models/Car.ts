import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './User.js';

// Interface for Car
export interface ICar extends Document {
  _id: Types.ObjectId;
  mileage: number;
  registrationNumber: string;
  carMake: string;
  carModel: string;
  variant: string;
  vehicleShortDescription: string;
  vehicleFullDescription: string;
  bodyType: string;
  transmission: string;
  fuelType: string;
  colour: string;
  drivetrainType: string;
  numberOfSeats: number;
  numberOfDoors: number;
  dateOfFirstRegistration: string;
  yearOfManufacture: number;
  vehicleIdentificationNumber: string;
  numberOfPreviousKeepers: number;
  dateOfLastKeeperChange: string;
  previousKeeperAcquisitionDate: string;
  isStolen: boolean;
  isScrapped: boolean;
  isExported: boolean;
  isImported: boolean;
  owner: Types.ObjectId | IUser;
}

// Schema for Car
const CarSchema: Schema = new Schema({
  mileage: { type: Number, required: true },
  registrationNumber: { type: String, required: true},
  carMake: { type: String, required: true },
  carModel: { type: String, required: true },
  variant: { type: String, required: true },
  vehicleShortDescription: { type: String, required: true },
  vehicleFullDescription: { type: String, required: true },
  bodyType: { type: String, required: true },
  transmission: { type: String, required: true },
  fuelType: { type: String, required: true },
  colour: { type: String, required: true },
  drivetrainType: { type: String, required: true },
  numberOfSeats: { type: Number, required: true },
  numberOfDoors: { type: Number, required: true },
  dateOfFirstRegistration: { type: String, required: true },
  yearOfManufacture:  { type: Number, required: true },
  vehicleIdentificationNumber: { type: String, required: true},
  numberOfPreviousKeepers: { type: Number, required: true },
  dateOfLastKeeperChange: { type: String, required: true },
  previousKeeperAcquisitionDate: { type: String, required: true },
  isStolen: { type: Boolean, default: false },
  isScrapped: { type: Boolean, default: false },
  isExported: { type: Boolean, default: false },
  isImported: { type: Boolean, default: false },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
});

CarSchema.index({ carMake: 1 });
CarSchema.index({ carModel: 1 });
CarSchema.index({ variant: 1 });
CarSchema.index({ price: 1 });
CarSchema.index({ yearOfManufacture: 1 });
CarSchema.index({ mileage: 1 });
CarSchema.index({ transmission: 1 });
CarSchema.index({ bodyType: 1 });
CarSchema.index({ colour: 1 });
CarSchema.index({ numberOfDoors: 1 });
CarSchema.index({ numberOfSeats: 1 });
CarSchema.index({ fuelType: 1 });

// Create and export the Car model
export default mongoose.model<ICar>('Car', CarSchema);