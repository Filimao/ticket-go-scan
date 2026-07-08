-- Bilhetes passam a nascer pendentes de pagamento, não válidos
ALTER TABLE public.tickets ALTER COLUMN status SET DEFAULT 'pending_payment';

-- Fecha a policy insegura: comprador deixava de ter update livre no próprio bilhete
DROP POLICY IF EXISTS "Users update own tickets" ON public.tickets;

-- Comprador só pode cancelar o PRÓPRIO bilhete enquanto pendente (ex: desistiu de pagar)
CREATE POLICY "Users cancel own pending tickets" ON public.tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending_payment')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Organizador confirma pagamento (única forma de tornar um bilhete válido)
CREATE OR REPLACE FUNCTION public.confirm_ticket_payment(_ticket_id UUID)
RETURNS public.tickets
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ticket public.tickets;
  _authorized boolean;
BEGIN
  SELECT (public.has_role(auth.uid(),'admin')
          OR EXISTS (
            SELECT 1 FROM public.tickets t
            JOIN public.events e ON e.id = t.event_id
            WHERE t.id = _ticket_id AND e.organizer_id = auth.uid()
          ))
  INTO _authorized;

  IF NOT _authorized THEN
    RAISE EXCEPTION 'Não autorizado a confirmar este bilhete';
  END IF;

  SELECT * INTO _ticket FROM public.tickets WHERE id = _ticket_id FOR UPDATE;

  IF _ticket.id IS NULL THEN
    RAISE EXCEPTION 'Bilhete não encontrado';
  END IF;

  IF _ticket.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Este bilhete não está pendente de pagamento';
  END IF;

  UPDATE public.tickets SET status = 'valid' WHERE id = _ticket_id RETURNING * INTO _ticket;
  RETURN _ticket;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_ticket_payment(UUID) TO authenticated;

-- Organizador rejeita/cancela pagamento não recebido
CREATE OR REPLACE FUNCTION public.reject_ticket_payment(_ticket_id UUID)
RETURNS public.tickets
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ticket public.tickets;
  _authorized boolean;
BEGIN
  SELECT (public.has_role(auth.uid(),'admin')
          OR EXISTS (
            SELECT 1 FROM public.tickets t
            JOIN public.events e ON e.id = t.event_id
            WHERE t.id = _ticket_id AND e.organizer_id = auth.uid()
          ))
  INTO _authorized;

  IF NOT _authorized THEN
    RAISE EXCEPTION 'Não autorizado a rejeitar este bilhete';
  END IF;

  UPDATE public.tickets SET status = 'cancelled' WHERE id = _ticket_id RETURNING * INTO _ticket;

  IF _ticket.id IS NULL THEN
    RAISE EXCEPTION 'Bilhete não encontrado';
  END IF;

  RETURN _ticket;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_ticket_payment(UUID) TO authenticated;

-- Mensagem clara no scanner quando o bilhete ainda não foi pago
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
  IF v_ticket.status = 'pending_payment' THEN
    INSERT INTO public.checkins(ticket_id, event_id, scanned_by, qr_code, result) VALUES (v_ticket.id, _event_id, v_user, _qr, 'pending_payment');
    RETURN jsonb_build_object('ok', false, 'code', 'pending_payment', 'message', 'Pagamento ainda não confirmado',
      'ticket', jsonb_build_object('buyer_name', v_ticket.buyer_name));
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
