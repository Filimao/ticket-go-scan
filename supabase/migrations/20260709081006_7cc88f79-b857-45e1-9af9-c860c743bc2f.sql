
-- platform_settings: restrict SELECT to admins
DROP POLICY IF EXISTS "All can read settings" ON public.platform_settings;
CREATE POLICY "Admins read settings" ON public.platform_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- checkins: add INSERT policy restricted to admins/organizers/staff of the event
CREATE POLICY "Authorized staff insert checkins" ON public.checkins
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = checkins.event_id AND e.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.event_staff s WHERE s.event_id = checkins.event_id AND s.user_id = auth.uid())
  );

-- ticket_types: restrict public read to published events only
DROP POLICY IF EXISTS "Public views ticket types" ON public.ticket_types;
CREATE POLICY "Public views ticket types for published events" ON public.ticket_types
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = ticket_types.event_id AND e.status = 'published')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = ticket_types.event_id AND e.organizer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only to needed roles
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.checkin_ticket(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checkin_ticket(text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.confirm_ticket_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_ticket_payment(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_ticket_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_ticket_payment(uuid) TO authenticated;
