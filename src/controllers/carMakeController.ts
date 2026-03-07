import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const getCarMakes = async (req: Request, res: Response) => {
    try {
        const carMakes = await prisma.carMake.findMany({
            include: { models: { include: { variants: true } } }
        });
        res.json(carMakes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const addCarMake = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const newCarMake = await prisma.carMake.create({ data: { name } });
        res.status(201).json(newCarMake);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateCarMake = async (req: Request, res: Response) => {
    try {
        const { make } = req.params;
        const { newMake } = req.body;

        const carMake = await prisma.carMake.findUnique({ where: { name: make } });
        if (!carMake) return res.status(404).json({ message: 'Car make not found' });

        const updated = await prisma.carMake.update({ where: { id: carMake.id }, data: { name: newMake } });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteCarMake = async (req: Request, res: Response) => {
    try {
        const { make } = req.params;
        const carMake = await prisma.carMake.findUnique({ where: { name: make } });
        if (!carMake) return res.status(404).json({ message: 'Car make not found' });

        await prisma.carMake.delete({ where: { id: carMake.id } });
        res.json({ message: 'Car make deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const addCarModel = async (req: Request, res: Response) => {
    try {
        const { make } = req.params;
        const { name, variants } = req.body;

        const carMake = await prisma.carMake.findUnique({ where: { name: make } });
        if (!carMake) return res.status(404).json({ message: 'Car make not found' });

        const carModel = await prisma.carModel.create({
            data: {
                name,
                makeId: carMake.id,
                variants: {
                    create: (variants || []).map((v: any) => ({ name: v.name, bodyType: v.bodyType, year: Number(v.year) }))
                }
            },
            include: { variants: true }
        });
        res.status(201).json(carModel);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateCarModel = async (req: Request, res: Response) => {
    try {
        const { make, modelName } = req.params;
        const { name, variants } = req.body;

        const carMake = await prisma.carMake.findUnique({ where: { name: make } });
        if (!carMake) return res.status(404).json({ message: 'Car make not found' });

        const carModel = await prisma.carModel.findFirst({ where: { name: modelName, makeId: carMake.id } });
        if (!carModel) return res.status(404).json({ message: 'Model not found' });

        const updated = await prisma.carModel.update({
            where: { id: carModel.id },
            data: { name },
            include: { variants: true }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteCarModel = async (req: Request, res: Response) => {
    try {
        const { make, modelName } = req.params;

        const carMake = await prisma.carMake.findUnique({ where: { name: make } });
        if (!carMake) return res.status(404).json({ message: 'Car make not found' });

        const carModel = await prisma.carModel.findFirst({ where: { name: modelName, makeId: carMake.id } });
        if (!carModel) return res.status(404).json({ message: 'Model not found' });

        await prisma.carModel.delete({ where: { id: carModel.id } });
        res.json({ message: 'Model deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const addCarVariant = async (req: Request, res: Response) => {
    try {
        const { make, modelName } = req.params;
        const { name, bodyType, year } = req.body;

        const carMake = await prisma.carMake.findUnique({ where: { name: make } });
        if (!carMake) return res.status(404).json({ message: 'Car make not found' });

        const carModel = await prisma.carModel.findFirst({ where: { name: modelName, makeId: carMake.id } });
        if (!carModel) return res.status(404).json({ message: 'Model not found' });

        const variant = await prisma.variant.create({
            data: { name, bodyType, year: Number(year), modelId: carModel.id }
        });
        res.status(201).json(variant);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateCarVariant = async (req: Request, res: Response) => {
    try {
        const { make, modelName, variantName } = req.params;
        const { name, bodyType, year } = req.body;

        const carMake = await prisma.carMake.findUnique({ where: { name: make } });
        if (!carMake) return res.status(404).json({ message: 'Car make not found' });

        const carModel = await prisma.carModel.findFirst({ where: { name: modelName, makeId: carMake.id } });
        if (!carModel) return res.status(404).json({ message: 'Model not found' });

        const variant = await prisma.variant.findFirst({ where: { name: variantName, modelId: carModel.id } });
        if (!variant) return res.status(404).json({ message: 'Variant not found' });

        const updated = await prisma.variant.update({
            where: { id: variant.id },
            data: { name, bodyType, year: Number(year) }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteCarVariant = async (req: Request, res: Response) => {
    try {
        const { make, modelName, variantName } = req.params;

        const carMake = await prisma.carMake.findUnique({ where: { name: make } });
        if (!carMake) return res.status(404).json({ message: 'Car make not found' });

        const carModel = await prisma.carModel.findFirst({ where: { name: modelName, makeId: carMake.id } });
        if (!carModel) return res.status(404).json({ message: 'Model not found' });

        const variant = await prisma.variant.findFirst({ where: { name: variantName, modelId: carModel.id } });
        if (!variant) return res.status(404).json({ message: 'Variant not found' });

        await prisma.variant.delete({ where: { id: variant.id } });
        res.json({ message: 'Variant deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
