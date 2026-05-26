-- Add prediction confidence metadata to restock recommendations.
-- This allows the analytics table to show how reliable each prediction is.

ALTER TABLE restock_recommendations
ADD COLUMN IF NOT EXISTS prediction_confidence VARCHAR(20) NOT NULL DEFAULT 'INSUFFICIENT DATA';

ALTER TABLE restock_recommendations
ADD CONSTRAINT restock_recommendations_prediction_confidence_check
  CHECK (prediction_confidence IN ('HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT DATA'));

UPDATE restock_recommendations
SET prediction_confidence = 'INSUFFICIENT DATA'
WHERE prediction_confidence IS NULL;
