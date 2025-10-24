-- Allow admins to manage manual access for any user
CREATE OR REPLACE FUNCTION public.set_user_manual_access(_target_user_id UUID, _manual BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.user_activity (user_id, manual_access)
  VALUES (_target_user_id, COALESCE(_manual, FALSE))
  ON CONFLICT (user_id)
  DO UPDATE SET
    manual_access = EXCLUDED.manual_access,
    updated_at = now();
END;
$$;
