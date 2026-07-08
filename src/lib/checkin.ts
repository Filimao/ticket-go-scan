import { supabase } from "@/integrations/supabase/client";

export interface CheckinResult {
  ok: boolean;
  code:
    | "valid"
    | "not_found"
    | "cancelled"
    | "already_used"
    | "wrong_event"
    | "forbidden"
    | "unauthorized"
    | "unknown";
  message: string;
  ticket?: {
    id?: string;
    buyer_name?: string;
    ticket_type?: string;
    event_title?: string;
    checked_in_at?: string;
  };
}

export async function checkinTicket(qr: string, eventId: string): Promise<CheckinResult> {
  const { data, error } = await supabase.rpc("checkin_ticket", {
    _qr: qr,
    _event_id: eventId,
  });
  if (error) {
    return { ok: false, code: "unknown", message: error.message };
  }
  return data as unknown as CheckinResult;
}