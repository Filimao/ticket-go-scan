
CREATE OR REPLACE FUNCTION public.tg_tickets_update_sold()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('valid','pending_payment','used') THEN
      UPDATE public.ticket_types SET quantity_sold = quantity_sold + 1 WHERE id = NEW.ticket_type_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('valid','pending_payment','used') THEN
      UPDATE public.ticket_types SET quantity_sold = GREATEST(0, quantity_sold - 1) WHERE id = OLD.ticket_type_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('valid','pending_payment','used') AND NEW.status = 'cancelled' THEN
      UPDATE public.ticket_types SET quantity_sold = GREATEST(0, quantity_sold - 1) WHERE id = NEW.ticket_type_id;
    ELSIF OLD.status = 'cancelled' AND NEW.status IN ('valid','pending_payment','used') THEN
      UPDATE public.ticket_types SET quantity_sold = quantity_sold + 1 WHERE id = NEW.ticket_type_id;
    END IF;
  END IF;
  RETURN NULL;
END; $$;

REVOKE EXECUTE ON FUNCTION public.tg_tickets_update_sold() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tickets_update_sold ON public.tickets;
CREATE TRIGGER tickets_update_sold
AFTER INSERT OR UPDATE OR DELETE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.tg_tickets_update_sold();

-- Reconcile current counts
UPDATE public.ticket_types tt SET quantity_sold = COALESCE(c.n, 0)
FROM (
  SELECT ticket_type_id, COUNT(*) AS n FROM public.tickets
  WHERE status IN ('valid','pending_payment','used')
  GROUP BY ticket_type_id
) c WHERE c.ticket_type_id = tt.id;

UPDATE public.ticket_types tt SET quantity_sold = 0
WHERE NOT EXISTS (SELECT 1 FROM public.tickets t WHERE t.ticket_type_id = tt.id AND t.status IN ('valid','pending_payment','used'));
