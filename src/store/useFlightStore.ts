"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface SearchState {
  origin: string
  destination: string
  date: string
  class: string
}

export interface PassengerForm {
  fullName: string
  passportNo: string
  nationality: string
  dob: string
}

export type BookingStep = "search" | "seating" | "passenger" | "confirmation"

export interface FlightStoreState {
  searchState: SearchState
  selectedFlight: any | null
  selectedSeat: any | null
  bookingStep: BookingStep
  passengerForm: PassengerForm
}

export interface FlightStoreActions {
  setSearchState: (search: Partial<SearchState>) => void
  setSelectedFlight: (flight: any) => void
  setSelectedSeat: (seat: any) => void
  setBookingStep: (step: BookingStep) => void
  updatePassengerForm: (form: Partial<PassengerForm>) => void
  resetBookingFlow: () => void
}

export const useFlightStore = create<FlightStoreState & FlightStoreActions>()(
  persist(
    (set) => ({
      searchState: {
        origin: "",
        destination: "",
        date: "",
        class: "economy",
      },
      selectedFlight: null,
      selectedSeat: null,
      bookingStep: "search",
      passengerForm: {
        fullName: "",
        passportNo: "",
        nationality: "",
        dob: "",
      },

      setSearchState: (search) =>
        set((state) => ({
          searchState: { ...state.searchState, ...search },
        })),

      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      setSelectedSeat: (seat) => set({ selectedSeat: seat }),
      setBookingStep: (step) => set({ bookingStep: step }),

      updatePassengerForm: (form) =>
        set((state) => ({
          passengerForm: { ...state.passengerForm, ...form },
        })),

      resetBookingFlow: () =>
        set({
          selectedSeat: null,
          passengerForm: {
            fullName: "",
            passportNo: "",
            nationality: "",
            dob: "",
          },
          bookingStep: "seating",
        }),
    }),
    {
      name: "aerolux-flight-storage",
      partialize: (state) => {
        // Exclude passenger passport number from persisting
        const { passengerForm, ...rest } = state
        return {
          ...rest,
          passengerForm: {
            ...passengerForm,
            passportNo: "",
          },
        }
      },
    }
  )
)
