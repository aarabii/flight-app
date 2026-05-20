-- Supabase Seed Data Script
-- Populates flights and programmatically generates full seat maps (108 seats per flight, 3,024 seats total)

DO $$
DECLARE
    v_flight_id UUID;
    r RECORD;
    row_num INT;
    seat_let TEXT;
    seat_cls TEXT;
    seat_fee NUMERIC;
    v_is_intl BOOLEAN;
BEGIN
    -- Temporary table to hold our structured flights
    CREATE TEMP TABLE temp_flights (
        flight_no TEXT,
        origin VARCHAR(30),
        destination VARCHAR(30),
        departs_at TIMESTAMP WITH TIME ZONE,
        arrives_at TIMESTAMP WITH TIME ZONE,
        aircraft_type TEXT,
        base_price NUMERIC(10, 2),
        is_international BOOLEAN
    );

    -- 1. Populating 28 Flights (Domestic: 6 Routes / International: Dubai, UK, US, Japan, Russia)
    -- Domestic: DEL, BOM, BLR, CCU, MAA (Indian Terminals)
    -- International: DXB (Dubai), LHR (UK), JFK (US), NRT (Japan), SVO (Russia)
    
    INSERT INTO temp_flights VALUES
    -- ROUTE 1: DEL -> BOM (Domestic: Delhi to Mumbai)
    ('AI101', 'DEL (IGIA T3)', 'BOM (CSMIA T2)', NOW() + INTERVAL '1 day 8 hours', NOW() + INTERVAL '1 day 10 hours 15 minutes', 'Airbus A320neo', 4500.00, FALSE),
    ('AI102', 'DEL (IGIA T3)', 'BOM (CSMIA T2)', NOW() + INTERVAL '2 days 12 hours', NOW() + INTERVAL '2 days 14 hours 15 minutes', 'Airbus A320neo', 4800.00, FALSE),
    ('UK103', 'DEL (IGIA T3)', 'BOM (CSMIA T2)', NOW() + INTERVAL '3 days 9 hours', NOW() + INTERVAL '3 days 11 hours 15 minutes', 'Boeing 787-9', 6000.00, FALSE),

    -- ROUTE 2: BOM -> DEL (Domestic: Mumbai to Delhi)
    ('AI201', 'BOM (CSMIA T2)', 'DEL (IGIA T3)', NOW() + INTERVAL '1 day 14 hours', NOW() + INTERVAL '1 day 16 hours 15 minutes', 'Airbus A320neo', 4600.00, FALSE),
    ('AI202', 'BOM (CSMIA T2)', 'DEL (IGIA T3)', NOW() + INTERVAL '3 days 16 hours', NOW() + INTERVAL '3 days 18 hours 15 minutes', 'Airbus A320neo', 4900.00, FALSE),
    ('UK203', 'BOM (CSMIA T2)', 'DEL (IGIA T3)', NOW() + INTERVAL '4 days 11 hours', NOW() + INTERVAL '4 days 13 hours 15 minutes', 'Boeing 787-9', 6200.00, FALSE),

    -- ROUTE 3: DEL -> BLR (Domestic: Delhi to Bengaluru)
    ('QP301', 'DEL (IGIA T3)', 'BLR (KIA T2)', NOW() + INTERVAL '2 days 8 hours', NOW() + INTERVAL '2 days 10 hours 45 minutes', 'Boeing 737 MAX 8', 5200.00, FALSE),
    ('QP302', 'DEL (IGIA T3)', 'BLR (KIA T2)', NOW() + INTERVAL '4 days 14 hours', NOW() + INTERVAL '4 days 16 hours 45 minutes', 'Boeing 737 MAX 8', 5500.00, FALSE),
    ('UK303', 'DEL (IGIA T3)', 'BLR (KIA T2)', NOW() + INTERVAL '5 days 8 hours', NOW() + INTERVAL '5 days 10 hours 45 minutes', 'Boeing 787-9', 6500.00, FALSE),

    -- ROUTE 4: BLR -> DEL (Domestic: Bengaluru to Delhi)
    ('QP401', 'BLR (KIA T2)', 'DEL (IGIA T3)', NOW() + INTERVAL '2 days 15 hours', NOW() + INTERVAL '2 days 17 hours 45 minutes', 'Boeing 737 MAX 8', 5100.00, FALSE),
    ('QP402', 'BLR (KIA T2)', 'DEL (IGIA T3)', NOW() + INTERVAL '5 days 10 hours', NOW() + INTERVAL '5 days 12 hours 45 minutes', 'Boeing 737 MAX 8', 5400.00, FALSE),
    ('UK403', 'BLR (KIA T2)', 'DEL (IGIA T3)', NOW() + INTERVAL '6 days 14 hours', NOW() + INTERVAL '6 days 16 hours 45 minutes', 'Boeing 787-9', 6300.00, FALSE),

    -- ROUTE 5: CCU -> MAA (Domestic: Kolkata to Chennai)
    ('6E501', 'CCU (NSCBIA T2)', 'MAA (CIA Domestic)', NOW() + INTERVAL '1 day 9 hours', NOW() + INTERVAL '1 day 11 hours 20 minutes', 'Airbus A321neo', 3800.00, FALSE),
    ('6E502', 'CCU (NSCBIA T2)', 'MAA (CIA Domestic)', NOW() + INTERVAL '3 days 15 hours', NOW() + INTERVAL '3 days 17 hours 20 minutes', 'Airbus A321neo', 4200.00, FALSE),
    ('6E503', 'CCU (NSCBIA T2)', 'MAA (CIA Domestic)', NOW() + INTERVAL '5 days 10 hours', NOW() + INTERVAL '5 days 12 hours 20 minutes', 'Airbus A321neo', 4000.00, FALSE),

    -- ROUTE 6: MAA -> CCU (Domestic: Chennai to Kolkata)
    ('6E601', 'MAA (CIA Domestic)', 'CCU (NSCBIA T2)', NOW() + INTERVAL '2 days 11 hours', NOW() + INTERVAL '2 days 13 hours 20 minutes', 'Airbus A321neo', 3900.00, FALSE),
    ('6E602', 'MAA (CIA Domestic)', 'CCU (NSCBIA T2)', NOW() + INTERVAL '4 days 17 hours', NOW() + INTERVAL '4 days 19 hours 20 minutes', 'Airbus A321neo', 4100.00, FALSE),
    ('6E603', 'MAA (CIA Domestic)', 'CCU (NSCBIA T2)', NOW() + INTERVAL '6 days 13 hours', NOW() + INTERVAL '6 days 15 hours 20 minutes', 'Airbus A321neo', 4300.00, FALSE),

    -- ROUTE 7: DEL <-> DXB (International: India to Dubai)
    ('EK501', 'DEL (IGIA T3)', 'DXB (Dubai T3)', NOW() + INTERVAL '1 day 18 hours', NOW() + INTERVAL '1 day 21 hours 45 minutes', 'Boeing 777-300ER', 18000.00, TRUE),
    ('EK502', 'DXB (Dubai T3)', 'DEL (IGIA T3)', NOW() + INTERVAL '2 days 22 hours', NOW() + INTERVAL '3 days 2 hours 45 minutes', 'Boeing 777-300ER', 19500.00, TRUE),

    -- ROUTE 8: BOM <-> LHR (International: India to United Kingdom)
    ('AI131', 'BOM (CSMIA T2)', 'LHR (Heathrow T5)', NOW() + INTERVAL '2 days 6 hours', NOW() + INTERVAL '2 days 15 hours 30 minutes', 'Boeing 777-300ER', 45000.00, TRUE),
    ('AI130', 'LHR (Heathrow T5)', 'BOM (CSMIA T2)', NOW() + INTERVAL '3 days 10 hours', NOW() + INTERVAL '3 days 19 hours 30 minutes', 'Boeing 777-300ER', 48000.00, TRUE),

    -- ROUTE 9: DEL <-> JFK (International: India to United States)
    ('AI101I', 'DEL (IGIA T3)', 'JFK (Kennedy T8)', NOW() + INTERVAL '3 days 2 hours', NOW() + INTERVAL '3 days 18 hours 15 minutes', 'Boeing 777-300ER', 65000.00, TRUE),
    ('AI102I', 'JFK (Kennedy T8)', 'DEL (IGIA T3)', NOW() + INTERVAL '4 days 20 hours', NOW() + INTERVAL '5 days 12 hours 15 minutes', 'Boeing 777-300ER', 68000.00, TRUE),

    -- ROUTE 10 (A): BOM <-> NRT (International: India to Japan)
    ('JL708', 'BOM (CSMIA T2)', 'NRT (Narita T1)', NOW() + INTERVAL '4 days 23 hours', NOW() + INTERVAL '5 days 9 hours 15 minutes', 'Boeing 787-9', 52000.00, TRUE),
    ('JL707', 'NRT (Narita T1)', 'BOM (CSMIA T2)', NOW() + INTERVAL '6 days 11 hours', NOW() + INTERVAL '6 days 21 hours 15 minutes', 'Boeing 787-9', 54000.00, TRUE),

    -- ROUTE 10 (B): DEL <-> SVO (International: India to Russia)
    ('SU233', 'DEL (IGIA T3)', 'SVO (Sheremetyevo TC)', NOW() + INTERVAL '5 days 5 hours', NOW() + INTERVAL '5 days 11 hours 15 minutes', 'Airbus A350-900', 42000.00, TRUE),
    ('SU232', 'SVO (Sheremetyevo TC)', 'DEL (IGIA T3)', NOW() + INTERVAL '6 days 18 hours', NOW() + INTERVAL '7 days 0 hours 15 minutes', 'Airbus A350-900', 44000.00, TRUE);

    -- 2. Generating Flights and Full Seat Maps Loop
    FOR r IN SELECT * FROM temp_flights LOOP
        -- Insert flight and capture ID
        INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
        VALUES (r.flight_no, r.origin, r.destination, r.departs_at, r.arrives_at, r.aircraft_type, 'scheduled', r.base_price)
        RETURNING id INTO v_flight_id;

        v_is_intl := r.is_international;

        -- Generate seat map (108 seats per flight)
        
        -- A. First Class: Rows 1-2, Seats A, B, E, F (4 per row = 8 seats total)
        -- Extra fee: 1,500 INR for domestic, 10,000 INR for international
        IF v_is_intl THEN
            seat_fee := 10000.00;
        ELSE
            seat_fee := 1500.00;
        END IF;

        FOR row_num IN 1..2 LOOP
            FOREACH seat_let IN ARRAY ARRAY['A', 'B', 'E', 'F'] LOOP
                INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
                VALUES (v_flight_id, row_num::TEXT || seat_let, 'first', TRUE, seat_fee);
            END LOOP;
        END LOOP;

        -- B. Business Class: Rows 3-6, Seats A, B, E, F (4 per row = 16 seats total)
        -- Extra fee: 750 INR for domestic, 4,000 INR for international
        IF v_is_intl THEN
            seat_fee := 4000.00;
        ELSE
            seat_fee := 750.00;
        END IF;

        FOR row_num IN 3..6 LOOP
            FOREACH seat_let IN ARRAY ARRAY['A', 'B', 'E', 'F'] LOOP
                INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
                VALUES (v_flight_id, row_num::TEXT || seat_let, 'business', TRUE, seat_fee);
            END LOOP;
        END LOOP;

        -- C. Economy Class: Rows 7-20, Seats A, B, C, D, E, F (6 per row = 84 seats total)
        -- Extra fee: 0.00 INR
        FOR row_num IN 7..20 LOOP
            FOREACH seat_let IN ARRAY ARRAY['A', 'B', 'C', 'D', 'E', 'F'] LOOP
                INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
                VALUES (v_flight_id, row_num::TEXT || seat_let, 'economy', TRUE, 0.00);
            END LOOP;
        END LOOP;

    END LOOP;

    DROP TABLE temp_flights;
END $$;
