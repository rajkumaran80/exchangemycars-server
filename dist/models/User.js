// src/models/User.ts
import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
// Define the UserSchema
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    facebookId: { type: String },
    linkedinId: { type: String },
    appleId: { type: String },
});
// Hash the password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
// Export the User model
export default model('User', UserSchema);
