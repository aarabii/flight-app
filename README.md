# AeroLux Airlines

Flight booking app for searching flights, selecting seats, booking trips, and managing bookings with Supabase.

## Tech Stack

- `next` 16.2.6
- `react` 19.2.4
- `react-dom` 19.2.4
- `@supabase/ssr` 0.10.3
- `@supabase/supabase-js` 2.106.0
- `zustand` 5.0.13
- `zod` 4.4.3
- `react-hook-form` 7.76.0
- `@hookform/resolvers` 5.2.2
- `date-fns` 4.2.1
- `@remixicon/react` 4.9.0
- `@radix-ui/react-slot` 1.2.4
- `radix-ui` 1.4.3
- `react-day-picker` 10.0.1
- `class-variance-authority` 0.7.1
- `clsx` 2.1.1
- `tailwind-merge` 3.6.0
- `tw-animate-css` 1.4.0
- `shadcn` 4.7.0
- `tailwindcss` 4
- `@tailwindcss/postcss` 4
- `eslint` 9
- `eslint-config-next` 16.2.6
- `typescript` 5

## Features

- Search flights from the home page.
- Load search results on the server in the App Router.
- Select seats with realtime updates on the seat map.
- Create bookings through a server action.
- Cancel bookings through a server action.
- Reschedule confirmed bookings to alternative flights.
- Sign up, sign in, and maintain Supabase auth sessions.
- Persist flight and user state in Zustand.
- Show bookings and booking history on the bookings page.

## Local Setup

1. Clone the repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the values.
4. Get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase Dashboard under Project Settings > API. The publishable key can also be used as the anon/public key.
5. Open the Supabase SQL Editor and run `supabase/migrations/001_initial.sql`.
6. In the same SQL Editor, run `supabase/seed.sql`.
7. Run `npm run dev`.

## Supabase Project Configuration

- Enable Realtime for the `seats` table in the Supabase Dashboard under Database > Replication. Add `public.seats` to the `supabase_realtime` publication if it is not already enabled.
- Create the test user in Authentication > Users. Add `test@aerolux.com` with password `Test@12345`.
- If you need the manual UUID for a seeded booking, copy it from the user row after creation.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL used by browser and server clients.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Primary public Supabase key used by the app.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Legacy fallback public key name supported by the Supabase client wrappers.

## Zustand Store Structure

### `useFlightStore`

- `searchState`: current search form values. It stores origin, destination, date, class, and passenger count.
- `selectedFlight`: flight selected during booking.
- `selectedSeat`: seat selected during booking.
- `bookingStep`: current booking step. Valid values are `search`, `seating`, `passenger`, and `confirmation`.
- `passengerForm`: legacy single-passenger form state.
- `passengerForms`: array of passenger forms for multi-passenger booking.
- `setSearchState`: merges partial search updates into the existing search state.
- `setSelectedFlight`: stores the active flight.
- `setSelectedSeat`: stores the active seat.
- `setBookingStep`: moves the booking flow between steps.
- `updatePassengerForm`: updates the legacy single-passenger form.
- `setPassengerForms`: replaces the passenger array.
- `resetBookingFlow`: clears the selected seat and passenger form state and resets `bookingStep` to `seating`. It is called after a successful cancel to clear stale seat selection state.

`passengerForms` excludes `passportNo` from localStorage because passport numbers are sensitive personal data and should not be persisted in browser storage.

### `useUserStore`

- `user`: minimal signed-in user data. It stores email and full name.
- `cachedBookings`: client-side booking cache used to render the bookings page immediately after hydration.
- `setUser`: stores or clears the current user.
- `setCachedBookings`: replaces the booking cache.
- `addCachedBooking`: prepends a new booking to the cache.
- `updateCachedBookingStatus`: updates the status of one cached booking.
- `clearSession`: clears the current user and cached bookings.

## Database Schema

- `flights`: scheduled flight records with route, times, aircraft type, base price, and status.
- `seats`: seat inventory for each flight with seat number, class, availability, and extra fee.
- `bookings`: booking records that link a user, flight, seat, status, total price, and PNR code.
- `passengers`: passenger details attached to bookings.
- `reschedules`: audit trail for booking reschedules with the old flight, new flight, and fee charged.

## Known Gaps and Trade-offs

- Git commit history is not granular.
- The PWA task is not implemented.
- Multi-passenger atomic booking is not implemented. Only the first passenger books the seat.
- Rescheduling does not reassign a new seat on the replacement flight.
- The reschedule write path uses separate inserts and updates instead of a single database transaction.
- The client-side booking cache can briefly show stale data until the next refresh.

## Test Credentials

- Email: `test@aerolux.com`
- Password: `Test@12345`
