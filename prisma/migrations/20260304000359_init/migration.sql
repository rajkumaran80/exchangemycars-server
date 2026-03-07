-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "facebookId" TEXT,
    "linkedinId" TEXT,
    "appleId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_adverts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "mileage" INTEGER NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "carMake" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "carModelDescription" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "drivetrainType" TEXT NOT NULL,
    "numberOfSeats" INTEGER NOT NULL,
    "numberOfDoors" INTEGER NOT NULL,
    "dateOfFirstRegistration" TEXT NOT NULL,
    "yearOfManufacture" INTEGER NOT NULL,
    "vehicleIdentificationNumber" TEXT NOT NULL,
    "numberOfPreviousKeepers" INTEGER NOT NULL,
    "dateOfLastKeeperChange" TEXT NOT NULL,
    "emissionClass" TEXT NOT NULL,
    "isStolen" BOOLEAN NOT NULL DEFAULT false,
    "isScrapped" BOOLEAN NOT NULL DEFAULT false,
    "isExported" BOOLEAN NOT NULL DEFAULT false,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "car_adverts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_makes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "car_makes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,

    CONSTRAINT "car_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "car_adverts_carMake_idx" ON "car_adverts"("carMake");

-- CreateIndex
CREATE INDEX "car_adverts_carModel_idx" ON "car_adverts"("carModel");

-- CreateIndex
CREATE INDEX "car_adverts_variant_idx" ON "car_adverts"("variant");

-- CreateIndex
CREATE INDEX "car_adverts_price_idx" ON "car_adverts"("price");

-- CreateIndex
CREATE INDEX "car_adverts_yearOfManufacture_idx" ON "car_adverts"("yearOfManufacture");

-- CreateIndex
CREATE INDEX "car_adverts_mileage_idx" ON "car_adverts"("mileage");

-- CreateIndex
CREATE INDEX "car_adverts_transmission_idx" ON "car_adverts"("transmission");

-- CreateIndex
CREATE INDEX "car_adverts_bodyType_idx" ON "car_adverts"("bodyType");

-- CreateIndex
CREATE INDEX "car_adverts_colour_idx" ON "car_adverts"("colour");

-- CreateIndex
CREATE INDEX "car_adverts_numberOfDoors_idx" ON "car_adverts"("numberOfDoors");

-- CreateIndex
CREATE INDEX "car_adverts_numberOfSeats_idx" ON "car_adverts"("numberOfSeats");

-- CreateIndex
CREATE INDEX "car_adverts_fuelType_idx" ON "car_adverts"("fuelType");

-- CreateIndex
CREATE UNIQUE INDEX "car_makes_name_key" ON "car_makes"("name");

-- AddForeignKey
ALTER TABLE "car_adverts" ADD CONSTRAINT "car_adverts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "car_makes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "car_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
