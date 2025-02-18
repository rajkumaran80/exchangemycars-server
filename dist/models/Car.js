import { Schema, model } from 'mongoose';
const CarSchema = new Schema({
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
export default model('Car', CarSchema);
