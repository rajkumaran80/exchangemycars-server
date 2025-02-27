import mongoose, { Schema, Document } from 'mongoose';

export interface IVariant {
    name: string;
    bodyType: string;
    year: number;
}

export interface IModel {
    name: string;
    variants: IVariant[];
}

export interface ICarMake extends Document {
    make: string;
    models: IModel[];
}

const VariantSchema: Schema = new Schema({
    name: { type: String, required: true },
    bodyType: { type: String, required: true },
    year: { type: Number, required: true },
});

const ModelSchema: Schema = new Schema({
    name: { type: String, required: true },
    variants: [VariantSchema],
});

const CarMakeSchema: Schema = new Schema({
    make: { type: String, required: true, unique: true },
    models: [ModelSchema],
});

export default mongoose.model<ICarMake>('CarMake', CarMakeSchema);