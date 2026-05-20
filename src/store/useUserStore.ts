"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface UserStoreState {
  user: any | null
  cachedBookings: any[]
}

export interface UserStoreActions {
  setUser: (user: any) => void
  setCachedBookings: (bookings: any[]) => void
  addCachedBooking: (booking: any) => void
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
              const { passport_no, passportNo, ...pRest } = cleanedBooking.passenger
              cleanedBooking.passenger = pRest
            }

            if (cleanedBooking.passengers) {
              if (Array.isArray(cleanedBooking.passengers)) {
                cleanedBooking.passengers = cleanedBooking.passengers.map((p: any) => {
                  if (!p) return p
                  const { passport_no, passportNo, ...passengerRest } = p
                  return passengerRest
                })
              } else {
                const { passport_no, passportNo, ...passengerRest } = cleanedBooking.passengers as any
                cleanedBooking.passengers = passengerRest
              }
            }

            return cleanedBooking
          }),
        }
      },
    }
  )
)
