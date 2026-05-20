"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { RiPlaneLine, RiTicketLine, RiUserLine, RiCalendarLine, RiTimerLine, RiLoader4Line, RiAlertFill, RiCheckDoubleLine } from "@remixicon/react"
import { useUserStore } from "@/store/useUserStore"
import { useFlightStore } from "@/store/useFlightStore"
import { useStoreHydration } from "@/store/useStoreHydration"
import { cancelBooking } from "@/app/actions/cancel-booking"

export default function BookingsPage() {
  const isHydrated = useStoreHydration(useUserStore, (state) => true) ?? false
  const cachedBookings = useUserStore((state) => state.cachedBookings)
  const setCachedBookings = useUserStore((state) => state.setCachedBookings)
  const updateCachedBookingStatus = useUserStore((state) => state.updateCachedBookingStatus)
  const resetBookingFlow = useFlightStore((s) => s.resetBookingFlow)

  const [bookings, setBookings] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  
  // Cancellation Dialog states
  const [cancellingBooking, setCancellingBooking] = React.useState<any | null>(null)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [cancelError, setCancelError] = React.useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = React.useState(false)

  // Fetch traveler bookings from Supabase
  const fetchBookings = React.useCallback(async () => {
    // Only show page loading spinner if we don't have any cached bookings to show first
    if (cachedBookings.length === 0 && bookings.length === 0) {
      setIsLoading(true)
    }
    setErrorMsg(null)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          booked_at,
          total_price,
          pnr_code,
          seat_id,
          seats (
            seat_number,
            class
          ),
          flights (
            flight_no,
            airline,
            origin,
            destination,
            departs_at,
            arrives_at,
            aircraft_type
          ),
          passengers (
            full_name,
            passport_no,
            nationality
          )
        `)
        .order("booked_at", { ascending: false })

      if (error) {
        setErrorMsg(error.message)
      } else {
        const bookingsList = data || []
        setBookings(bookingsList)
        setCachedBookings(bookingsList)
      }
    } catch (err: any) {
      setErrorMsg("Failed to load booking itineraries. Please refresh.")
    } finally {
      setIsLoading(false)
    }
  }, [cachedBookings.length, bookings.length, setCachedBookings])

  // Hydrate local bookings from Zustand cache immediately on mount
  React.useEffect(() => {
    if (isHydrated && cachedBookings.length > 0 && bookings.length === 0) {
      setBookings(cachedBookings)
      setIsLoading(false)
    }
  }, [isHydrated, cachedBookings, bookings.length])

  // Revalidate from server
  React.useEffect(() => {
    if (isHydrated) {
      fetchBookings()
    }
  }, [isHydrated, fetchBookings])

  // Handle Cancellation via server action (FIX 4B)
  const handleCancelConfirm = async () => {
    if (!cancellingBooking) return

    setIsCancelling(true)
    setCancelError(null)

    const result = await cancelBooking(cancellingBooking.id)

    if (result.error) {
      setCancelError(result.error)
      setIsCancelling(false)
    } else {
      setCancelSuccess(true)
      setIsCancelling(false)

      // FIX 5 (F11) — Reset Zustand store after successful cancel
      resetBookingFlow()

      // Instantly update local store cache and local UI state
      updateCachedBookingStatus(cancellingBooking.id, "cancelled")
      setBookings((prev) =>
        prev.map((b) => (b.id === cancellingBooking.id ? { ...b, status: "cancelled" } : b))
      )

      // Refresh local listings after slight delay
      setTimeout(() => {
        setCancellingBooking(null)
        setCancelSuccess(false)
        fetchBookings()
      }, 1500)
    }
  }

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 py-10 space-y-8 min-h-[75vh]">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-heading flex items-center gap-2">
            <RiTicketLine className="h-8 w-8 text-primary" />
            Traveler Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            View boarding registers, visual seat locks, and track international flight statuses.
          </p>
        </div>
        <Link href="/">
          <Button className="font-semibold shadow-md shadow-primary/10 cursor-pointer">
            <RiPlaneLine className="mr-2 h-4 w-4 transform rotate-45" />
            Book New Flight
          </Button>
        </Link>
      </div>

      {/* Main Listing Panel */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RiLoader4Line className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-zinc-400">Loading your flight records...</p>
        </div>
      ) : errorMsg ? (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive text-center">
          {errorMsg}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="border border-dashed border-zinc-200 dark:border-zinc-800 p-16 text-center shadow bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
          <CardContent className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/30 text-zinc-400 flex items-center justify-center mx-auto">
              <RiTicketLine className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-lg font-bold font-heading">No Travel Records</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                You currently do not have any visual seat bookings or flight itineraries confirmed under this account.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/">
                <Button size="sm" className="font-semibold cursor-pointer">Explore Flights</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => {
            const flight = booking.flights || booking.flight
            const seat = booking.seats || booking.seat
            const passenger = booking.passengers?.[0] || booking.passenger

            const departsAt = flight?.departs_at || new Date().toISOString()
            const arrivesAt = flight?.arrives_at || new Date(new Date(departsAt).getTime() + 2 * 60 * 60 * 1000).toISOString()

            const depDate = new Date(departsAt)
            const depTime = depDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            const depDateFormatted = depDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            
            const arrDate = new Date(arrivesAt)
            const arrTime = arrDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

            const durationMs = arrDate.getTime() - depDate.getTime()
            const hours = Math.floor(durationMs / (1000 * 60 * 60))
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

            const isCancelled = booking.status === "cancelled"
            const bookingDate = booking.booked_at || booking.created_at || new Date().toISOString()

            return (
              <Card
                key={booking.id}
                className={`overflow-hidden border shadow-md bg-white dark:bg-zinc-900 transition-all duration-300 ${
                  isCancelled 
                    ? "border-zinc-200/40 dark:border-zinc-800/40 opacity-75" 
                    : "border-zinc-200/80 dark:border-zinc-800/80 hover:shadow-lg"
                }`}
              >
                {/* Visual Ticket Header */}
                <div className={`px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                  isCancelled ? "bg-zinc-100 dark:bg-zinc-950" : "bg-gradient-to-r from-primary/5 to-purple-600/5 border-b border-zinc-100 dark:border-zinc-800"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">PNR CODE</span>
                    <span className="text-xl font-extrabold tracking-widest text-primary font-mono">{booking.pnr_code}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-400">
                      Booked: {new Date(bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      isCancelled 
                        ? "bg-destructive/10 border-destructive/20 text-destructive" 
                        : "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Main Content Body */}
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Flight Info (3 Cols) */}
                  <div className="md:col-span-3 space-y-1.5 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 pb-4 md:pb-0 md:pr-6">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                      {flight?.airline}
                    </span>
                    <h3 className="text-lg font-bold font-heading text-zinc-900 dark:text-zinc-50">{flight?.flight_no}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                      <RiPlaneLine className="h-3.5 w-3.5" />
                      {flight?.aircraft_type || "Boeing 737-800"}
                    </p>
                  </div>

                  {/* Route Timeline (5 Cols) */}
                  <div className="md:col-span-5 flex items-center justify-between gap-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 pb-4 md:pb-0 md:pr-6">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">DEPART</p>
                      <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">{depTime}</p>
                      <p className="text-xs text-zinc-500 font-medium">{flight?.origin?.split(" ")[0]}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 px-2 text-center">
                      <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1">
                        <RiTimerLine className="h-3 w-3" />
                        {hours}h {minutes}m
                      </span>
                      <div className="relative w-full border-t border-dashed border-zinc-300 dark:border-zinc-700 my-1.5">
                        <RiPlaneLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 transform rotate-90" />
                      </div>
                      <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">{depDateFormatted}</span>
                    </div>

                    <div className="space-y-0.5 text-right">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">ARRIVE</p>
                      <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">{arrTime}</p>
                      <p className="text-xs text-zinc-500 font-medium">{flight?.destination?.split(" ")[0]}</p>
                    </div>
                  </div>

                  {/* Passenger / Seat Details (2 Cols) */}
                  <div className="md:col-span-2 space-y-2">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Passenger</p>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{passenger?.full_name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono uppercase">{passenger?.passport_no || "••••••••••"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Seat Allocation</p>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {seat?.seat_number} ({seat?.class} Class)
                      </p>
                    </div>
                  </div>

                  {/* Pricing / Cancellation (2 Cols) */}
                  <div className="md:col-span-2 flex flex-col justify-center items-start md:items-end gap-2 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Fare Paid</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        ₹{Number(booking.total_price).toLocaleString("en-IN")}
                      </p>
                    </div>
                    
                    {!isCancelled && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCancellingBooking(booking)
                              setCancelError(null)
                              setCancelSuccess(false)
                            }}
                            className="w-full md:w-auto text-xs text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 cursor-pointer"
                          >
                            Cancel Booking
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Your seat will be released.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          {cancelError && (
                            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
                              <RiAlertFill className="h-4 w-4 shrink-0" />
                              <span>{cancelError}</span>
                            </div>
                          )}

                          {cancelSuccess && (
                            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-600 dark:text-green-400 border border-green-500/20 font-medium">
                              <RiCheckDoubleLine className="h-4 w-4 shrink-0" />
                              <span>Ticket cancelled. Seat released successfully!</span>
                            </div>
                          )}

                          <div className="py-2 text-xs text-zinc-500 dark:text-zinc-400 space-y-1 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
                            <p className="font-bold text-zinc-700 dark:text-zinc-300">Cancellation Rule Checklist:</p>
                            <p>• Bookings departing in less than 2 hours are locked and non-refundable.</p>
                            <p>• Once cancelled, the seat map will be updated instantly for other travelers.</p>
                          </div>

                          <AlertDialogFooter>
                            <AlertDialogCancel className="cursor-pointer">Keep Booking</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelConfirm}
                              disabled={isCancelling || cancelSuccess}
                              className="font-semibold cursor-pointer"
                            >
                              {isCancelling ? (
                                <span className="flex items-center gap-1.5">
                                  <RiLoader4Line className="h-4 w-4 animate-spin" />
                                  Cancelling...
                                </span>
                              ) : (
                                "Confirm Cancel"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

    </div>
  )
}
