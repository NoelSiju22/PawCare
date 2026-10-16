-- PawCare: make order_items.product_id match products.id.
-- Current schema: products.id is TEXT (e.g. pr1), while order_items.product_id
-- was BIGINT. Product IDs should remain TEXT; orders.id remains BIGINT.

BEGIN;

-- Drop any existing foreign-key constraint(s) attached to order_items.product_id.
DO $$
DECLARE
  fk_name text;
BEGIN
  FOR fk_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f'
      AND t.relname = 'order_items'
      AND a.attname = 'product_id'
  LOOP
    EXECUTE format('ALTER TABLE public.order_items DROP CONSTRAINT %I', fk_name);
  END LOOP;
END $$;

-- Convert the FK column to the same type as products.id.
ALTER TABLE public.order_items
  ALTER COLUMN product_id TYPE text
  USING product_id::text;

-- Recreate the relationship. NOT VALID preserves any legacy/orphaned rows
-- that may already exist, while enforcing the FK for all new/updated rows.
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  NOT VALID;

COMMIT;

-- Optional cleanup/check after the migration:
-- SELECT oi.product_id
-- FROM public.order_items oi
-- LEFT JOIN public.products p ON p.id = oi.product_id
-- WHERE oi.product_id IS NOT NULL AND p.id IS NULL;
