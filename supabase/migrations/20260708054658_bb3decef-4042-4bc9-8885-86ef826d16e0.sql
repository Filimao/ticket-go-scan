
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'ended';

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tickets_checked_in_idx ON public.tickets(event_id, checked_in);

CREATE TABLE IF NOT EXISTS public.event_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_staff TO authenticated;
GRANT ALL ON public.event_staff TO service_role;
ALTER TABLE public.event_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizers manage event staff" ON public.event_staff;
CREATE POLICY "Organizers manage event staff" ON public.event_staff FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_staff.event_id AND e.organizer_id = auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_staff.event_id AND e.organizer_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Staff view own assignments" ON public.event_staff;
CREATE POLICY "Staff view own assignments" ON public.event_staff FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  scanned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  qr_code text NOT NULL,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checkins_event_idx ON public.checkins(event_id, created_at DESC);
GRANT SELECT, INSERT ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizer/admin/staff view checkins" ON public.checkins;
CREATE POLICY "Organizer/admin/staff view checkins" ON public.checkins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = checkins.event_id AND e.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.event_staff s WHERE s.event_id = checkins.event_id AND s.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  commission_type text NOT NULL DEFAULT 'percentage',
  commission_value numeric(12,2) NOT NULL DEFAULT 10,
  currency text NOT NULL DEFAULT 'MZN',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All can read settings" ON public.platform_settings;
CREATE POLICY "All can read settings" ON public.platform_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins update settings" ON public.platform_settings;
CREATE POLICY "Admins update settings" ON public.platform_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_logs_created_idx ON public.admin_logs(created_at DESC);
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view logs" ON public.admin_logs;
CREATE POLICY "Admins view logs" ON public.admin_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins insert logs" ON public.admin_logs;
CREATE POLICY "Admins insert logs" ON public.admin_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_id = auth.uid());

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_approved_organizer boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Admins manage all events" ON public.events;
CREATE POLICY "Admins manage all events" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Staff view event tickets" ON public.tickets;
CREATE POLICY "Staff view event tickets" ON public.tickets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.event_staff s WHERE s.event_id = tickets.event_id AND s.user_id = auth.uid())
         OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Public read event images" ON storage.objects;
CREATE POLICY "Public read event images" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
DROP POLICY IF EXISTS "Organizers upload event images" ON storage.objects;
CREATE POLICY "Organizers upload event images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images' AND owner = auth.uid());
DROP POLICY IF EXISTS "Organizers update own event images" ON storage.objects;
CREATE POLICY "Organizers update own event images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-images' AND owner = auth.uid());
DROP POLICY IF EXISTS "Organizers delete own event images" ON storage.objects;
CREATE POLICY "Organizers delete own event images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-images' AND owner = auth.uid());

CREATE OR REPLACE FUNCTION public.checkin_ticket(_qr text, _event_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ticket public.tickets;
  v_event public.events;
  v_type_name text;
  v_authorized boolean;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unauthorized', 'message', 'Sessão inválida');
  END IF;
  SELECT (public.has_role(v_user,'admin')
          OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = _event_id AND e.organizer_id = v_user)
          OR EXISTS (SELECT 1 FROM public.event_staff s WHERE s.event_id = _event_id AND s.user_id = v_user))
    INTO v_authorized;
  IF NOT v_authorized THEN
    RETURN jsonb_build_object('ok', false, 'code', 'forbidden', 'message', 'Não autorizado a validar este evento');
  END IF;
  SELECT * INTO v_event FROM public.events WHERE id = _event_id;
  IF v_event.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'wrong_event', 'message', 'Evento não encontrado');
  END IF;
  UPDATE public.tickets t SET checked_in = true, checked_in_at = now(), checked_in_by = v_user, used_at = now(), status = 'used'
   WHERE t.qr_code = _qr AND t.event_id = _event_id AND t.status = 'valid' AND t.checked_in = false
  RETURNING * INTO v_ticket;
  IF v_ticket.id IS NOT NULL THEN
    SELECT name INTO v_type_name FROM public.ticket_types WHERE id = v_ticket.ticket_type_id;
    INSERT INTO public.checkins(ticket_id, event_id, scanned_by, qr_code, result) VALUES (v_ticket.id, _event_id, v_user, _qr, 'valid');
    RETURN jsonb_build_object('ok', true, 'code', 'valid', 'message', 'Bilhete válido',
      'ticket', jsonb_build_object('id', v_ticket.id, 'buyer_name', v_ticket.buyer_name,
        'ticket_type', v_type_name, 'event_title', v_event.title, 'checked_in_at', v_ticket.checked_in_at));
  END IF;
  SELECT * INTO v_ticket FROM public.tickets WHERE qr_code = _qr;
  IF v_ticket.id IS NULL THEN
    INSERT INTO public.checkins(event_id, scanned_by, qr_code, result) VALUES (_event_id, v_user, _qr, 'not_found');
    RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'QR Code inexistente');
  END IF;
  IF v_ticket.event_id <> _event_id THEN
    INSERT INTO public.checkins(ticket_id, event_id, scanned_by, qr_code, result) VALUES (v_ticket.id, _event_id, v_user, _qr, 'wrong_event');
    RETURN jsonb_build_object('ok', false, 'code', 'wrong_event', 'message', 'Bilhete não pertence a este evento');
  END IF;
  IF v_ticket.status = 'cancelled' THEN
    INSERT INTO public.checkins(ticket_id, event_id, scanned_by, qr_code, result) VALUES (v_ticket.id, _event_id, v_user, _qr, 'cancelled');
    RETURN jsonb_build_object('ok', false, 'code', 'cancelled', 'message', 'Bilhete cancelado');
  END IF;
  IF v_ticket.checked_in OR v_ticket.status = 'used' THEN
    INSERT INTO public.checkins(ticket_id, event_id, scanned_by, qr_code, result) VALUES (v_ticket.id, _event_id, v_user, _qr, 'already_used');
    RETURN jsonb_build_object('ok', false, 'code', 'already_used', 'message', 'Bilhete já utilizado',
      'ticket', jsonb_build_object('checked_in_at', v_ticket.checked_in_at, 'buyer_name', v_ticket.buyer_name));
  END IF;
  RETURN jsonb_build_object('ok', false, 'code', 'unknown', 'message', 'Não foi possível validar');
END; $$;

GRANT EXECUTE ON FUNCTION public.checkin_ticket(text, uuid) TO authenticated;
