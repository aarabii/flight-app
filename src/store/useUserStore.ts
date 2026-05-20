"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * Minimal user shape stored in the client store.
 * We store full_name directly (sourced from user_metadata) rather
 * than importing the raw Supabase User type which doesn't expose it at the top level.
 */
export interface StoreUser {
  email?: string
  full_name?: string
}

/**
 * Booking as stored in the Zustand cache.
 * All fields optional-or-present to cover:
 *   - Optimistically added bookings (nested flight/seat/passenger objects)
 *   - DB-fetched bookings (joined flights/seats/passengers arrays from Supabase select)
 */
export interface CachedBooking {
  id: string
  pnr_code: string
  total_price: number
  status: string
  booked_at?: string
  created_at?: string
  seat_id?: string
  // Optimistic join shapes (added immediately after booking)
  flight?: {
    id?: string
    flight_no?: string
    airline?: string
    origin?: string
    destination?: string
    departs_at?: string
  }
  seat?: {
    seat_number?: string
    class?: string
  }
  passenger?: {
    full_name?: string
    passport_no?: string
    passportNo?: string
    nationality?: string
    dob?: string
  }
  // DB join shapes (arrays returned from Supabase select with relationships)
  flights?: {
    flight_no?: string
    airline?: string
    origin?: string
    destination?: string
    departs_at?: string
    arrives_at?: string
    aircraft_type?: string
  } | Array<{
    flight_no?: string
    airline?: string
    origin?: string
    destination?: string
    departs_at?: string
    arrives_at?: string
    aircraft_type?: string
  }>
  seats?: {
    seat_number?: string
    class?: string
  } | Array<{
    seat_number?: string
    class?: string
  }>
  passengers?: Array<{
    full_name?: string
    passport_no?: string
    nationality?: string
  }>
}

export interface UserStoreState {
  user: StoreUser | null
  cachedBookings: CachedBooking[]
}

export interface UserStoreActions {
  setUser: (user: StoreUser | null) => void
  setCachedBookings: (bookings: CachedBooking[]) => void
  addCachedBooking: (booking: CachedBooking) => void
  updateCachedBookingStatus: (bookingId: string, status: string) => void
  clearSession: () => void
}

export const useUserStore = create<UserStoreState & UserStoreActions>()(
  persist(
    (set) => ({
      user: null,
      cachedBookings: [],

      setUser: (user) => set({ user }),

      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),

      addCachedBooking: (booking) =>
        set((state) => ({
          cachedBookings: [booking, ...state.cachedBookings],
        })),

      updateCachedBookingStatus: (bookingId, status) =>
        set((state) => ({
          cachedBookings: state.cachedBookings.map((b) =>
            b.id === bookingId ? { ...b, status } : b
          ),
        })),

      clearSession: () => set({ user: null, cachedBookings: [] }),
    }),
    {
      name: "aerolux-user-storage",
      partialize: (state) => {
        // Strip out any passport information from traveler itinerary cache
        return {
          ...state,
          cachedBookings: state.cachedBookings.map((booking) => {
            if (!booking) return booking
            const cleanedBooking = { ...booking }

            if (cleanedBooking.passenger) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { passport_no, passportNo, ...pRest } = cleanedBooking.passenger
              cleanedBooking.passenger = pRest
            }

            if (Array.isArray(cleanedBooking.passengers)) {
              cleanedBooking.passengers = cleanedBooking.passengers.map((p) => {
                if (!p) return p
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { passport_no, ...passengerRest } = p
                return passengerRest
              })
            }

            return cleanedBooking
          }),
        }
      },
    }
  )
)
