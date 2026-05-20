"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function rescheduleBooking(
  bookingId: string,
  newFlightId: string,
  oldFlightId: string,
): Promise<{ success?: boolean; feeCharged?: number; error?: string }> {
  const supabase = await createClient();

  const { data: flights, error: flightsError } = await supabase
    .from("flights")
    .select("id, base_price")
    .in("id", [oldFlightId, newFlightId]);

  if (flightsError) {
    return { error: flightsError.message };
  }

  const oldFlight = flights?.find((flight) => flight.id === oldFlightId);
  const newFlight = flights?.find((flight) => flight.id === newFlightId);

  if (!oldFlight || !newFlight) {
    return { error: "Unable to load flight pricing for reschedule." };
  }

  const feeCharged = Math.max(
    0,
    Number(newFlight.base_price) - Number(oldFlight.base_price),
  );

  const { error: rescheduleError } = await supabase.from("reschedules").insert({
    booking_id: bookingId,
    old_flight_id: oldFlightId,
    new_flight_id: newFlightId,
    fee_charged: feeCharged,
  });

  if (rescheduleError) {
    return { error: rescheduleError.message };
  }

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({
      flight_id: newFlightId,
      status: "rescheduled",
    })
    .eq("id", bookingId)
    .eq("flight_id", oldFlightId)
    .select("id")
    .single();

  if (bookingError) {
    return { error: bookingError.message };
  }

  revalidatePath("/bookings");
  return { success: true, feeCharged };
}
