
-- 1) checkins UPDATE/DELETE policies
CREATE POLICY "Staff can update event checkins"
  ON public.checkins FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = checkins.event_id AND e.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.event_staff s WHERE s.event_id = checkins.event_id AND s.user_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = checkins.event_id AND e.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.event_staff s WHERE s.event_id = checkins.event_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Staff can delete event checkins"
  ON public.checkins FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = checkins.event_id AND e.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.event_staff s WHERE s.event_id = checkins.event_id AND s.user_id = auth.uid())
  );

-- 2) Lock down internal SECURITY DEFINER functions from being called via the API.
--    These are trigger/utility functions that should never be RPC-called by clients.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_tickets_update_sold() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Ensure they still work in triggers / from RLS policies via the internal role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.tg_tickets_update_sold() TO service_role;
GRANT EXECUTE ON FUNCTION public.tg_touch_updated_at() TO service_role;

-- Keep RPC functions callable by users; they enforce their own authorization checks internally.
-- (confirm_ticket_payment, reject_ticket_payment, checkin_ticket keep default EXECUTE.)
