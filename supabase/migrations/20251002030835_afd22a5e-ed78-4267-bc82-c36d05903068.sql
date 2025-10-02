-- Fix the handle_new_user function to use SECURITY DEFINER
-- This allows the trigger to insert into profiles table regardless of RLS policies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, avatar_url)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;