'use server'

import { createClient } from '@/utils/supabase/server'

interface BookSeatParams {
  flightId: string
  seatId: string
  fullName: string
  passportNo: string
  nationality: string
  dob: string
}

export async function bookSeat({
  flightId,
  seatId,
  fullName,
  passportNo,
  nationality,
  dob,
}: BookSeatParams): Promise<{ data?: unknown; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('book_seat', {
    p_flight_id: flightId,
    p_seat_id: seatId,
    p_full_name: fullName,
    p_passport_no: passportNo,
    p_nationality: nationality,
    p_dob: dob,
  })

  if (error) {
    return { error: error.message }
  }

  return { data }
}
