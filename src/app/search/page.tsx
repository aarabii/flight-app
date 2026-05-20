// Pure async Server Component — NO 'use client', NO hooks, NO browser client.
// searchParams is a Promise in Next.js 16+ and must be awaited.

import { createClient as createServerClient } from "@/utils/supabase/server"
import { FlightResults } from "@/components/flight-results"
import type { Flight } from "@/store/useFlightStore"

interface SearchPageProps {
  searchParams: Promise<{
    origin?: string
    destination?: string
    date?: string
    class?: string
    passengers?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Await the searchParams Promise (required in Next.js 16)
  const resolvedParams = await searchParams

  const origin        = resolvedParams.origin        ?? ""
  const destination   = resolvedParams.destination   ?? ""
  const date          = resolvedParams.date          ?? ""
  const selectedClass = resolvedParams.class         ?? "economy"
  const passengerCount = parseInt(resolvedParams.passengers ?? "1", 10)

  let flights: Flight[] = []

  if (origin && destination && date) {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .eq("origin", origin)
      .eq("destination", destination)
      .gte("departs_at", `${date}T00:00:00.000Z`)
      .lte("departs_at", `${date}T23:59:59.999Z`)
      .eq("status", "scheduled")
      .order("departs_at", { ascending: true })

    if (!error && data) {
      flights = data as Flight[]
    }
  }

  return (
    <FlightResults
      flights={flights}
      passengerCount={passengerCount}
      searchParams={{ origin, destination, date, selectedClass }}
    />
  )
}
