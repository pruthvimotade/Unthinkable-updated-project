-- Add geographic centroids used to score delivery agents against pickup areas.
ALTER TABLE "areas"
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7);
