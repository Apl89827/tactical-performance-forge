-- Fix linter: add SET search_path to functions without it
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_row_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, NULL);
    PERFORM public.write_audit_entry(TG_TABLE_NAME, v_id, TG_OP, v_old, v_new);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_id := COALESCE((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid, NULL);
    PERFORM public.write_audit_entry(TG_TABLE_NAME, v_id, TG_OP, v_old, v_new);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_id := COALESCE((to_jsonb(OLD)->>'id')::uuid, NULL);
    PERFORM public.write_audit_entry(TG_TABLE_NAME, v_id, TG_OP, v_old, v_new);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;