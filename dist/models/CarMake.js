import mongoose, { Schema } from 'mongoose';
const VariantSchema = new Schema({
    name: { type: String, required: true },
    bodyType: { type: String, required: true },
    year: { type: Number, required: true },
});
const ModelSchema = new Schema({
    name: { type: String, required: true },
    variants: [VariantSchema],
});
const CarMakeSchema = new Schema({
    name: { type: String, required: true, unique: true },
    models: [ModelSchema],
});
export default mongoose.model('CarMake', CarMakeSchema);
