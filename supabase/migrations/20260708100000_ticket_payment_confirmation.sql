-- 1. Novo estado: bilhete nasce pendente até confirmares o pagamento
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'pending_payment';

-- 2. Bilhetes passam a nascer pendentes, não válidos
ALTER TABLE public.tickets ALTER COLUMN status SET DEFAULT 'pending_payment';

-- 3. Fecha a policy insegura: comprador deixa de poder fazer UPDATE livre no próprio bilhete
DROP POLICY IF EXISTS "Users update own tickets" ON public.tickets;

-- Comprador só pode cancelar o PRÓPRIO bilhete PENDENTE (ex: desistiu de pagar), nunca validar
CREATE POLICY "Users cancel own pending tickets" ON public.tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending_payment')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Organizador continua podendo gerir bilhetes do seu evento (via função abaixo, não update direto)

-- 4. Função segura para o organizador confirmar o pagamento
CREATE OR REPLACE FUNCTION public.confirm_ticket_payment(_ticket_id UUID)
RETURNS public.tickets
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ticket public.tickets;
BEGIN
  SELECT t.* INTO _ticket
  FROM public.tickets t
  JOIN public.events e ON e.id = t.event_id
  WHERE t.id = _ticket_id AND e.organizer_id = auth.uid()
  FOR UPDATE;

  IF _ticket.id IS NULL THEN
    RAISE EXCEPTION 'Bilhete não encontrado ou sem permissão';
  END IF;

  IF _ticket.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'Este bilhete não está pendente de pagamento';
  END IF;

  UPDATE public.tickets
  SET status = 'valid'
  WHERE id = _ticket_id
  RETURNING * INTO _ticket;

  RETURN _ticket;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_ticket_payment(UUID) TO authenticated;

-- 5. Função para o organizador rejeitar/cancelar um bilhete pendente (pagamento não recebido)
CREATE OR REPLACE FUNCTION public.reject_ticket_payment(_ticket_id UUID)
RETURNS public.tickets
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ticket public.tickets;
BEGIN
  SELECT t.* INTO _ticket
  FROM public.tickets t
  JOIN public.events e ON e.id = t.event_id
  WHERE t.id = _ticket_id AND e.organizer_id = auth.uid()
  FOR UPDATE;

  IF _ticket.id IS NULL THEN
    RAISE EXCEPTION 'Bilhete não encontrado ou sem permissão';
  END IF;

  UPDATE public.tickets
  SET status = 'cancelled'
  WHERE id = _ticket_id
  RETURNING * INTO _ticket;

  RETURN _ticket;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_ticket_payment(UUID) TO authenticated;
