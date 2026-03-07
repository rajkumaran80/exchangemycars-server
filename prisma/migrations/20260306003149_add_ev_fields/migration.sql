-- AlterTable
ALTER TABLE "car_adverts" ADD COLUMN     "evBatteryCapacityKwh" DOUBLE PRECISION,
ADD COLUMN     "evBatteryDescription" TEXT,
ADD COLUMN     "evBatteryWarrantyMiles" INTEGER,
ADD COLUMN     "evBatteryWarrantyMonths" INTEGER,
ADD COLUMN     "evChargeTimeAcMins" INTEGER,
ADD COLUMN     "evChargeTimeDcMins" INTEGER,
ADD COLUMN     "evMaxAcChargePowerKw" DOUBLE PRECISION,
ADD COLUMN     "evMaxDcChargePowerKw" DOUBLE PRECISION,
ADD COLUMN     "evMotorType" TEXT,
ADD COLUMN     "evRangeWltpMiles" INTEGER;
