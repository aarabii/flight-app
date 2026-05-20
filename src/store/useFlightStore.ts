"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Flight {
  id: string
  flight_no: string
  airline: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: 'scheduled' | 'delayed' | 'cancelled' | 'departed' | 'arrived'
  base_price: number
}

export interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: 'economy' | 'business' | 'first'
  is_available: boolean
  extra_fee: number
}

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
  selectedFlight: Flight | null
  selectedSeat: Seat | null
  bookingStep: BookingStep
  passengerForm: PassengerForm
}

export interface FlightStoreActions {
  setSearchState: (search: Partial<SearchState>) => void
  setSelectedFlight: (flight: Flight | null) => void
  setSelectedSeat: (seat: Seat | null) => void
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
