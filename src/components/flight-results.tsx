"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SeatMap } from "@/components/seat-map"
import { SearchPanel } from "@/components/search-panel"
import {
  RiPlaneLine,
  RiSearchEyeLine,
  RiArrowLeftLine,
  RiCalendarLine,
  RiTimerLine,
  RiArrowRightLine,
  RiGroupLine,
} from "@remixicon/react"

import { useFlightStore } from "@/store/useFlightStore"
import { useStoreHydration } from "@/store/useStoreHydration"
import type { Flight } from "@/store/useFlightStore"

interface FlightResultsProps {
  flights: Flight[]
  passengerCount: number
  searchParams: {
    origin: string
    destination: string
    date: string
    selectedClass: string
  }
}

export function FlightResults({
  flights,
  passengerCount,
  searchParams: { origin, destination, date: dateStr, selectedClass },
}: FlightResultsProps) {
  // Zustand state for selected flight (seat map modal trigger)
  const storeSelectedFlight = useStoreHydration(useFlightStore, (state) => state.selectedFlight)
  const activeFlight = storeSelectedFlight !== undefined ? storeSelectedFlight : null

  const setSelectedFlight = useFlightStore((state) => state.setSelectedFlight)
  const setBookingStep    = useFlightStore((state) => state.setBookingStep)
  const setSearchState    = useFlightStore((state) => state.setSearchState)

  // Sync URL params back into the store so the rest of the booking flow has them
  React.useEffect(() => {
    if (origin || destination || dateStr || selectedClass || passengerCount) {
      setSearchState({
        origin,
        destination,
        date: dateStr,
        class: selectedClass,
        passengerCount,
      })
    }
  }, [origin, destination, dateStr, selectedClass, passengerCount, setSearchState])

  return (
    <div className="flex-grow container mx-auto px-4 md:px-6 py-10 space-y-8 min-h-[75vh]">

      {/* Header Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer">
            <RiArrowLeftLine className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <RiSearchEyeLine className="h-4 w-4 text-primary" />
          Flight Queries
        </span>
      </div>

      {/* Query Search Panel Summary */}
      {origin && destination && (
        <div className="p-6 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-heading flex items-center gap-3">
              <span>{origin.split(" ")[0]}</span>
              <RiArrowRightLine className="h-5 w-5 text-primary" />
              <span>{destination.split(" ")[0]}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-medium">
              <span className="flex items-center gap-1">
                <RiPlaneLine className="h-3.5 w-3.5 transform rotate-45" />
                {origin.substring(origin.indexOf("("))}
              </span>
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-1">
                <RiPlaneLine className="h-3.5 w-3.5 transform rotate-90" />
                {destination.substring(destination.indexOf("("))}
              </span>
              {dateStr && (
                <>
                  <span className="text-zinc-300">|</span>
                  <span className="flex items-center gap-1">
                    <RiCalendarLine className="h-3.5 w-3.5" />
                    {new Date(dateStr).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-1">
                <RiGroupLine className="h-3.5 w-3.5" />
                {passengerCount} {passengerCount === 1 ? "Passenger" : "Passengers"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-wider text-primary">
              {selectedClass} Class
            </span>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 gap-6">

        {!origin || !destination ? (
          // Empty state: show search card directly
          <div className="space-y-12">
            <div className="max-w-md mx-auto text-center space-y-2 py-8">
              <RiPlaneLine className="h-10 w-10 text-primary mx-auto animate-bounce" />
              <h2 className="text-xl font-bold font-heading">Find a Flight</h2>
              <p className="text-xs text-zinc-500">Configure origin and destination below to view seating.</p>
            </div>
            <div className="max-w-4xl mx-auto pt-16">
              <SearchPanel />
            </div>
          </div>
        ) : flights.length === 0 ? (
          // No flights found state
          <Card className="border border-zinc-200 dark:border-zinc-800 p-12 text-center shadow-lg bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                <RiPlaneLine className="h-6 w-6 transform rotate-90" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-lg font-bold font-heading">No Flights Scheduled</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  We currently do not have matching departures scheduled for the date selected. Please adjust your parameters or check other dates.
                </p>
              </div>
              <div className="pt-6">
                <Link href="/">
                  <Button size="sm" className="font-semibold cursor-pointer">Modify Search</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Flight Results Board
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Available Departures ({flights.length})
            </h2>

            <div className="space-y-4">
              {flights.map((flight) => {
                const depDate = new Date(flight.departs_at)
                const depTime = depDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

                const arrDate = new Date(flight.arrives_at)
                const arrTime = arrDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

                // Duration Calculation
                const durationMs = arrDate.getTime() - depDate.getTime()
                const hours = Math.floor(durationMs / (1000 * 60 * 60))
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

                return (
                  <Card
                    key={flight.id}
                    className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 shadow-md bg-white dark:bg-zinc-900 hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-12 items-center gap-6">

                      {/* 1. Airline / Flight Number (3 Cols) */}
                      <div className="md:col-span-3 space-y-1">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {flight.airline}
                        </span>
                        <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">{flight.flight_no}</h4>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                          <RiPlaneLine className="h-3.5 w-3.5" />
                          {flight.aircraft_type}
                        </p>
                      </div>

                      {/* 2. Departure / Arrival (5 Cols) */}
                      <div className="md:col-span-5 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold">DEPART</p>
                          <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{depTime}</p>
                          <p className="text-xs text-zinc-500 font-medium">{origin.split(" ")[0]}</p>
                        </div>

                        <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                            <RiTimerLine className="h-3 w-3" />
                            {hours}h {minutes}m
                          </span>
                          <div className="relative w-full border-t border-dashed border-zinc-300 dark:border-zinc-700 my-1.5">
                            <RiPlaneLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 transform rotate-90" />
                          </div>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-green-500">Non-Stop</span>
                        </div>

                        <div className="space-y-0.5 text-right">
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold">ARRIVE</p>
                          <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{arrTime}</p>
                          <p className="text-xs text-zinc-500 font-medium">{destination.split(" ")[0]}</p>
                        </div>
                      </div>

                      {/* 3. Pricing (2 Cols) */}
                      <div className="md:col-span-2 text-left md:text-right">
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Base Ticket Price</p>
                        <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                          ₹{Number(flight.base_price).toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-medium">Class seats vary</p>
                      </div>

                      {/* 4. Action (2 Cols) */}
                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          onClick={() => {
                            setSelectedFlight(flight)
                            setBookingStep("seating")
                          }}
                          className="w-full md:w-auto font-bold px-6 shadow-md shadow-primary/10 cursor-pointer"
                        >
                          Select Cabin
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* Visual Seat Selection Overlay Modal */}
      {activeFlight && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold font-heading text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  Visual Seating Map &amp; Traveler Locks
                </h3>
                <p className="text-xs text-zinc-500">
                  {activeFlight.airline} {activeFlight.flight_no} • {activeFlight.origin.split(" ")[0]} to {activeFlight.destination.split(" ")[0]}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFlight(null)
                  setBookingStep("search")
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                Close Selection ✖
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow">
              <SeatMap
                flightId={activeFlight.id}
                flightNo={activeFlight.flight_no}
                airline={activeFlight.airline}
                basePrice={Number(activeFlight.base_price)}
                origin={activeFlight.origin}
                destination={activeFlight.destination}
                onClose={() => {
                  setSelectedFlight(null)
                  setBookingStep("search")
                }}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
