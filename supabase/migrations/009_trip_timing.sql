ALTER TABLE trips
ADD COLUMN IF NOT EXISTS date_range_label TEXT;

ALTER TABLE published_itineraries
ADD COLUMN IF NOT EXISTS date_range_label TEXT;

UPDATE trips
SET date_range_label = CASE
  WHEN start_date IS NOT NULL AND end_date IS NOT NULL THEN
    TO_CHAR(start_date, 'Mon DD, YYYY') || ' - ' || TO_CHAR(end_date, 'Mon DD, YYYY')
  WHEN start_date IS NOT NULL THEN
    TO_CHAR(start_date, 'Mon DD, YYYY')
  WHEN end_date IS NOT NULL THEN
    TO_CHAR(end_date, 'Mon DD, YYYY')
  ELSE date_range_label
END
WHERE date_range_label IS NULL;

UPDATE published_itineraries
SET date_range_label = CASE
  WHEN start_date IS NOT NULL AND end_date IS NOT NULL THEN
    TO_CHAR(start_date, 'Mon DD, YYYY') || ' - ' || TO_CHAR(end_date, 'Mon DD, YYYY')
  WHEN start_date IS NOT NULL THEN
    TO_CHAR(start_date, 'Mon DD, YYYY')
  WHEN end_date IS NOT NULL THEN
    TO_CHAR(end_date, 'Mon DD, YYYY')
  ELSE date_range_label
END
WHERE date_range_label IS NULL;
