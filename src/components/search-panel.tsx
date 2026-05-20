"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RiPlaneLine, RiCalendarLine, RiUserAddLine, RiSearchLine } from "@remixicon/react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const TERMINALS = [
  { value: "DEL (IGIA T3)", label: "Delhi - Indira Gandhi Intl (DEL T3)", city: "Delhi", isIntl: false },
  { value: "BOM (CSMIA T2)", label: "Mumbai - Chhatrapati Shivaji Intl (BOM T2)", city: "Mumbai", isIntl: false },
  { value: "BLR (KIA T2)", label: "Bengaluru - Kempegowda Intl (BLR T2)", city: "Bengaluru", isIntl: false },
  { value: "CCU (NSCBIA T2)", label: "Kolkata - Netaji Subhash Chandra Intl (CCU T2)", city: "Kolkata", isIntl: false },
  { value: "MAA (CIA Domestic)", label: "Chennai - Chennai Intl Airport (MAA)", city: "Chennai", isIntl: false },
  { value: "DXB (Dubai T3)", label: "Dubai - Dubai Intl (DXB T3)", city: "Dubai", isIntl: true },
  { value: "LHR (Heathrow T5)", label: "London - Heathrow Airport (LHR T5)", city: "London", isIntl: true },
  { value: "JFK (Kennedy T8)", label: "New York - John F. Kennedy (JFK T8)", city: "New York", isIntl: true },
  { value: "NRT (Narita T1)", label: "Tokyo - Narita Airport (NRT T1)", city: "Tokyo", isIntl: true },
  { value: "SVO (Sheremetyevo TC)", label: "Moscow - Sheremetyevo (SVO TC)", city: "Moscow", isIntl: true },
]

const CLASSES = [
  { value: "economy", label: "Economy Class" },
  { value: "business", label: "Business Class" },
  { value: "first", label: "First Class" },
]

import { useFlightStore } from "@/store/useFlightStore"

export function SearchPanel() {
  const router = useRouter()
  const searchState = useFlightStore((state) => state.searchState)
  const setSearchState = useFlightStore((state) => state.setSearchState)

  const [origin, setOrigin] = React.useState("")
  const [destination, setDestination] = React.useState("")
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [travelerClass, setTravelerClass] = React.useState("economy")
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({})

  // Initialize local states from store once hydrated
  React.useEffect(() => {
    if (searchState.origin) setOrigin(searchState.origin)
    if (searchState.destination) setDestination(searchState.destination)
    if (searchState.date) {
      // Avoid time zone shifts by using date string parsing or constructor safely
      const parsedDate = new Date(searchState.date)
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate)
      }
    } else {
      setDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // Default tomorrow
    }
    if (searchState.class) setTravelerClass(searchState.class)
  }, [searchState])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}

    if (!origin) newErrors.origin = "Select an origin airport."
    if (!destination) newErrors.destination = "Select a destination airport."
    if (origin && destination && origin === destination) {
      newErrors.destination = "Origin and destination cannot be identical."
    }
    if (!date) newErrors.date = "Select a departure date."

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const formattedDate = date ? format(date, "yyyy-MM-dd") : ""

    // Save search state to store
    setSearchState({
      origin,
      destination,
      date: formattedDate,
      class: travelerClass,
    })

    setErrors({})
    
    // Redirect to search results page
    const queryParams = new URLSearchParams({
      origin,
      destination,
      date: formattedDate,
      class: travelerClass,
    })
    
    router.push(`/search?${queryParams.toString()}`)
  }

  return (
    <Card className="w-full shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl -mt-16 relative z-10 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-purple-500 to-indigo-600" />
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Origin Selection */}
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <RiPlaneLine className="h-3.5 w-3.5 text-primary transform rotate-45" />
                From
              </label>
              <div className="relative">
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full h-11 px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select origin...</option>
                  {TERMINALS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.city} ({t.value.split(" ")[0]})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                  ▼
                </div>
              </div>
              {errors.origin && <p className="text-xs text-destructive font-medium mt-1">{errors.origin}</p>}
            </div>

            {/* Destination Selection */}
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <RiPlaneLine className="h-3.5 w-3.5 text-primary transform rotate-90" />
                To
              </label>
              <div className="relative">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-11 px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select destination...</option>
                  {TERMINALS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.city} ({t.value.split(" ")[0]})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                  ▼
                </div>
              </div>
              {errors.destination && <p className="text-xs text-destructive font-medium mt-1">{errors.destination}</p>}
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <RiCalendarLine className="h-3.5 w-3.5 text-primary" />
                Departure Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <RiCalendarLine className="mr-2 h-4 w-4 text-zinc-400" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border border-zinc-200 dark:border-zinc-800" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && <p className="text-xs text-destructive font-medium mt-1">{errors.date}</p>}
            </div>

            {/* Travel Class Selection */}
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <RiUserAddLine className="h-3.5 w-3.5 text-primary" />
                Travel Class
              </label>
              <div className="relative">
                <select
                  value={travelerClass}
                  onChange={(e) => setTravelerClass(e.target.value)}
                  className="w-full h-11 px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  {CLASSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                  ▼
                </div>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              * Real-time seat layouts locks during passenger bookings.
            </span>
            <Button type="submit" size="lg" className="px-6 font-semibold shadow-lg shadow-primary/25 cursor-pointer">
              <RiSearchLine className="mr-2 h-4 w-4" />
              Search AeroLux Flights
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
