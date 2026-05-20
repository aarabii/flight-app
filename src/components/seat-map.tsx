"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RiPlaneLine,
  RiUserLine,
  RiPassportLine,
  RiFlagLine,
  RiCalendarLine,
  RiLockLine,
  RiCheckDoubleLine,
  RiAlertFill,
  RiLoader4Line,
} from "@remixicon/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFlightStore } from "@/store/useFlightStore";
import { useUserStore } from "@/store/useUserStore";
import { useStoreHydration } from "@/store/useStoreHydration";
import { bookSeat, bookSeats } from "@/app/actions/book-seat";

interface Seat {
  id: string;
  flight_id: string;
  seat_number: string;
  class: "economy" | "business" | "first";
  is_available: boolean;
  extra_fee: number;
}

interface PassengerForm {
  fullName: string;
  passportNo: string;
  nationality: string;
  dob: string;
}

interface BookingResult {
  booking_id: string;
  pnr_code: string;
  total_price: number;
  departs_at?: string;
}

interface SeatMapProps {
  flightId: string;
  flightNo: string;
  basePrice: number;
  origin: string;
  destination: string;
  onClose: () => void;
}

export function SeatMap({
  flightId,
  flightNo,
  basePrice,
  origin,
  destination,
  onClose,
}: SeatMapProps) {
  const [seats, setSeats] = React.useState<Seat[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Zustand store variables with Next.js SSR hydration safety
  const storeSelectedSeat = useStoreHydration(
    useFlightStore,
    (state) => state.selectedSeat,
  );
  const selectedSeat =
    storeSelectedSeat !== undefined ? storeSelectedSeat : null;
  const setSelectedSeat = useFlightStore((state) => state.setSelectedSeat);

  const storeSelectedSeats = useStoreHydration(
    useFlightStore,
    (state) => state.selectedSeats,
  );
  const selectedSeats =
    storeSelectedSeats !== undefined ? storeSelectedSeats : [];
  const setSelectedSeats = useFlightStore((state) => state.setSelectedSeats);

  const storePassengerForms = useStoreHydration(
    useFlightStore,
    (state) => state.passengerForms,
  );
  const setPassengerForms = useFlightStore((state) => state.setPassengerForms);

  const storePassengerCount = useStoreHydration(
    useFlightStore,
    (state) => state.searchState.passengerCount,
  );
  const passengerCount =
    (storePassengerCount !== undefined ? storePassengerCount : 1) || 1;

  const storeUser = useStoreHydration(useUserStore, (state) => state.user);
  const user = storeUser !== undefined ? storeUser : null;

  const addCachedBooking = useUserStore((state) => state.addCachedBooking);
  const setBookingStep = useFlightStore((state) => state.setBookingStep);
  const resetBookingFlow = useFlightStore((state) => state.resetBookingFlow);

  const parseSeatParts = React.useCallback((seatNumber: string) => {
    const match = seatNumber.match(/^(\d+)([A-Za-z]+)$/);
    return {
      row: match ? Number(match[1]) : Number.parseInt(seatNumber, 10),
      letter: match
        ? match[2].toUpperCase()
        : seatNumber.replace(/\d/g, "").toUpperCase(),
    };
  }, []);

  const refreshSeats = React.useCallback(
    async (showLoading = false) => {
      const supabase = createClient();

      if (showLoading) {
        setIsLoading(true);
      }

      setFetchError(null);
      const { data, error } = await supabase
        .from("seats")
        .select("id, flight_id, seat_number, class, is_available, extra_fee")
        .eq("flight_id", flightId)
        .order("seat_number", { ascending: true });

      if (error) {
        setSeats([]);
        setFetchError(error.message);
      } else {
        const sorted = ([...(data || [])] as Seat[]).sort((a, b) => {
          const seatA = parseSeatParts(a.seat_number);
          const seatB = parseSeatParts(b.seat_number);
          if (seatA.row !== seatB.row) return seatA.row - seatB.row;
          return seatA.letter.localeCompare(seatB.letter);
        });
        setSeats(sorted);
      }

      if (showLoading) {
        setIsLoading(false);
      }
    },
    [flightId, parseSeatParts],
  );

  const getSeatButtonClasses = (
    seat: Seat,
    isSelected: boolean,
    sizeClass: string,
  ) =>
    cn(
      sizeClass,
      "rounded-md font-bold transition-all flex flex-col items-center justify-center border relative",
      !seat.is_available
        ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
        : isSelected
          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
          : seat.class === "first"
            ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 text-amber-600 hover:scale-105 cursor-pointer"
            : seat.class === "business"
              ? "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:scale-105 cursor-pointer"
              : "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:scale-105 cursor-pointer",
    );

  React.useEffect(() => {
    setSelectedSeats([]);
    setBookingStep("seating");
  }, [flightId, setBookingStep, setSelectedSeats]);

  // Local array state — one entry per passenger
  const [passengers, setPassengers] = React.useState<PassengerForm[]>(() =>
    Array.from({ length: passengerCount }, () => ({
      fullName: "",
      passportNo: "",
      nationality: "",
      dob: "",
    })),
  );

  // Resize the passengers array whenever passengerCount changes
  React.useEffect(() => {
    setPassengers((prev) =>
      Array.from(
        { length: passengerCount },
        (_, i) =>
          prev[i] ?? { fullName: "", passportNo: "", nationality: "", dob: "" },
      ),
    );
  }, [passengerCount]);

  // Pre-fill passenger 0 fullName from user profile if still empty
  React.useEffect(() => {
    if (user && !passengers[0]?.fullName) {
      setPassengers((prev) => {
        const updated = [...prev];
        if (updated[0])
          updated[0] = { ...updated[0], fullName: user.full_name || "" };
        return updated;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Seed local state from persisted store once hydrated
  React.useEffect(() => {
    if (storePassengerForms && storePassengerForms.length > 0) {
      setPassengers((prev) =>
        Array.from({ length: passengerCount }, (_, i) => ({
          fullName: storePassengerForms[i]?.fullName || prev[i]?.fullName || "",
          passportNo: prev[i]?.passportNo || "", // passportNo is never persisted
          nationality:
            storePassengerForms[i]?.nationality || prev[i]?.nationality || "",
          dob: storePassengerForms[i]?.dob || prev[i]?.dob || "",
        })),
      );
    }
    // Only run once on hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storePassengerForms]);

  // Helper: update a single field for passenger at index
  const updatePassenger = (
    index: number,
    field: "fullName" | "passportNo" | "nationality" | "dob",
    value: string,
  ) => {
    const updated = [...passengers];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setPassengers(updated);
      // Sync to store (strips passportNo via partialize)
      setPassengerForms(updated);
    }
  };

  // Fetch seat map on flightId changes
  React.useEffect(() => {
    void refreshSeats(true);
  }, [refreshSeats]);

  // Supabase Realtime subscription — keep seat map live (FIX 3)
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`seats-realtime-${flightId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "seats",
          filter: `flight_id=eq.${flightId}`,
        },
        () => {
          void refreshSeats();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flightId, refreshSeats]);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshSeats();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshSeats]);

  // Group seats by row number
  const groupedRows: Record<number, Seat[]> = {};
  seats.forEach((seat) => {
    const rowNum = parseSeatParts(seat.seat_number).row;
    if (!groupedRows[rowNum]) {
      groupedRows[rowNum] = [];
    }
    groupedRows[rowNum].push(seat);
  });
  Object.values(groupedRows).forEach((rowSeats) => {
    rowSeats.sort((a, b) =>
      parseSeatParts(a.seat_number).letter.localeCompare(
        parseSeatParts(b.seat_number).letter,
      ),
    );
  });

  // Get pricing by seat class
  const getSeatCost = (seat: Seat) => {
    return basePrice + Number(seat.extra_fee);
  };

  // Handle seat click
  const handleSelectSeat = (seat: Seat) => {
    if (!seat.is_available) return;
    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);
    let nextSeats = [...selectedSeats];
    if (isAlreadySelected) {
      nextSeats = nextSeats.filter((s) => s.id !== seat.id);
    } else {
      if (nextSeats.length >= passengerCount) {
        nextSeats.shift(); // Shift oldest selected seat to make room
      }
      nextSeats.push(seat);
    }
    setSelectedSeats(nextSeats);
    setSubmitError(null);
    if (nextSeats.length === passengerCount) {
      setBookingStep("passenger");
    } else {
      setBookingStep("seating");
    }
  };

  // Submission & screen states
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState<
    BookingResult[] | null
  >(null);
  const [activeTicketIndex, setActiveTicketIndex] = React.useState(0);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [formErrors, setFormErrors] = React.useState<{ [key: string]: string }>(
    {},
  );

  // Validate all passenger forms
  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    passengers.forEach((p, i) => {
      const prefix = passengerCount > 1 ? `p${i + 1}_` : "";
      if (!p.fullName.trim())
        errs[`${prefix}fullName`] = `Passenger ${i + 1}: name is required.`;
      if (!p.passportNo.trim())
        errs[`${prefix}passportNo`] =
          `Passenger ${i + 1}: passport number is required.`;
      if (!p.nationality.trim())
        errs[`${prefix}nationality`] =
          `Passenger ${i + 1}: nationality is required.`;
      if (!p.dob)
        errs[`${prefix}dob`] = `Passenger ${i + 1}: date of birth is required.`;
    });
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Perform RPC seat booking via server action (FIX 1)
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedSeats.length !== passengerCount) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const bookings = passengers.map((p, i) => ({
        seatId: selectedSeats[i].id,
        fullName: p.fullName,
        passportNo: p.passportNo,
        nationality: p.nationality,
        dob: p.dob,
      }));

      const result = await bookSeats({
        flightId,
        bookings,
      });

      if (result.error) {
        // FIX 2 — Optimistic rollback on booking failure
        setSelectedSeats([]);
        setBookingStep("seating");
        setSubmitError(result.error);
        setIsSubmitting(false);
      } else {
        const dataList = result.data as BookingResult[];

        await refreshSeats();

        // Cache the successful booking details instantly!
        dataList.forEach((data, index) => {
          const seat = selectedSeats[index];
          const passenger = passengers[index];
          const newBooking = {
            id: data.booking_id,
            pnr_code: data.pnr_code,
            total_price: data.total_price,
            status: "confirmed" as const,
            created_at: new Date().toISOString(),
            flight: {
              id: flightId,
              flight_no: flightNo,
              origin: origin,
              destination: destination,
              departs_at: data.departs_at || new Date().toISOString(),
            },
            passenger: {
              full_name: passenger.fullName,
              nationality: passenger.nationality,
              dob: passenger.dob,
            },
            seat: {
              seat_number: seat.seat_number,
              class: seat.class,
            },
          };
          addCachedBooking(newBooking);
        });

        setBookingSuccess(dataList);
        setBookingStep("confirmation");
        setActiveTicketIndex(0);
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during visual ticketing.";
      // FIX 2 — Optimistic rollback on unexpected error
      setSelectedSeats([]);
      setBookingStep("seating");
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  // SUCCESS STATE VIEW
  if (bookingSuccess) {
    const totalPaid = bookingSuccess.reduce(
      (sum, b) => sum + Number(b.total_price),
      0,
    );
    const activeTicket = bookingSuccess[activeTicketIndex];
    const activeSeat = selectedSeats[activeTicketIndex];
    const activePassenger = passengers[activeTicketIndex];

    return (
      <div className="text-center p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
          <RiCheckDoubleLine className="h-8 w-8 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold font-heading text-zinc-900 dark:text-zinc-50">
            Booking Confirmed!
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            All {passengerCount} seat locks and passenger boarding records have
            settled atomically.
          </p>
        </div>

        {/* Passenger Pill Selector */}
        {bookingSuccess.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
            {bookingSuccess.map((ticket, index) => (
              <button
                key={index}
                onClick={() => setActiveTicketIndex(index)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                  activeTicketIndex === index
                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
                )}
              >
                {passengers[index]?.fullName.split(" ")[0] ||
                  `Passenger ${index + 1}`}{" "}
                ({selectedSeats[index]?.seat_number})
              </button>
            ))}
          </div>
        )}

        {/* Ticket Board */}
        <div className="max-w-md mx-auto border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-lg bg-zinc-50 dark:bg-zinc-900 font-sans relative transition-all duration-300">
          <div className="bg-primary px-6 py-3 text-white text-left flex justify-between items-center">
            <span className="font-bold text-sm tracking-widest">
              {flightNo}
            </span>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
              {activeSeat?.class} Class
            </span>
          </div>
          <div className="p-6 text-left grid grid-cols-2 gap-4 border-b border-dashed border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">
                Passenger
              </p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                {activePassenger?.fullName}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">
                PNR Code
              </p>
              <p className="text-sm font-extrabold text-primary tracking-widest">
                {activeTicket?.pnr_code}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">
                Route
              </p>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {origin.split(" ")[0]} → {destination.split(" ")[0]}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">
                Seat
              </p>
              <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                {activeSeat?.seat_number}
              </p>
            </div>
          </div>
          <div className="p-4 bg-zinc-100/50 dark:bg-zinc-900/50 text-center flex justify-between px-6 text-xs text-zinc-500">
            <span>
              Ticket Price: ₹
              {Number(activeTicket?.total_price).toLocaleString("en-IN")}
            </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              Paid - Confirmed
            </span>
          </div>
        </div>

        {/* Total Pricing paid details */}
        <div className="max-w-md mx-auto p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-sm flex justify-between items-center">
          <span className="text-zinc-500 font-medium">
            Total Paid ({passengerCount} Passengers):
          </span>
          <span className="font-extrabold text-zinc-800 dark:text-zinc-100 text-lg">
            ₹{totalPaid.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <Link href="/bookings">
            <Button
              size="lg"
              className="font-semibold shadow cursor-pointer"
              onClick={() => {
                resetBookingFlow();
                onClose();
              }}
            >
              Go to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              resetBookingFlow();
              onClose();
            }}
            className="font-semibold cursor-pointer"
          >
            Close Map
          </Button>
        </div>
      </div>
    );
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
            <span className="text-zinc-700 dark:text-zinc-300 font-bold">
              Selected
            </span>
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
              <p className="text-xs text-zinc-400 font-medium">
                Fetching dynamic seat state...
              </p>
            </div>
          ) : fetchError ? (
            <div className="h-full flex items-center justify-center flex-col gap-2 text-center px-6">
              <RiAlertFill className="h-8 w-8 text-destructive" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                Unable to load seat map
              </p>
              <p className="text-xs text-zinc-400 font-medium">{fetchError}</p>
            </div>
          ) : seats.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col gap-2 text-center px-6">
              <RiPlaneLine className="h-8 w-8 text-zinc-300" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                No seats found for this flight
              </p>
              <p className="text-xs text-zinc-400 font-medium">
                Seat inventory has not been generated yet.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-3">
              {/* Column Headers */}
              <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="w-4" />
                <div className="flex-grow flex justify-center gap-2">
                  <div className="flex gap-2">
                    {["A", "B"].map((l) => (
                      <span
                        key={l}
                        className="h-5 w-9 sm:w-10 flex items-center justify-center text-[10px] font-bold text-zinc-400"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="w-12 h-5" />
                  <div className="flex gap-2">
                    {["E", "F"].map((l) => (
                      <span
                        key={l}
                        className="h-5 w-9 sm:w-10 flex items-center justify-center text-[10px] font-bold text-zinc-400"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="w-4" />
              </div>
              {Object.keys(groupedRows).map((rowStr) => {
                const rowNum = parseInt(rowStr);
                const rowSeats = groupedRows[rowNum];
                const isPremiumClass = rowNum <= 6;

                return (
                  <div
                    key={rowNum}
                    className="flex items-center justify-between gap-4"
                  >
                    {/* Row Indicator Left */}
                    <span className="text-[10px] font-bold text-zinc-400 w-4 text-center">
                      {rowNum}
                    </span>

                    {/* Row Seats Display */}
                    <div className="flex-grow flex justify-center gap-2">
                      {isPremiumClass ? (
                        // FIRST / BUSINESS LAYOUT: A B - aisle - E F
                        <>
                          {/* Left Seats (A, B) */}
                          <div className="flex gap-2">
                            {rowSeats.slice(0, 2).map((seat) => {
                              const isSelected = selectedSeats.some(
                                (s) => s.id === seat.id,
                              );
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSelectSeat(seat)}
                                  disabled={!seat.is_available}
                                  className={getSeatButtonClasses(
                                    seat,
                                    isSelected,
                                    "h-9 w-9 sm:h-10 sm:w-10 text-[10px]",
                                  )}
                                  title={`${seat.seat_number} - ${seat.class} Class (₹${getSeatCost(seat)})`}
                                  aria-label={`Seat ${seat.seat_number}, ${seat.class} class, ${!seat.is_available ? "booked" : isSelected ? "selected" : "available"}, ₹${getSeatCost(seat)}`}
                                >
                                  {parseSeatParts(seat.seat_number).letter}
                                  {!seat.is_available && (
                                    <RiLockLine className="h-2 w-2 text-zinc-400 mt-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Aisle Space */}
                          <div className="w-12 h-9 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-zinc-300 tracking-wider">
                              AISLE
                            </span>
                          </div>

                          {/* Right Seats (E, F) */}
                          <div className="flex gap-2">
                            {rowSeats.slice(2, 4).map((seat) => {
                              const isSelected = selectedSeats.some(
                                (s) => s.id === seat.id,
                              );
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSelectSeat(seat)}
                                  disabled={!seat.is_available}
                                  className={getSeatButtonClasses(
                                    seat,
                                    isSelected,
                                    "h-9 w-9 sm:h-10 sm:w-10 text-[10px]",
                                  )}
                                  title={`${seat.seat_number} - ${seat.class} Class (₹${getSeatCost(seat)})`}
                                  aria-label={`Seat ${seat.seat_number}, ${seat.class} class, ${!seat.is_available ? "booked" : isSelected ? "selected" : "available"}, ₹${getSeatCost(seat)}`}
                                >
                                  {parseSeatParts(seat.seat_number).letter}
                                  {!seat.is_available && (
                                    <RiLockLine className="h-2 w-2 text-zinc-400 mt-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        // BUSINESS / ECONOMY LAYOUT: 3-Aisle-3
                        <>
                          {/* Left Seats (A, B, C) */}
                          <div className="flex gap-1.5">
                            {rowSeats.slice(0, 3).map((seat) => {
                              const isSelected = selectedSeats.some(
                                (s) => s.id === seat.id,
                              );
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSelectSeat(seat)}
                                  disabled={!seat.is_available}
                                  className={getSeatButtonClasses(
                                    seat,
                                    isSelected,
                                    "h-9 w-9 sm:h-10 sm:w-10 text-[9px] sm:text-[10px]",
                                  )}
                                  title={`${seat.seat_number} - ${seat.class} Class (₹${getSeatCost(seat)})`}
                                  aria-label={`Seat ${seat.seat_number}, ${seat.class} class, ${!seat.is_available ? "booked" : isSelected ? "selected" : "available"}, ₹${getSeatCost(seat)}`}
                                >
                                  {parseSeatParts(seat.seat_number).letter}
                                  {!seat.is_available && (
                                    <RiLockLine className="h-2 w-2 text-zinc-400 mt-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Aisle Space */}
                          <div className="w-8 h-8" />

                          {/* Right Seats (D, E, F) */}
                          <div className="flex gap-1.5">
                            {rowSeats.slice(3, 6).map((seat) => {
                              const isSelected = selectedSeats.some(
                                (s) => s.id === seat.id,
                              );
                              return (
                                <button
                                  key={seat.id}
                                  onClick={() => handleSelectSeat(seat)}
                                  disabled={!seat.is_available}
                                  className={getSeatButtonClasses(
                                    seat,
                                    isSelected,
                                    "h-9 w-9 sm:h-10 sm:w-10 text-[9px] sm:text-[10px]",
                                  )}
                                  title={`${seat.seat_number} - ${seat.class} Class (₹${getSeatCost(seat)})`}
                                  aria-label={`Seat ${seat.seat_number}, ${seat.class} class, ${!seat.is_available ? "booked" : isSelected ? "selected" : "available"}, ₹${getSeatCost(seat)}`}
                                >
                                  {parseSeatParts(seat.seat_number).letter}
                                  {!seat.is_available && (
                                    <RiLockLine className="h-2 w-2 text-zinc-400 mt-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Row Indicator Right */}
                    <span className="text-[10px] font-bold text-zinc-400 w-4 text-center">
                      {rowNum}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. PASSENGER FORM & ACTIONS (RIGHT 5 COLS) */}
      <div className="lg:col-span-5 h-full overflow-y-auto flex flex-col justify-between p-6 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-white dark:bg-zinc-900 shadow-xl">
        <div className="space-y-6">
          <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="text-lg font-bold font-heading text-zinc-900 dark:text-zinc-50">
              Reservation Pipeline
            </h4>
            <p className="text-xs text-zinc-500">
              Provide details for visual passenger verification.
            </p>
          </div>

          {/* Seat Selected Summary */}
          {selectedSeats.length > 0 ? (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Selected {selectedSeats.length} of {passengerCount} Seat(s)
                </span>
                {selectedSeats.length < passengerCount && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 animate-pulse">
                    Select {passengerCount - selectedSeats.length} more
                  </span>
                )}
              </div>
              <div className="max-h-28 overflow-y-auto space-y-2 pr-1">
                {selectedSeats.map((seat, idx) => (
                  <div
                    key={seat.id}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Passenger {idx + 1}: Seat {seat.seat_number} ({seat.class}
                      )
                    </span>
                    <span className="text-zinc-500">
                      ₹
                      {(basePrice + Number(seat.extra_fee)).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 pt-2 border-t border-dashed border-primary/20">
                <span>Total Visual Fee:</span>
                <span>
                  ₹
                  {selectedSeats
                    .reduce((sum, s) => sum + Number(s.extra_fee), 0)
                    .toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                <span>Total Cumulative Price:</span>
                <span>
                  ₹
                  {(
                    basePrice * passengerCount +
                    selectedSeats.reduce(
                      (sum, s) => sum + Number(s.extra_fee),
                      0,
                    )
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center space-y-1.5 text-zinc-400">
              <RiPlaneLine className="h-6 w-6 mx-auto animate-pulse text-zinc-300" />
              <p className="text-xs font-medium">
                Select {passengerCount} open seat(s) to begin booking.
              </p>
            </div>
          )}

          {/* Auth Gate and Form */}
          {selectedSeats.length === passengerCount &&
            (!user ? (
              <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 space-y-4 text-center">
                <RiAlertFill className="h-6 w-6 text-destructive mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-destructive">
                    Authentication Required
                  </h5>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    You must be signed in to purchase tickets and register
                    passenger PNR claims.
                  </p>
                </div>
                <Link
                  href={`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                >
                  <Button
                    size="sm"
                    className="w-full font-semibold mt-2 cursor-pointer"
                  >
                    Sign In to Continue
                  </Button>
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleConfirmBooking}
                className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {submitError && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                    <RiAlertFill className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* One form section per passenger */}
                {passengers.map((passenger, index) => (
                  <div key={index} className="space-y-4">
                    {passengerCount > 1 && (
                      <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                        <RiUserLine className="h-4 w-4 text-primary" />
                        <h5 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                          Passenger {index + 1}
                          {index === 0 ? " (Primary)" : ""}
                        </h5>
                      </div>
                    )}

                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                        <RiUserLine className="h-3.5 w-3.5" /> Full Name
                      </label>
                      <Input
                        placeholder="Passenger full name (matches passport)"
                        value={passenger.fullName}
                        onChange={(e) =>
                          updatePassenger(index, "fullName", e.target.value)
                        }
                        disabled={isSubmitting}
                        className="h-10"
                      />
                      {formErrors[
                        `${passengerCount > 1 ? `p${index + 1}_` : ""}fullName`
                      ] && (
                        <p className="text-xs text-destructive font-medium">
                          {
                            formErrors[
                              `${passengerCount > 1 ? `p${index + 1}_` : ""}fullName`
                            ]
                          }
                        </p>
                      )}
                    </div>

                    {/* Passport */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                        <RiPassportLine className="h-3.5 w-3.5" /> Passport
                        Number
                      </label>
                      <Input
                        placeholder="Z1234567"
                        value={passenger.passportNo}
                        onChange={(e) =>
                          updatePassenger(index, "passportNo", e.target.value)
                        }
                        disabled={isSubmitting}
                        className="h-10 text-xs font-mono uppercase"
                      />
                      {formErrors[
                        `${passengerCount > 1 ? `p${index + 1}_` : ""}passportNo`
                      ] && (
                        <p className="text-xs text-destructive font-medium">
                          {
                            formErrors[
                              `${passengerCount > 1 ? `p${index + 1}_` : ""}passportNo`
                            ]
                          }
                        </p>
                      )}
                    </div>

                    {/* Nationality */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                        <RiFlagLine className="h-3.5 w-3.5" /> Nationality
                      </label>
                      <Input
                        placeholder="Indian"
                        value={passenger.nationality}
                        onChange={(e) =>
                          updatePassenger(index, "nationality", e.target.value)
                        }
                        disabled={isSubmitting}
                        className="h-10"
                      />
                      {formErrors[
                        `${passengerCount > 1 ? `p${index + 1}_` : ""}nationality`
                      ] && (
                        <p className="text-xs text-destructive font-medium">
                          {
                            formErrors[
                              `${passengerCount > 1 ? `p${index + 1}_` : ""}nationality`
                            ]
                          }
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                        <RiCalendarLine className="h-3.5 w-3.5" /> Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={passenger.dob}
                        onChange={(e) =>
                          updatePassenger(index, "dob", e.target.value)
                        }
                        disabled={isSubmitting}
                        className="h-10 text-xs cursor-pointer"
                      />
                      {formErrors[
                        `${passengerCount > 1 ? `p${index + 1}_` : ""}dob`
                      ] && (
                        <p className="text-xs text-destructive font-medium">
                          {
                            formErrors[
                              `${passengerCount > 1 ? `p${index + 1}_` : ""}dob`
                            ]
                          }
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 mt-4 cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <RiLoader4Line className="h-5 w-5 animate-spin" />
                      Locking Seats &amp; Booking...
                    </span>
                  ) : (
                    `Purchase Tickets - ₹${Number(basePrice * passengerCount + selectedSeats.reduce((sum, s) => sum + Number(s.extra_fee), 0)).toLocaleString("en-IN")}`
                  )}
                </Button>
              </form>
            ))}
        </div>

        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between gap-4 mt-6">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={() => {
              resetBookingFlow();
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
