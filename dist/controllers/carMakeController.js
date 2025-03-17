import CarMake from "../models/CarMake.js";
// Fetch all car makes and models
export const getCarMakes = async (req, res) => {
    try {
        const carMakes = await CarMake.find();
        res.json(carMakes);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
// Add a new car name
export const addCarMake = async (req, res) => {
    try {
        const { make } = req.body;
        const newCarMake = new CarMake({ make, models: [] });
        await newCarMake.save();
        res.status(201).json(newCarMake);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
export const updateCarMake = async (req, res) => {
    try {
        const { make } = req.params;
        const { newMake } = req.body;
        const carMake = await CarMake.findOne({ make });
        if (!carMake) {
            return res.status(404).json({ message: 'Car name not found' });
        }
        carMake.name = newMake;
        await carMake.save();
        res.json(carMake);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
export const deleteCarMake = async (req, res) => {
    try {
        const { make } = req.params;
        const result = await CarMake.deleteOne({ make });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Car name not found' });
        }
        res.json({ message: 'Car name deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
// Add a new model to a car name
export const addCarModel = async (req, res) => {
    try {
        const { make } = req.params;
        const { name, variants } = req.body;
        const carMake = await CarMake.findOne({ make });
        if (!carMake) {
            return res.status(404).json({ message: 'Car name not found' });
        }
        carMake.models.push({ name, variants });
        await carMake.save();
        res.status(201).json(carMake);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
// Update a car model
export const updateCarModel = async (req, res) => {
    try {
        const { make, modelName } = req.params;
        const { name, variants } = req.body;
        const carMake = await CarMake.findOne({ make });
        if (!carMake) {
            return res.status(404).json({ message: 'Car name not found' });
        }
        const modelIndex = carMake.models.findIndex((m) => m.name === modelName);
        if (modelIndex === -1) {
            return res.status(404).json({ message: 'Model not found' });
        }
        carMake.models[modelIndex] = { name, variants };
        await carMake.save();
        res.json(carMake);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
// Delete a car model
export const deleteCarModel = async (req, res) => {
    try {
        const { make, modelName } = req.params;
        const carMake = await CarMake.findOne({ make });
        if (!carMake) {
            return res.status(404).json({ message: 'Car name not found' });
        }
        carMake.models = carMake.models.filter((m) => m.name !== modelName);
        await carMake.save();
        res.json(carMake);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
export const addCarVariant = async (req, res) => {
    try {
        const { make, modelName } = req.params;
        const { name, bodyType, year } = req.body;
        const carMake = await CarMake.findOne({ make });
        if (!carMake) {
            return res.status(404).json({ message: 'Car name not found' });
        }
        const modelIndex = carMake.models.findIndex((m) => m.name === modelName);
        if (modelIndex === -1) {
            return res.status(404).json({ message: 'Model not found' });
        }
        carMake.models[modelIndex].variants.push({ name, bodyType, year });
        await carMake.save();
        res.status(201).json(carMake);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
export const updateCarVariant = async (req, res) => {
    try {
        const { make, modelName, variantName } = req.params;
        const { name, bodyType, year } = req.body;
        const carMake = await CarMake.findOne({ make });
        if (!carMake) {
            return res.status(404).json({ message: 'Car name not found' });
        }
        const modelIndex = carMake.models.findIndex((m) => m.name === modelName);
        if (modelIndex === -1) {
            return res.status(404).json({ message: 'Model not found' });
        }
        const variantIndex = carMake.models[modelIndex].variants.findIndex((v) => v.name === variantName);
        if (variantIndex === -1) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        carMake.models[modelIndex].variants[variantIndex] = { name, bodyType, year };
        await carMake.save();
        res.json(carMake);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
export const deleteCarVariant = async (req, res) => {
    try {
        const { make, modelName, variantName } = req.params;
        const carMake = await CarMake.findOne({ make });
        if (!carMake) {
            return res.status(404).json({ message: 'Car name not found' });
        }
        const modelIndex = carMake.models.findIndex((m) => m.name === modelName);
        if (modelIndex === -1) {
            return res.status(404).json({ message: 'Model not found' });
        }
        carMake.models[modelIndex].variants = carMake.models[modelIndex].variants.filter((v) => v.name !== variantName);
        await carMake.save();
        res.json(carMake);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
