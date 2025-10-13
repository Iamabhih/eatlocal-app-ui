-- Add pickup states to order_status enum
DO $$ 
BEGIN
  -- Add ready_for_pickup
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ready_for_pickup' AND enumtypid = 'order_status'::regtype) THEN
    ALTER TYPE order_status ADD VALUE 'ready_for_pickup';
  END IF;
  
  -- Add picked_up
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'picked_up' AND enumtypid = 'order_status'::regtype) THEN
    ALTER TYPE order_status ADD VALUE 'picked_up';
  END IF;
END $$;