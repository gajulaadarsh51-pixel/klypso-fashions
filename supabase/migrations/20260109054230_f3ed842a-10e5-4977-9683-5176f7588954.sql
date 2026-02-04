-- Drop restrictive policies and create permissive ones for public read access
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Create a PERMISSIVE policy for public read access
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);