"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RiPlaneLine, RiUserLine, RiPassportLine, RiFlagLine, RiCalendarLine, RiLockLine, RiCheckDoubleLine, RiAlertFill, RiLoader4Line } from "@remixicon/react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useFlightStore } from "@/store/useFlightStore"
import { useUserStore } from "@/store/useUserStore"
import { useStoreHydration } from "@/store/useStoreHydration"
import { bookSeat } from "@/app/actions/book-seat"

interface SeatMapProps {
  flightId: string
  flightNo: string
  airline: string
  basePrice: number
  origin: string
  destination: string
  onClose: () => void
}

export function SeatMap({ flightId, flightNo, airline, basePrice, origin, destination, onClose }: SeatMapProps) {
  const [seats, setSeats] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Zustand store variables with Next.js SSR hydration safety
  const storeSelectedSeat = useStoreHydration(useFlightStore, (state) => state.selectedSeat)
  const selectedSeat = storeSelectedSeat !== undefined ? storeSelectedSeat : null
  const setSelectedSeat = useFlightStore((state) => state.setSelectedSeat)

  const storePassengerForm = useStoreHydration(useFlightStore, (state) => state.passengerForm)
  const passengerForm = storePassengerForm !== undefined ? storePassengerForm : { fullName: "", passportNo: "", nationality: "", dob: "" }
  const updatePassengerForm = useFlightStore((state) => state.updatePassengerForm)

  const storeUser = useStoreHydration(useUserStore, (state) => state.user)
  const user = storeUser !== undefined ? storeUser : null

  const addCachedBooking = useUserStore((state) => state.addCachedBooking)
  const setBookingStep = useFlightStore((state) => state.setBookingStep)
  const resetBookingFlow = useFlightStore((state) => state.resetBookingFlow)

  // Local state for passenger verification inputs synced to store
  const [fullName, setFullNameState] = React.useState("")
  const [passportNo, setPassportNoState] = React.useState("")
  const [nationality, setNationalityState] = React.useState("")
  const [dob, setDobState] = React.useState("")

  // Submission & screen states
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [bookingSuccess, setBookingSuccess] = React.useState<any>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [formErrors, setFormErrors] = React.useState<{ [key: string]: string }>({})

  // Initialize form fields once store is hydrated
  React.useEffect(() => {
    if (passengerForm.fullName) setFullNameState(passengerForm.fullName)
    if (passengerForm.passportNo) setPassportNoState(passengerForm.passportNo)
    if (passengerForm.nationality) setNationalityState(passengerForm.nationality)
    if (passengerForm.dob) setDobState(passengerForm.dob)
  }, [passengerForm])

  // Sync utilities to push inputs to the Zustand store
  const setFullName = (val: string) => {
    setFullNameState(val)
    updatePassengerForm({ fullName: val })
  }
  const setPassportNo = (val: string) => {
    setPassportNoState(val)
    updatePassengerForm({ passportNo: val })
  }
  const setNationality = (val: string) => {
    setNationalityState(val)
    updatePassengerForm({ nationality: val })
  }
  const setDob = (val: string) => {
    setDobState(val)
    updatePassengerForm({ dob: val })
  }

  // Pre-fill profile name if auth user profile name exists and form is empty
  React.useEffect(() => {
    if (user && !fullName) {
      setFullName(user.full_name || "")
    }
  }, [user, fullName])

  // Fetch seat map on flightId changes
  React.useEffect(() => {
    const supabase = createClient()
    
    async function fetchSeats() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("seats")
        .select("*")
        .eq("flight_id", flightId)
        .order("seat_number", { ascending: true })
      
      if (data) {
        // Sort seats numerically and then by seat letter
        const sorted = [...data].sort((a, b) => {
          const rowA = parseInt(a.seat_number)
          const rowB = parseInt(b.seat_number)
          if (rowA !== rowB) return rowA - rowB
          const letterA = a.seat_number.replace(/[0-9]/g, '')
          const letterB = b.seat_number.replace(/[0-9]/g, '')
          return letterA.localeCompare(letterB)
        })
        setSeats(sorted)
      }
      setIsLoading(false)
    }

    fetchSeats()
  }, [flightId])

  // Supabase Realtime subscription — keep seat map live (FIX 3)
  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`seats-realtime-${flightId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          const updatedSeat = payload.new as {
            id: string
            flight_id: string
            seat_number: string
            class: 'economy' | 'business' | 'first'
            is_available: boolean
            extra_fee: number
          }
          setSeats((prev) =>
            prev.map((s) => (s.id === updatedSeat.id ? updatedSeat : s))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [flightId])

  // Group seats by row number
  const groupedRows: { [key: number]: any[] } = {}
  seats.forEach((seat) => {
    const rowNum = parseInt(seat.seat_number)
    if (!groupedRows[rowNum]) {
      groupedRows[rowNum] = []
    }
    groupedRows[rowNum].push(seat)
  })

  // Get pricing by seat class
  const getSeatCost = (seat: any) => {
    return basePrice + Number(seat.extra_fee)
  }

  // Handle seat click
  const handleSelectSeat = (seat: any) => {
    if (!seat.is_available) return
    const nextSeat = seat === selectedSeat ? null : seat
    setSelectedSeat(nextSeat)
    setSubmitError(null)
    if (nextSeat) {
      setBookingStep("passenger")
    } else {
      setBookingStep("seating")
    }
  }

  // Validate form details
  const validateForm = () => {
    const errs: { [key: string]: string } = {}
    if (!fullName.trim()) errs.fullName = "Passenger name is required."
    if (!passportNo.trim()) errs.passportNo = "Passport number is required."
    if (!nationality.trim()) errs.nationality = "Nationality is required."
    if (!dob) errs.dob = "Date of birth is required."
    
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Perform RPC seat booking via server action (FIX 1)
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!selectedSeat) return
    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await bookSeat({
        flightId,
        seatId: selectedSeat.id,
        fullName,
        passportNo,
        nationality,
        dob,
      })

      if (result.error) {
        // FIX 2 — Optimistic rollback on booking failure
        setSelectedSeat(null)
        setBookingStep('seating')
        setSubmitError(result.error)
        setIsSubmitting(false)
      } else {
        const data = result.data as {
          booking_id: string
          pnr_code: string
          total_price: number
          departs_at?: string
        }
        // Cache the successful booking details instantly!
        const newBooking = {
          id: data.booking_id,
          pnr_code: data.pnr_code,
          total_price: data.total_price,
          status: "confirmed",
          created_at: new Date().toISOString(),
          flight: {
            id: flightId,
            flight_no: flightNo,
            airline: airline,
            origin: origin,
            destination: destination,
            departs_at: data.departs_at || new Date().toISOString(),
          },
          passenger: {
            full_name: fullName,
            nationality: nationality,
            dob: dob,
          },
          seat: {
            seat_number: selectedSeat.seat_number,
            class: selectedSeat.class,
          }
        }

        addCachedBooking(newBooking)
        setBookingSuccess(data)
        setBookingStep("confirmation")
        setIsSubmitting(false)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during visual ticketing."
      // FIX 2 — Optimistic rollback on unexpected error
      setSelectedSeat(null)
      setBookingStep('seating')
      setSubmitError(message)
      setIsSubmitting(false)
    }
  }

  // SUCCESS STATE VIEW
  if (bookingSuccess) {
    return (
      <div className="text-center p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
          <RiCheckDoubleLine className="h-8 w-8 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold font-heading text-zinc-900 dark:text-zinc-50">Booking Confirmed!</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your seat locks and passenger boarding records have settled atomically.
          </p>
        </div>

        {/* Ticket Board */}
        <div className="max-w-md mx-auto border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-lg bg-zinc-50 dark:bg-zinc-900 font-sans">
          <div className="bg-primary px-6 py-3 text-white text-left flex justify-between items-center">
            <span className="font-bold text-sm tracking-widest">{flightNo}</span>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
              {selectedSeat?.class} Class
            </span>
          </div>
          <div className="p-6 text-left grid grid-cols-2 gap-4 border-b border-dashed border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">Passenger</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{fullName}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">PNR Code</p>
              <p className="text-sm font-extrabold text-primary tracking-widest">{bookingSuccess.pnr_code}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">Route</p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{origin.split(" ")[0]} → {destination.split(" ")[0]}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">Seat</p>
              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">{selectedSeat?.seat_number}</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-100/50 dark:bg-zinc-900/50 text-center flex justify-between px-6 text-xs text-zinc-500">
            <span>Price Paid: ₹{Number(bookingSuccess.total_price).toLocaleString("en-IN")}</span>
            <span className="font-medium text-green-600 dark:text-green-400">Paid - Confirmed</span>
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <Link href="/bookings">
            <Button
              size="lg"
              className="font-semibold shadow cursor-pointer"
              onClick={() => {
                resetBookingFlow()
                onClose()
              }}
            >
              Go to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              resetBookingFlow()
              onClose()
            }}
            className="font-semibold cursor-pointer"
          >
            Close Map
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh] overflow-hidden">
      
      {/* 1. SEAT GRID DISPLAY (LEFT 7 COLS) */}
      <div className="lg:col-span-7 flex flex-col h-full border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        {/* Fuselage Header (Cockpit / Nose) */}
        <div className="bg-zinc-200 dark:bg-zinc-800 py-3 text-center border-b border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center relative">
          <div className="absolute -top-3 w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-t-full" />
          <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
            <RiPlaneLine className="h-4 w-4" />
            Flight {flightNo} Cabin Layout
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2.5 px-4 bg-white dark:bg-zinc-950 border-b border-zinc-200/50 dark:border-zinc-800/50 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500" />
            <span className="text-zinc-500 font-medium">First</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-purple-500/20 border border-purple-500" />
            <span className="text-zinc-500 font-medium">Business</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500" />
            <span className="text-zinc-500 font-medium">Economy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-zinc-800 border border-zinc-900 dark:border-zinc-700 flex items-center justify-center text-[8px] text-zinc-400">
              ✖
            </span>
            <span className="text-zinc-500 font-medium">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-primary text-white flex items-center justify-center text-[8px]" />
            <span className="text-zinc-700 dark:text-zinc-300 font-bold">Selected</span>
          </div>
        </div>

        {/* Fuselage Body (Scrollable seat map layout) */}
        <div className="flex-grow overflow-y-auto px-6 py-8 flex flex-col items-center select-none bg-zinc-100/50 dark:bg-zinc-950/20 relative">
          
          {/* Wings Background Outline */}
          <div className="absolute top-[40%] -left-6 w-8 h-28 bg-zinc-300/40 dark:bg-zinc-800/40 rounded-r-3xl pointer-events-none" />
          <div className="absolute top-[40%] -right-6 w-8 h-28 bg-zinc-300/40 dark:bg-zinc-800/40 rounded-l-3xl pointer-events-none" />

          {isLoading ? (
            <div className="h-full flex items-center justify-center flex-col gap-2">
              <RiLoader4Line className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-zinc-400 font-medium">Fetching dynamic seat state...</p>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-3">
              {Object.keys(groupedRows).map((rowStr) => {
                const rowNum = parseInt(rowStr)
                const rowSeats = groupedRows[rowNum]
                const isFirstClass = rowNum <= 2
                
                return (
                  <div key={rowNum} className="flex items-center justify-between gap-4">
                    {/* Row Indicator Left */}
                    <span className="text-[10px] font-bold text-zinc-400 w-4 text-center">{rowNum}</span>
                    
                    {/* Row Seats Display */}
                    <div className="flex-grow flex justify-center gap-2">
                      {isFirstClass ? (
                        // FIRST CLASS LAYOUT: 2-Aisle-2
                        <>
                          {/* Left Seats (A, B) */}
                          <div className="flex gap-2">
                            {rowSeats.slice(0, 2).map((seat) => {
                              const isSelected = selectedSeat?.id === seat.id
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSelectSeat(seat)}
                                  disabled={!seat.is_available}
                                  className={cn(
                                    "h-9 w-9 rounded-md font-bold text-[10px] transition-all flex flex-col items-center justify-center border relative",
                                    !seat.is_available
                                      ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                      : isSelected
                                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                      : "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 text-amber-600 hover:scale-105 cursor-pointer"
                                  )}
                                  title={`${seat.seat_number} - First Class (₹${getSeatCost(seat)})`}
                                >
                                  {seat.seat_number.replace(/[0-9]/g, '')}
                                  {!seat.is_available && <RiLockLine className="h-2 w-2 text-zinc-400 mt-0.5" />}
                                </button>
                              )
                            })}
                          </div>
                          
                          {/* Aisle Space */}
                          <div className="w-12 h-9 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-zinc-300 tracking-wider">AISLE</span>
                          </div>

                          {/* Right Seats (E, F) */}
                          <div className="flex gap-2">
                            {rowSeats.slice(2, 4).map((seat) => {
                              const isSelected = selectedSeat?.id === seat.id
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSelectSeat(seat)}
                                  disabled={!seat.is_available}
                                  className={cn(
                                    "h-9 w-9 rounded-md font-bold text-[10px] transition-all flex flex-col items-center justify-center border relative",
                                    !seat.is_available
                                      ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                      : isSelected
                                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                      : "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 text-amber-600 hover:scale-105 cursor-pointer"
                                  )}
                                  title={`${seat.seat_number} - First Class (₹${getSeatCost(seat)})`}
                                >
                                  {seat.seat_number.replace(/[0-9]/g, '')}
                                  {!seat.is_available && <RiLockLine className="h-2 w-2 text-zinc-400 mt-0.5" />}
                                </button>
                              )
                            })}
                          </div>
                        </>
                      ) : (
                        // BUSINESS / ECONOMY LAYOUT: 3-Aisle-3
                        <>
                          {/* Left Seats (A, B, C) */}
                          <div className="flex gap-1.5">
                            {rowSeats.slice(0, 3).map((seat) => {
                              const isSelected = selectedSeat?.id === seat.id
                              const isBusiness = seat.class === "business"
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSelectSeat(seat)}
                                  disabled={!seat.is_available}
                                  className={cn(
                                    "h-8 w-8 rounded-md font-bold text-[9px] transition-all flex flex-col items-center justify-center border relative",
                                    !seat.is_available
                                      ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                      : isSelected
                                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                      : isBusiness
                                      ? "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:scale-105 cursor-pointer"
                                      : "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:scale-105 cursor-pointer"
                                  )}
                                  title={`${seat.seat_number} - ${seat.class} Class (₹${getSeatCost(seat)})`}
                                >
                                  {seat.seat_number.replace(/[0-9]/g, '')}
                                  {!seat.is_available && <RiLockLine className="h-2 w-2 text-zinc-400 mt-0.5" />}
                                </button>
                              )
                            })}
                          </div>
                          
                          {/* Aisle Space */}
                          <div className="w-8 h-8" />

                          {/* Right Seats (D, E, F) */}
                          <div className="flex gap-1.5">
                            {rowSeats.slice(3, 6).map((seat) => {
                              const isSelected = selectedSeat?.id === seat.id
                              const isBusiness = seat.class === "business"
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSelectSeat(seat)}
                                  disabled={!seat.is_available}
                                  className={cn(
                                    "h-8 w-8 rounded-md font-bold text-[9px] transition-all flex flex-col items-center justify-center border relative",
                                    !seat.is_available
                                      ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                      : isSelected
                                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                      : isBusiness
                                      ? "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:scale-105 cursor-pointer"
                                      : "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:scale-105 cursor-pointer"
                                  )}
                                  title={`${seat.seat_number} - ${seat.class} Class (₹${getSeatCost(seat)})`}
                                >
                                  {seat.seat_number.replace(/[0-9]/g, '')}
                                  {!seat.is_available && <RiLockLine className="h-2 w-2 text-zinc-400 mt-0.5" />}
                                </button>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Row Indicator Right */}
                    <span className="text-[10px] font-bold text-zinc-400 w-4 text-center">{rowNum}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. PASSENGER FORM & ACTIONS (RIGHT 5 COLS) */}
      <div className="lg:col-span-5 h-full overflow-y-auto flex flex-col justify-between p-6 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-white dark:bg-zinc-900 shadow-xl">
        <div className="space-y-6">
          <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="text-lg font-bold font-heading text-zinc-900 dark:text-zinc-50">Reservation Pipeline</h4>
            <p className="text-xs text-zinc-500">Provide details for visual passenger verification.</p>
          </div>

          {/* Seat Selected Summary */}
          {selectedSeat ? (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Seat: {selectedSeat.seat_number}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                  {selectedSeat.class}
                </span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 pt-1">
                <span>Visual Fee: ₹{Number(selectedSeat.extra_fee).toLocaleString("en-IN")}</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  Total: ₹{Number(getSeatCost(selectedSeat)).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-1.5 text-zinc-400">
              <RiPlaneLine className="h-6 w-6 mx-auto animate-pulse text-zinc-300" />
              <p className="text-xs font-medium">Select an open seat to begin booking.</p>
            </div>
          )}

          {/* Auth Gate and Form */}
          {!user ? (
            <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 space-y-4 text-center">
              <RiAlertFill className="h-6 w-6 text-destructive mx-auto animate-bounce" />
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-destructive">Authentication Required</h5>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You must be signed in to purchase tickets and register passenger PNR claims.
                </p>
              </div>
              <Link href={`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                <Button size="sm" className="w-full font-semibold mt-2 cursor-pointer">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          ) : (
            selectedSeat && (
              <form onSubmit={handleConfirmBooking} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {submitError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                    <RiAlertFill className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                    <RiUserLine className="h-3.5 w-3.5" /> Full Name
                  </label>
                  <Input
                    placeholder="Passenger full name (matches passport)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10"
                  />
                  {formErrors.fullName && <p className="text-xs text-destructive font-medium">{formErrors.fullName}</p>}
                </div>

                {/* Passport */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                    <RiPassportLine className="h-3.5 w-3.5" /> Passport Number
                  </label>
                  <Input
                    placeholder="Z1234567"
                    value={passportNo}
                    onChange={(e) => setPassportNo(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 text-xs font-mono uppercase"
                  />
                  {formErrors.passportNo && <p className="text-xs text-destructive font-medium">{formErrors.passportNo}</p>}
                </div>

                {/* Nationality */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                    <RiFlagLine className="h-3.5 w-3.5" /> Nationality
                  </label>
                  <Input
                    placeholder="Indian"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10"
                  />
                  {formErrors.nationality && <p className="text-xs text-destructive font-medium">{formErrors.nationality}</p>}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                    <RiCalendarLine className="h-3.5 w-3.5" /> Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={isSubmitting}
                    className="h-10 text-xs cursor-pointer"
                  />
                  {formErrors.dob && <p className="text-xs text-destructive font-medium">{formErrors.dob}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 mt-4 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <RiLoader4Line className="h-5 w-5 animate-spin" />
                      Locking Seat & Booking...
                    </span>
                  ) : (
                    `Purchase Ticket - ₹${Number(getSeatCost(selectedSeat)).toLocaleString("en-IN")}`
                  )}
                </Button>
              </form>
            )
          )}
        </div>

        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between gap-4 mt-6">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={() => {
              resetBookingFlow()
              onClose()
            }}
            disabled={isSubmitting}
          >
            Cancel Selection
          </Button>
        </div>
      </div>

    </div>
  )
}
