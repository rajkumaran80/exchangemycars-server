import { CarMake, CarModel, Variant } from '@prisma/client';

export type IVariant = Variant;
export type ICarModel = CarModel & { variants: Variant[] };
export type ICarMake = CarMake & { models: ICarModel[] };
