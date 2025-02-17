-- CreateTable
CREATE TABLE "mantle_launchpad_metadata" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'No Name Provided',
    "description" TEXT NOT NULL DEFAULT 'No Description Provided',
    "logo" TEXT,
    "website" TEXT,
    "whitepaper" TEXT,

    CONSTRAINT "mantle_launchpad_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mantle_launchpad_metadata_id_key" ON "mantle_launchpad_metadata"("id");
