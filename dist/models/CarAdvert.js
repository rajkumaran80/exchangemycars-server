import mongoose, { Schema } from 'mongoose';
const CarAdvertSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
    mileage: { type: Number, required: true },
    registrationNumber: { type: String, required: true },
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
    yearOfManufacture: { type: Number, required: true },
    vehicleIdentificationNumber: { type: String, required: true },
    numberOfPreviousKeepers: { type: Number, required: true },
    dateOfLastKeeperChange: { type: String, required: true },
    previousKeeperAcquisitionDate: { type: String, required: true },
    isStolen: { type: Boolean, default: false },
    isScrapped: { type: Boolean, default: false },
    isExported: { type: Boolean, default: false },
    isImported: { type: Boolean, default: false },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }],
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    postcode: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
});
CarAdvertSchema.index({ carMake: 1 });
CarAdvertSchema.index({ carModel: 1 });
CarAdvertSchema.index({ variant: 1 });
CarAdvertSchema.index({ price: 1 });
CarAdvertSchema.index({ yearOfManufacture: 1 });
CarAdvertSchema.index({ mileage: 1 });
CarAdvertSchema.index({ transmission: 1 });
CarAdvertSchema.index({ bodyType: 1 });
CarAdvertSchema.index({ colour: 1 });
CarAdvertSchema.index({ numberOfDoors: 1 });
CarAdvertSchema.index({ numberOfSeats: 1 });
CarAdvertSchema.index({ fuelType: 1 });
export default mongoose.model('CarAdvert', CarAdvertSchema);
