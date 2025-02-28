import mongoose, { Schema, Document } from 'mongoose';

export interface ICarAdvert extends Document {
    title: string;
    description: string;
    price: number;
    photos: string[];
    car: Schema.Types.ObjectId;
}

const AdvertSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    photos: [{ type: String, required: true }],
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
});

export default mongoose.model<ICarAdvert>('CarAdvert', AdvertSchema);