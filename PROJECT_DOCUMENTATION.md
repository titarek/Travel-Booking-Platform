# Travel. — Enterprise Online Travel Agency (OTA) & B2B Distribution Platform
## Comprehensive System Analysis, Design & Software Requirements Specification (SRS)

---

## 1. Project Title & Executive Summary

### 1.1 Project Title
**Travel.** — Next-Generation Enterprise Online Travel Agency (OTA), Live Telemetry Radar & B2B Wholesale Distribution Platform.

### 1.2 Summary
**Travel.** is an enterprise-grade software solution designed to streamline the discovery, real-time tracking, reservation, payment settlement, and administrative management of commercial aviation flights, luxury hotels, and curated tour packages. Developed as a full-stack, decoupled architecture, the platform features an interactive live GIS flight radar, dynamic location-based hotel discovery via the Geoapify Places engine, multi-currency localization, promotional campaign engines, a closed-loop customer stored-value digital wallet, wholesale B2B API reseller distribution, and official IATA-compliant electronic passenger ticket generation with barcode verification.

### 1.3 Background & Problem Statement
Modern travelers and commercial travel agencies face fragmented, manual, and unreliable workflows when planning and managing travel logistics:
* **Static, Opaque Flight Information**: Traditional booking portals display static departure and arrival times without real-time spatial context. Travelers cannot track the actual live geographical trajectory of their aircraft or verify cruising telemetry.
* **Irrelevant & Unvetted Hotel Results**: Standard location searches frequently return irrelevant facilities—such as non-commercial student hostels, residential halls, and unlicensed dormitories—that lack booking systems, resulting in customer frustration.
* **Delayed Refund Turnarounds**: Traditional online refund processing requires 5 to 10 business days through banking gateways, reducing user satisfaction and increasing support overhead.
* **High Barrier for B2B Partners**: Smaller travel agencies and corporate travel desks struggle to integrate directly with legacy Global Distribution Systems (GDS) due to costly infrastructure requirements.
* **Administrative Blind Spots**: Flight and booking updates often lack live real-time notification streams, forcing operations staff to manually refresh databases and risking missed orders.

### 1.4 Proposed Solution & Impact
**Travel.** resolves these challenges through a unified platform:
* **Interactive Live GIS Radar**: Renders interactive flight maps displaying origin, destination, geodesic curved trajectory corridors, and an active aircraft icon reflecting real-time transit progress with live GPS coordinates, altitude, and ground speed.
* **Intelligent Hospitality Radar**: Connects with Geoapify Places API to query accommodations dynamically by coordinates, applying strict regex-based hospitality keyword filtering to return only legitimate hotels, resorts, and motels.
* **Customer Stored-Value Digital Wallet**: Provides instant one-click booking deductions and automated real-time refund crediting on cancellations, eliminating banking turnaround delays.
* **Wholesale B2B API Distribution Engine**: Enables external agencies to integrate programmatically, access tiered wholesale net fares, and issue bookings through automated REST endpoints.
* **Enterprise Operations Console**: Equipped with Server-Sent Events (SSE) live order streams, audible notification chimes, staff-to-customer e-ticket parity, a Master PIN-protected API key vault, and an immutable regulatory audit trail.

---

## 2. Feasibility Study

### 2.1 Technical Feasibility
* **Core Technology Stack**:
  * **Frontend Client & Admin**: React with Vite, Tailwind CSS, Lucide Icons, and Leaflet GIS vector map rendering.
  * **Backend Core**: Node.js and Express RESTful API with Server-Sent Events (SSE) telemetry.
  * **Persistence**: Dual-layer architecture combining MongoDB Atlas cloud persistence with resilient in-memory caching to guarantee uninterrupted operation.
* **Third-Party API Integrations**:
  * Geoapify API (Places Discovery, Geocoding & Vector Map Tiles).
  * Aviationstack API (Live Aircraft Radar & Airport Logistics).
  * Amadeus API (Global Scheduled Flight Inventories).
  * ExchangeRate-API (Real-Time Currency Conversion).
  * Stripe API (Payment Processing & Wallet Deposits).
* **Technical Assessment**: The technologies are established, production-tested, and maintain sub-second response times across all modules.

### 2.2 Operational Feasibility
* **User Demographics**: Designed with a responsive interface accessible to retail travelers on mobile, tablet, and desktop devices.
* **Administrative Workflows**: Centralized tabbed dashboard provides dispatchers and platform managers with real-time audio alerts, one-click booking confirmations, and customer voucher inspections.
* **Operational Assessment**: Intuitive design ensures minimal onboarding time for both consumers and operations staff.

### 2.3 Economic Feasibility
* **Revenue Streams**:
  * **Retail Commissions**: Configurable SaaS platform fee (e.g., 5.0%) earned on every flight, hotel, and tour reservation.
  * **B2B Wholesale Margins**: Tiered wholesale markup and subscription fees for external travel agency API access.
  * **Promotional Placements**: Co-branded lifestyle bank card partnerships (EBL Visa, bKash, City Bank Amex).
* **Economic Assessment**: High return on investment (ROI) driven by dual B2C and B2B operational channels with automated low-overhead administration.

### 2.4 Legal & Regulatory Feasibility
* **Compliance Standards**: Adheres to international aviation document formats conforming to IATA passenger electronic ticket standards.
* **Data Protection & Privacy**: Stateless JWT token authentication, Bcrypt password hashing, and strict sanitization of all customer and payment data.
* **Audit Governance**: Immutable administrative logging recording every deletion, cancellation, and API key rotation with timestamps, admin emails, and originating IP addresses.

### 2.5 Schedule Feasibility
* **Deployment Status**: The complete platform—comprising customer web portal, enterprise admin console, digital wallet, and B2B API distribution—is fully engineered, tested with zero linter errors, and operational in production.

---

## 3. Overall System Description

### 3.1 Product Perspective
**Travel.** functions as a centralized, autonomous travel ecosystem that integrates retail consumer travel bookings with automated B2B wholesale distribution and administrative controls.

```
+-----------------------------------------------------------------------------------------+
|                                  TRAVEL. SYSTEM BOUNDARY                                |
|                                                                                         |
|   +--------------------------+  +--------------------------+  +---------------------+   |
|   | Consumer Web Portal      |  | Enterprise Admin Console |  | External B2B APIs   |   |
|   | (Travelers / Customers)  |  | (Operators & Managers)   |  | (Agencies & Desks)  |   |
|   +------------+-------------+  +------------+-------------+  +----------+----------+   |
|                |                             |                           |              |
|                +--------------------+        |        +------------------+              |
|                                     |        |        |                                 |
|                                     v        v        v                                 |
|   +---------------------------------------------------------------------------------+   |
|   |                   CORE APPLICATION & API GATEWAY ENGINE                         |   |
|   |                                                                                 |   |
|   |   * Flights & Live Telemetry Radar Engine                                       |   |
|   |   * Location-Based Hotels & Geoapify Places Radar                               |   |
|   |   * Tour Packages & Itinerary Showcase                                         |   |
|   |   * Customer Stored-Value Digital Wallet & Fast Refund Engine                   |   |
|   |   * B2B Wholesale Margin Matrix & Partner Key Provisioner                       |   |
|   |   * Multi-Currency Engine (USD, BDT, EUR, GBP, AED, SAR)                       |   |
|   |   * Official Passenger E-Ticket Voucher & Barcode Generator                     |   |
|   |   * Master PIN-Protected Key Vault & Immutable Audit Logging                    |   |
|   +-----------------------------------------+---------------------------------------+   |
+---------------------------------------------|-------------------------------------------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                            EXTERNAL GLOBAL SERVICE PROVIDERS                            |
|                                                                                         |
|      [Geoapify]     |     [Aviationstack]     |     [Amadeus]     |     [Stripe]        |
+-----------------------------------------------------------------------------------------+
```

### 3.2 Product Functions
* **Flight Engine & GIS Trajectory Radar**: Real-time flight search, airline filtering, interactive Leaflet flight map displaying curved geodesic flight corridors, animated aircraft position tracking, and telemetry HUD (GPS coordinates, altitude, ground speed, gate, carousel).
* **Hotel Engine & Geoapify Radar**: Global city search, "Nearby / Near Me" geolocation radar, Geoapify Places integration, strict commercial hospitality keyword filtering (hotels, resorts, motels only), and responsive card border protection.
* **Curated Tour Packages**: Showcase for multi-day itineraries (Maldives, Umrah, Cox's Bazar, Dubai) with duration, daily highlights, meal inclusions, and transfer arrangements.
* **Dynamic Promotional Campaigns**: Special offer discount cards and co-branded bank partner privileges (EBL Visa, bKash, City Bank Amex) with real-time active toggling.
* **Customer Digital Wallet**: Stored-value account balance, debit/credit top-ups, 1-click booking checkout in under one second, split-tender payments, and instant automated refunds on cancellations.
* **B2B Reseller & API Marketplace**: Partner API key provisioning (`pk_live_...`), rate-limit tiers, wholesale commission margins, and programmatic endpoints (`/api/v1/b2b/*`).
* **Official IATA E-Ticket Voucher**: Official agency letterhead, 6-character PNR, unique ticket number (`ETKT-784-XXXXXX-XX`), itinerary schedule, baggage rules, terminal boarding barcode, and print stylesheet isolation (`@media print`).
* **Enterprise Operations Center**: Real-time SSE live order stream with audible chime alerts, customer ticket parity for staff, inventory CRUD, Master PIN-protected API key vault (`1234`), SaaS commission controls, and immutable audit logs.

### 3.3 User Characteristics & Classes
* **Retail Customer / Traveler**: Searches flights, hotels, and packages; tracks flights on live maps; tops up digital wallet; pays in local currencies; downloads official vouchers; cancels bookings.
* **B2B Agency Partner**: Uses issued API keys to query wholesale inventories programmatically and book tickets under wholesale margins.
* **Operations Administrator**: Monitors incoming bookings in real time, confirms reservations, inspects customer e-ticket vouchers, and manages catalog inventories.
* **Super Administrator / Platform Owner**: Manages SaaS commission rates, maintenance modes, user role promotions, Master PIN-gated API key rotations, and regulatory audit records.

---

## 4. Comprehensive Functional Requirements (FRS)

### 4.1 Global Navigation, Localization & Multi-Currency Engine
* **FR-NAV-01 (Account Registration)**: System allows users to register an account by entering Full Name, Email, Phone Number, and Password with instant validation.
* **FR-NAV-02 (Secure User Login)**: Authenticates credentials, issues an encrypted JWT token, and restores active user state upon page reload via `/api/auth/me`.
* **FR-NAV-03 (Guest Checkout Flow)**: Unregistered visitors can explore inventories, select travel dates, and are prompted to log in or complete booking with auto-provisioned accounts at checkout.
* **FR-NAV-04 (Multi-Currency Selector)**: Global navigation dropdown allows users to switch between USD ($), BDT (৳), EUR (€), GBP (£), AED (د.إ), and SAR (﷼).
* **FR-NAV-05 (Instant Currency Recalculation)**: Switching currency instantly recalculates every price on the site (flights, hotels, packages, wallet balance, checkout totals) without reloading the page.
* **FR-NAV-06 (Global Service Navigation)**: Top-level navigation tabs switch between Flights, Hotels, Holidays, Umrah, Visa Guide, and Flight Status Live.
* **FR-NAV-07 (Administrative Shortcut)**: Authorized administrators logged into the consumer portal see an "Admin Console" quick-action link to transition directly to the operations dashboard.

---

### 4.2 Flight Engine, Live GIS Radar Map & Telemetry HUD
* **FR-FLT-01 (Route Query & Autocomplete)**: Users select Origin Airport/City and Destination Airport/City with autocomplete suggestions.
* **FR-FLT-02 (One-Click Route Swap)**: A dedicated two-way arrow button instantly swaps Origin and Destination selections.
* **FR-FLT-03 (Date & Cabin Configuration)**: Calendar date pickers for Departure and Return dates with day-of-week indicators, plus passenger count and cabin class selectors (Economy, Premium Economy, Business, First).
* **FR-FLT-04 (Quick Route Shortcuts)**: Pre-configured chips for high-demand routes: `DAC → DXB`, `DAC → CXB`, `DAC → ZYL`, and `DXB → DAC`.
* **FR-FLT-05 (Results Filtering)**: Filter sidebar supports radio buttons for transit stops (All, Non-stop Only, 1 Stop), maximum price budget slider, and airline checkboxes (Emirates, FlyDubai, Biman Bangladesh Airlines, US-Bangla, Singapore Airlines).
* **FR-FLT-06 (Flight Detail Trigger)**: Clicking "Details" or "Flight Selected" on any flight card opens the Flight Telemetry & GIS Radar modal.
* **FR-FLT-07 (Interactive Leaflet Vector Map)**: Renders a vector map using Geoapify cartography tiles, displaying departure airport marker, destination airport marker, and a geodesic curved flight corridor.
* **FR-FLT-08 (Real-Time Aircraft Tracking)**: Dynamically places an aircraft icon along the corridor based on calculated elapsed travel time and journey progress percentage (e.g., `71% Route Traversed`).
* **FR-FLT-09 (Non-Reverting Sticky Zoom)**: Zoom In (`+`) and Zoom Out (`-`) buttons allow users to explore waypoints and transit hubs without map auto-resetting.
* **FR-FLT-10 (Live Telemetry HUD Overlay)**: Displays live GPS coordinates (latitude/longitude), cruising altitude (e.g., 38,000 ft), ground speed (km/h & knots), magnetic heading track, operational status (`IN FLIGHT`, `SCHEDULED`, `LANDED`), departure gate, boarding terminal, arrival terminal, baggage carousel, aircraft model, and Mode-S ICAO24 transponder code.
* **FR-FLT-11 (Direct Booking Transition)**: An embedded "Proceed to Book This Flight" CTA within the telemetry modal transitions the traveler directly into the booking checkout.

---

### 4.3 Location-Based Hotel Discovery & Geoapify Radar Engine
* **FR-HTL-01 (Worldwide City Search)**: Autocomplete destination input accepts any worldwide city or resort area (e.g., Cox's Bazar, Dubai, Tokyo, Rome, Natore, Bali).
* **FR-HTL-02 ("Nearby / Near Me" Geolocation Radar)**: Clicking "Nearby / Near Me" retrieves device GPS coordinates and executes a dynamic radial search around the user's location.
* **FR-HTL-03 (Quick Destination Chips)**: Direct chips for popular tourist markets: Cox's Bazar, Dubai, Tokyo, Paris, Rome, Bali.
* **FR-HTL-04 (Geoapify Places API Integration)**: Resolves destination coordinates and queries the Geoapify Places API under category `accommodation.hotel`.
* **FR-HTL-05 (Strict Commercial Hospitality Filtering)**: Automatically evaluates property titles to ensure they contain approved terms: `Hotel`, `Resort`, `Motel`, `Inn`, `Suites`, `Palace`, or `Villa`. Automatically excludes student hostels, residential halls, and unlicensed dormitories.
* **FR-HTL-06 (Responsive Card Border Protection)**: Applies strict CSS overflow containment (`break-words`, `line-clamp-2`, `truncate`) ensuring long street addresses and localized foreign scripts never breach card boundaries.
* **FR-HTL-07 (Hotel Card Presentation)**: Displays high-res photography, star ratings, review scores (`Superb 4.8`, `Very Good 4.5`), property name, street address, distance from city center (e.g., `2.3 km from center`), nightly rates, and verified amenity chips.
* **FR-HTL-08 (Property Details Modal)**: Clicking "Details" displays photo galleries, full descriptions, check-in (14:00) and check-out (12:00) times, room tier options (Standard, Deluxe Ocean Suite, Executive Suite), and policies.
* **FR-HTL-09 (Room Reservation Checkout)**: "Book Room" button locks the selected room tier and opens the reservation checkout modal.

---

### 4.4 Holiday & Umrah Tour Packages Module
* **FR-PKG-01 (Curated Tour Portfolio)**: Displays packaged itineraries categorized under Beach Escapes, Island Holidays, Cultural Tours, and Umrah Pilgrimages.
* **FR-PKG-02 (Package Presentation)**: Displays destination imagery, title, duration badges (e.g., `5 Days / 4 Nights`), price per traveler, strikethrough original rates, and promotional tags.
* **FR-PKG-03 (Detailed Tour Itinerary Modal)**: Clicking any package card opens an extensive walkthrough detailing day-by-day schedules, hotel accommodations, speedboat/coach transfers, meal plans, and visa assistance.
* **FR-PKG-04 (Package Booking Trigger)**: "Book This Package" button transitions directly into the passenger configuration checkout.

---

### 4.5 Dynamic Promotional Offers & Bank Partner Privileges
* **FR-OFF-01 (Consumer Special Offers Grid)**: Homepage features a 3-column responsive grid displaying promotional cards with gradient themes, badge tags (e.g., `Promo: TRAVEL20`, `Beach Escape`), headlines, and descriptions.
* **FR-OFF-02 (Direct Campaign Routing)**: Action buttons ("Book Now", "View Resorts", "Explore Packages") apply relevant search parameters and redirect travelers to the corresponding catalog section.
* **FR-OFF-03 (Bank Partner Privileges)**: Showcases co-branded cards for partner institutions (EBL Visa Travel Lifestyle Card with 0% EMI and lounge access, bKash instant cash rebates, City Bank Amex 12% hotel discounts and lounge access).
* **FR-OFF-04 (Administrative Campaign Curation)**: Administrators can create, edit, change gradient themes, adjust promo codes, and modify discounts for any offer.
* **FR-OFF-05 (Live Status Toggle)**: Administrators can toggle offers between `Live on Site` and `Paused / Hidden` without deleting the record.
* **FR-OFF-06 (Mandatory Deletion Justification)**: Deleting any promotional campaign prompts for a mandatory reason and records an audit log.

---

### 4.6 Customer Digital Wallet & Stored-Value System
* **FR-WLT-01 (Integrated Wallet Balance)**: Displays the customer's real-time wallet balance in their active currency across the navigation header and dashboard.
* **FR-WLT-02 (Multi-Channel Wallet Top-Up)**: Customers can deposit funds into their wallet using credit/debit cards (via Stripe) or mobile banking, with immediate balance crediting.
* **FR-WLT-03 (One-Click Instant Checkout)**: Selecting "Pay with Travel Wallet" during checkout deducts the fare and confirms the booking in under one second without gateway redirects.
* **FR-WLT-04 (Split-Tender Payment)**: If the wallet balance is insufficient for the full fare, the customer can apply their full balance and settle the remaining amount via credit card.
* **FR-WLT-05 (Instant Automated Refund on Cancellation)**: When an eligible booking is cancelled, funds are credited back to the customer's wallet balance instantly, eliminating traditional 5–10 business day banking turnaround times.
* **FR-WLT-06 (Itemized Wallet Ledger)**: Customers can review a complete transaction ledger showing dates, transaction types (`TOPUP`, `DEBIT`, `REFUND`), amounts, and reference IDs.

---

### 4.7 B2B Reseller & Wholesale API Marketplace
* **FR-B2B-01 (Partner Registration & API Key Provisioning)**: Administrators can register external travel agencies and issue secure API keys (`pk_live_...`) with assigned rate-limiting tiers.
* **FR-B2B-02 (Wholesale Margin Engine)**: Administrators set wholesale commission margins (e.g., 7% net discount below published retail rates), automatically applied to authenticated partner requests.
* **FR-B2B-03 (Programmatic Flight API)**: Endpoint `GET /api/v1/b2b/flights/search` returns real-time flight route availability and wholesale net fares in JSON.
* **FR-B2B-04 (Programmatic Hotel API)**: Endpoint `GET /api/v1/b2b/hotels/search` returns hotel properties, room availability, and wholesale rates in JSON.
* **FR-B2B-05 (Programmatic Packages API)**: Endpoint `GET /api/v1/b2b/packages` returns tour package itineraries and departure allocations.
* **FR-B2B-06 (Headless Booking API)**: Endpoint `POST /api/v1/b2b/bookings/create` allows external platforms to submit traveler payloads and generate confirmed bookings with instant PNRs.
* **FR-B2B-07 (Programmatic E-Ticket API)**: Endpoint `GET /api/v1/b2b/bookings/:id/ticket` provides official passenger vouchers in structured JSON or printable PDF formats.
* **FR-B2B-08 (Partner Key Governance & Metering)**: Tracks consumption volumes per partner key; administrators can suspend, renew, or revoke keys on demand.

---

### 4.8 Checkout Engine, Traveler Metadata & Payment Settlement
* **FR-CHK-01 (Reservation Summary)**: Displays selected flight, hotel room, or package with dates, times, and occupancy counts.
* **FR-CHK-02 (Itemized Fare Ledger)**: Displays base fare, platform service fee, taxes, promotional discount deductions, and final payable total.
* **FR-CHK-03 (Traveler Information Capture)**: Validates title, given name, surname, date of birth, passport number, passport expiration date, and nationality.
* **FR-CHK-04 (Emergency Contact Details)**: Captures traveler email (for voucher dispatch) and international mobile phone number.
* **FR-CHK-05 (Payment Methods)**: Supports settlement via Travel Wallet, Credit/Debit Card (Stripe), and Bank Transfer verification.
* **FR-CHK-06 (Booking Confirmation & PNR)**: Generates a 6-character PNR (`bookingReference`), creates an electronic ticket number, dispatches an SSE event to the admin console, and opens the official E-Ticket Voucher modal immediately.

---

### 4.9 Official Passenger E-Ticket Voucher & Printing Engine
* **FR-TCK-01 (Official Letterhead & Accreditation)**: Formatted with the corporate "Travel." branding, passenger travel voucher accreditation notice, and 24/7 support line.
* **FR-TCK-02 (PNR & Status Display)**: Prominently displays the 6-character PNR (e.g., `78-529`), unique ticket number (`ETKT-784-XXXXXX-XX`), and official status badges (`CONFIRMED`, `PAID`).
* **FR-TCK-03 (Passenger Profile)**: Full traveler name, passenger type (Adult/Primary), passport number, nationality, email, and phone.
* **FR-TCK-04 (Service Itinerary Breakdown)**: Complete breakdown of flight route (departure/arrival airports, terminals, dates, times, durations, stops), hotel details (property, address, room tier, check-in/out), or package itinerary.
* **FR-TCK-05 (Baggage & Cabin Allowances)**: Cabin class, checked baggage allowance (e.g., `2 x 23 kg`), carry-on allowance (`7 kg`), and boarding seat status ("Assigned at Check-in").
* **FR-TCK-06 (Financial Summary)**: Payment method, transaction reference ID, verified authorized badge, and total fare paid in currency.
* **FR-TCK-07 (Airport Boarding Security Barcode)**: High-density machine-readable barcode graphic encoding passenger metadata for terminal scanning.
* **FR-TCK-08 (Aviation Regulatory Conditions)**: Standard terms regarding passport validity (minimum 6 months), check-in closure timelines, and carriage conditions.
* **FR-TCK-09 (Print Stylesheet Isolation)**: Clicking "Print Official E-Ticket" isolates the voucher document using `@media print`, suppressing website headers, sidebars, and buttons for a clean paper printout or PDF export.

---

### 4.10 Customer Booking Management ("My Bookings")
* **FR-MBK-01 (Filter Categorization)**: Displays customer reservations categorized under All Bookings, Flights, Hotels, and Tour Packages.
* **FR-MBK-02 (Reservation Cards)**: Displays booking reference, booking date, service vertical icon, trip summary, total fare paid, and status badge (`CONFIRMED`, `PENDING`, `CANCELLED`).
* **FR-MBK-03 (Voucher Re-Printing)**: Clicking "View E-Ticket" re-opens the official passenger voucher for viewing or re-printing.
* **FR-MBK-04 (Self-Service Cancellation)**: Customers can cancel eligible reservations, updating status to `CANCELLED` and crediting an automated refund back to their digital wallet.

---

### 4.11 Enterprise Administrative Command Center
* **FR-ADM-01 (Real-Time Live Order Stream)**: Persistent Server-Sent Events (SSE) connection (`/api/admin/realtime`) pushes incoming reservations to operations screens in real time.
* **FR-ADM-02 (Audible Order Alert Chime)**: Plays an audio chime alert whenever a new booking is completed worldwide, highlighting the new order row.
* **FR-ADM-03 (Operational Analytics)**: Displays real-time metrics tracking Total Platform Revenue, Total Bookings Count, Active Travelers, Net Commission Earnings, and conversion rates.
* **FR-ADM-04 (Booking Search & Status Filtering)**: Search reservations by customer name, email, or PNR; filter by status (Confirmed, Pending, Cancelled) and service vertical.
* **FR-ADM-05 (Financial Invoice Inspection)**: Clicking the "Eye" button opens an itemized financial invoice showing base service subtotal, platform commission fees, and tax distributions.
* **FR-ADM-06 (Staff-to-Customer E-Ticket Parity)**: A dedicated Ticket button beside each reservation allows administrators to view and print the exact customer voucher seen by the passenger.
* **FR-ADM-07 (Reservation Lifecycle Management)**: One-click confirmation for pending reservations; cancellation requires a mandatory documented reason before execution.
* **FR-ADM-08 (Hotel Catalog CRUD)**: Add new hotels with photos, star ratings, and room tiers; toggle "Featured" status; delete properties with mandatory logged justification.
* **FR-ADM-09 (Flight Catalog CRUD)**: Register new flight routes, configure airlines, origin/destination airports, scheduled timings, cabin classes, seat counts, operational status; delete routes with logged justification.
* **FR-ADM-10 (Tour Package CRUD)**: Curate travel packages, set day/night durations, list daily highlights, specify inclusions, toggle "Featured" status; delete with logged justification.
* **FR-ADM-11 (Offers & Campaigns Manager)**: Add, edit, select gradient themes, toggle active live status, and delete promotional campaigns with logged justification.
* **FR-ADM-12 (Master PIN-Protected API Key Vault)**: Access to external API keys requires secondary Master Security PIN verification (`1234`).
* **FR-ADM-13 (Runtime Hot-Reloading Key Rotation)**: Rotating keys for Geoapify, Aviationstack, Amadeus, Stripe, or ExchangeRate updates database settings and hot-reloads server memory without process restarts.
* **FR-ADM-14 (SaaS Platform Governance)**: Configure global SaaS commission percentage, toggle maintenance mode, publish broadcast announcement banners, and adjust exchange rates.
* **FR-ADM-15 (User Directory & Role Governance)**: Inspect all registered user accounts and promote/demote accounts between Customer and Administrator roles.
* **FR-ADM-16 (Immutable Audit Trail)**: Automatically logs every deletion, cancellation, API key rotation, commission change, and role modification with timestamps, admin emails, reasons, and IP addresses.

---

## 5. Non-Functional Requirements (NFR)

* **NFR-01 (Performance & Sub-Second Latency)**: Catalog queries and hotel radar searches resolve in under 400 milliseconds. Real-time SSE order notifications arrive at administrative terminals within 250 milliseconds of transaction authorization.
* **NFR-02 (Scalability & Concurrency)**: Stateless architecture handles high concurrent user traffic across retail booking and B2B API endpoints without performance degradation.
* **NFR-03 (Usability & Accessibility)**: Intuitive responsive interface complying with modern accessibility standards, with minimal learning curve for retail travelers and operations staff.
* **NFR-04 (Security & Data Protection)**: All sessions secured with HMAC-SHA256 signed JSON Web Tokens (JWT). Passwords hashed with salted Bcrypt. Master credentials protected by secondary Master Security PIN. Inputs sanitized to prevent XSS and injection vulnerabilities.
* **NFR-05 (Availability & 99.9% Uptime)**: Continuous service availability backed by dual-tier persistence and graceful in-memory fallbacks during external provider downtime.
* **NFR-06 (Maintainability & Clean Architecture)**: Modular codebase complying with Airbnb ESLint standards (0 errors, 0 warnings) for straightforward code maintenance.
* **NFR-07 (Data Integrity & Regulatory Compliance)**: Immutable audit logging preserves records of all administrative modifications, ensuring full regulatory traceability.
* **NFR-08 (Cross-Device & Browser Compatibility)**: Mobile-first responsive layout supporting modern browsers: Google Chrome, Apple Safari, Mozilla Firefox, and Microsoft Edge across mobile, tablet, and desktop displays.
* **NFR-09 (Localization & Internationalization)**: Real-time currency conversions supporting 6 major global currencies with accurate localized formatting.

---

## 6. User Profile & Account Governance

* **Profile Creation & Setup**: Users register via email and password, configuring profile name, contact phone, and travel preferences.
* **Role-Based Access Control**:
  * **Customer**: Self-service booking, wallet top-ups, e-ticket printing, and reservation cancellations.
  * **Administrator**: Catalog management, live order monitoring, customer ticket parity, and campaign curation.
  * **Super Administrator**: Access to the Master PIN-protected API key vault, SaaS commission rates, and audit logs.
* **Stored-Value Wallet Ledger**: Displays current available funds, top-up options, 1-click checkout settings, and full chronological transaction history.
* **Reservation Archive**: Centralized tracking for all past and upcoming flights, hotel stays, and tour packages.
* **Security & Session Governance**: Password updates, secure logout, and multi-device session management.

---

## 7. System Diagrams & Workflows

### 7.1 Use Case Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                      TRAVEL. PLATFORM USE CASES                                   |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|   [Retail Traveler]                                                                               |
|       |                                                                                           |
|       +---> (Search Flights by Origin, Destination & Date)                                        |
|       |         |                                                                                 |
|       |         +---> <<include>> (View Interactive Live GIS Radar Trajectory Map)                |
|       |                                                                                           |
|       +---> (Search Nearby Hotels via Geoapify Radar & View Legitimate Resorts)                   |
|       |                                                                                           |
|       +---> (Browse Curated Tour Packages & Itineraries)                                          |
|       |                                                                                           |
|       +---> (Browse Special Offers & Bank Lifestyle Privileges)                                   |
|       |                                                                                           |
|       +---> (Top-Up Stored-Value Digital Wallet Balance)                                           |
|       |                                                                                           |
|       +---> (Execute Booking Checkout)                                                            |
|       |         |                                                                                 |
|       |         +---> <<include>> (1-Click Instant Wallet Deduction OR Card Payment)              |
|       |         +---> <<include>> (Select Multi-Currency Rate)                                    |
|       |                                                                                           |
|       +---> (Generate & Print Official IATA Passenger E-Ticket Voucher with Barcode)              |
|       |                                                                                           |
|       +---> (View Booking History & Cancel with Instant Wallet Refund)                            |
|                                                                                                   |
|   [B2B Agency Partner]                                                                            |
|       |                                                                                           |
|       +---> (Query Wholesale Flights, Hotels & Packages via Programmatic API Keys)                 |
|       |                                                                                           |
|       +---> (Execute Headless Programmatic Bookings with Wholesale Net Rates)                     |
|                                                                                                   |
|   [Platform Operations Administrator]                                                             |
|       |                                                                                           |
|       +---> (Monitor Real-Time Orders via SSE with Audio Chime Alerts)                            |
|       |                                                                                           |
|       +---> (Manage Reservations: Confirm / Cancel with Mandatory Reason)                         |
|       |                                                                                           |
|       +---> (View Financial Invoices & View Identical Customer E-Ticket Vouchers)                 |
|       |                                                                                           |
|       +---> (Manage Catalog CRUD: Hotels, Flights, Packages, Offers)                              |
|       |                                                                                           |
|       +---> (Unlock Key Vault with Master PIN & Rotate Live API Keys at Runtime)                  |
|       |                                                                                           |
|       +---> (Configure SaaS Commission Rates & Review Immutable Audit Logs)                       |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

### 7.2 Detailed Use Case Specifications

#### Use Case 1: Flight Live GIS Radar & Trajectory Tracking
| Attribute | Specification |
| :--- | :--- |
| **Use Case Name** | Inspect Live GIS Flight Route Radar & Telemetry HUD |
| **Goal** | Allow traveler to view the exact geographical trajectory, progress percentage, and flight telemetry on a live vector map. |
| **Preconditions** | User is on the Flights or Flight Status page and searches for or selects an active flight route. |
| **Success Condition** | Map renders origin pin, destination pin, geodesic corridor, live aircraft icon, and HUD with verified GPS coordinates and altitude. |
| **Failed Condition** | External telemetry API is unreachable; system falls back to calculated geodesic path coordinates. |
| **Primary Actor** | Retail Traveler / Customer |
| **Secondary Actor** | Leaflet GIS Engine / Geoapify Vector Tile Server / Aviationstack API |
| **Trigger** | User clicks the "Details" or "Flight Selected" button on a flight card. |
| **Main Scenario** | 1. User navigates to Flights search and queries route (e.g., `DAC` to `DXB`).<br>2. System displays matching flight cards with schedules and fares.<br>3. User clicks "Details" on an active flight.<br>4. System initializes Leaflet map and fetches Geoapify vector tiles.<br>5. System plots origin airport pin (`DAC`), destination airport pin (`DXB`), and curved corridor.<br>6. System calculates journey percentage and places aircraft icon along the path.<br>7. System overlays live telemetry HUD showing GPS coordinates, altitude (38,000 ft), speed (860 km/h), gate, terminal, and baggage carousel.<br>8. User zooms in (`+`) or pans to inspect transit points; zoom level remains fixed without auto-reset.<br>9. User clicks "Proceed to Book This Flight" to transition into checkout. |
| **Alternative Flow** | **3a. Flight is Scheduled/Not Yet Departed:** System renders origin and destination with the aircraft icon positioned on the ground at the departure airport; HUD displays `Scheduled` status and departure gate. |

---

#### Use Case 2: Dynamic Nearby Hotel Search & Strict Hospitality Filtering
| Attribute | Specification |
| :--- | :--- |
| **Use Case Name** | Search Nearby Accommodations via Geoapify Radar |
| **Goal** | Allow traveler to locate verified hotels and luxury resorts near their current location or a target city, filtering out non-commercial boarding houses. |
| **Preconditions** | User is on the Hotels page. |
| **Success Condition** | System displays verified hotels and resorts with distance, pricing, star ratings, and amenities, properly contained within card borders. |
| **Failed Condition** | Location coordinates are invalid; system falls back to default verified platform properties. |
| **Primary Actor** | Retail Traveler / Customer |
| **Secondary Actor** | Geoapify Places API Engine |
| **Trigger** | User clicks "Nearby / Near Me" or enters a city name (e.g., *Natore* or *Cox's Bazar*) and clicks "Search Hotels". |
| **Main Scenario** | 1. User enters destination or clicks "Nearby / Near Me".<br>2. System obtains geographic coordinates for the target area.<br>3. Backend queries Geoapify Places API under category `accommodation.hotel`.<br>4. System passes results through the hospitality regex filter, verifying that titles contain approved terms (`Hotel`, `Resort`, `Motel`, `Inn`, `Suites`, `Palace`, `Villa`).<br>5. System excludes student hostels and unlicensed dormitories.<br>6. System applies text containment to prevent foreign scripts or long addresses from breaching card borders.<br>7. System calculates distance from center (in km) and renders property cards with star ratings, guest scores, and nightly rates.<br>8. User clicks "Details" to review rooms, amenities, and policies.<br>9. User clicks "Book Room" to proceed to checkout. |
| **Alternative Flow** | **4a. No Commercial Resorts in Strict Radius:** System expands the radius and presents verified regional luxury properties, informing the user of the closest available accommodations. |

---

#### Use Case 3: Customer Stored-Value Digital Wallet 1-Click Checkout & Instant Refund
| Attribute | Specification |
| :--- | :--- |
| **Use Case Name** | Execute 1-Click Wallet Checkout and Automated Instant Refund |
| **Goal** | Allow customer to pay for reservations using their stored-value wallet and receive instant refunds upon cancellation. |
| **Preconditions** | User is logged into an authenticated customer profile. |
| **Success Condition** | Booking fare is deducted from wallet balance in under one second; cancellations instantly credit funds back to the wallet balance. |
| **Failed Condition** | Insufficient wallet balance; system prompts user to top up or use split-tender credit card payment. |
| **Primary Actor** | Registered Customer |
| **Secondary Actor** | Wallet Ledger Engine / Stripe Gateway (for top-ups) |
| **Trigger** | User selects "Pay with Travel Wallet" during checkout OR clicks "Cancel Reservation" in My Bookings. |
| **Main Scenario** | 1. User configures a flight, hotel, or package reservation.<br>2. At checkout, user reviews fare summary and selects "Pay with Travel Wallet".<br>3. System verifies wallet balance is greater than or equal to total fare.<br>4. System deducts fare, updates user wallet ledger, and confirms booking in under one second.<br>5. System generates unique 6-character PNR and displays official E-Ticket Voucher modal.<br>6. Later, user navigates to "My Bookings" and clicks "Cancel Reservation" on an eligible booking.<br>7. System updates booking status to `CANCELLED` and credits the full refundable amount back to the digital wallet within one second.<br>8. User reviews itemized wallet ledger confirming the instant refund credit. |
| **Alternative Flow** | **3a. Partial Wallet Balance:** Wallet balance covers part of the fare; user applies full wallet balance and pays the remaining difference via credit card. |

---

#### Use Case 4: Master PIN-Protected Third-Party API Key Vault & Runtime Hot-Reload
| Attribute | Specification |
| :--- | :--- |
| **Use Case Name** | Unlock Key Vault & Rotate Third-Party API Credentials at Runtime |
| **Goal** | Allow Super Administrator to rotate external API credentials without server restarts or platform downtime. |
| **Preconditions** | User is logged in as an Administrator and holds the Master Security PIN (`1234`). |
| **Success Condition** | New API key is verified, saved to platform settings, hot-reloaded into server memory, and logged to the audit trail. |
| **Failed Condition** | Invalid Master PIN; system rejects key rotation and logs unauthorized attempt. |
| **Primary Actor** | Super Administrator / Platform Owner |
| **Secondary Actor** | Master Security Gateway / Backend Settings Engine |
| **Trigger** | Administrator clicks "Rotate Key" in the API Status & Keys tab. |
| **Main Scenario** | 1. Administrator navigates to the "API Status & Keys" tab in the Admin Console.<br>2. Console displays status of connected integrations (Geoapify, Aviationstack, Amadeus, Stripe, ExchangeRate).<br>3. Administrator clicks "Rotate Key" next to an integration (e.g., Geoapify).<br>4. System opens modal prompting for the New API Key and Master Security PIN.<br>5. Administrator enters new key and Master PIN (`1234`), then clicks "Verify PIN & Save Key".<br>6. System validates Master PIN against security configuration.<br>7. System saves updated key to database settings and hot-reloads credentials in backend memory without restarting node processes.<br>8. System writes an immutable record to the Audit Log: `ROTATE_API_KEY_GEOAPIFY`.<br>9. System displays toast notification confirming runtime activation. |
| **Alternative Flow** | **6a. Incorrect Master PIN Entered:** System displays error "Master Security PIN invalid", blocks update, and keeps existing credentials active. |

---

### 7.3 System Block Diagram

```
+-------------------------------------------------------------------------------------------------------+
|                                  TRAVEL. SYSTEM BLOCK DIAGRAM                                         |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|  [Traveler Devices]                     [B2B Partner Platforms]                  [Admin Workstations] |
|   (Mobile / Desktop)                       (External OTAs)                        (Operations Staff)  |
|          |                                        |                                        |          |
|          v                                        v                                        v          |
|  +-------------------------------------------------------------------------------------------------+  |
|  |                             API GATEWAY & TRAFFIC DISPATCHER                                    |  |
|  |     CORS Governance | JWT Token Authenticator | B2B API Token Validator | Rate Limiter          |  |
|  +------------------------------------------------+------------------------------------------------+  |
|                                                   |                                                   |
|                                                   v                                                   |
|  +-------------------------------------------------------------------------------------------------+  |
|  |                            CORE PLATFORM SERVICE CONTROLLERS                                    |  |
|  |                                                                                                 |  |
|  |  +-------------------------+  +--------------------------+  +--------------------------------+  |  |
|  |  | Flight & Telemetry Core |  | Hotel Places Radar Core  |  | Holiday Packages Catalog Core |  |  |
|  |  | - Schedule Aggregator   |  | - Geocoding Resolver     |  | - Itinerary Curator            |  |  |
|  |  | - Leaflet Corridor Calc |  | - Regex Normalizer       |  | - Departure Scheduler          |  |  |
|  |  | - Live Aircraft HUD     |  | - Overflow Safeguards    |  | - Multi-Day Inclusions         |  |  |
|  |  +-------------------------+  +--------------------------+  +--------------------------------+  |  |
|  |                                                                                                 |  |
|  |  +-------------------------+  +--------------------------+  +--------------------------------+  |  |
|  |  | Digital Wallet Engine   |  | B2B Marketplace Engine   |  | Booking & E-Ticket Generator   |  |  |
|  |  | - Stored-Value Ledger   |  | - Partner Provisioning   |  | - PNR Allocation Engine        |  |  |
|  |  | - 1-Click Fast Checkout |  | - Wholesale Margin Calc  |  | - Barcode & Security Visual    |  |  |
|  |  | - Automated Fast Refund |  | - Headless REST API      |  | - Print Stylesheet Isolation   |  |  |
|  |  +-------------------------+  +--------------------------+  +--------------------------------+  |  |
|  |                                                                                                 |  |
|  |  +-------------------------+  +--------------------------+  +--------------------------------+  |  |
|  |  | SSE Order Telemetry     |  | Master Security Gateway  |  | Immutable Audit Logger         |  |  |
|  |  | - Real-time SSE Stream  |  | - Master PIN Validator   |  | - Deletion Reason Logger       |  |  |
|  |  | - Audio Chime Dispatch  |  | - Runtime Hot-Reloader   |  | - IP & Timestamp Verifier      |  |  |
|  |  +-------------------------+  +--------------------------+  +--------------------------------+  |  |
|  +------------------------------------------------+------------------------------------------------+  |
|                                                   |                                                   |
|                                                   v                                                   |
|  +-------------------------------------------------------------------------------------------------+  |
|  |                            DATA PERSISTENCE & GLOBAL INTEGRATIONS                               |  |
|  |                                                                                                 |  |
|  |   [MongoDB Atlas & MemoryStore]  <===> Dual-Tier Persistence with High-Availability Caching     |  |
|  |   [Geoapify Integration]         <===> Worldwide Places Discovery & Vector Cartography Tiles    |  |
|  |   [Aviationstack Telemetry]      <===> Live Flight Status, Aircraft Positions & Gate Telemetry  |  |
|  |   [Amadeus Global GDS]           <===> Scheduled Commercial Airline Inventories                 |  |
|  |   [Stripe Payment Engine]        <===> Card Processing, Settlements & Digital Wallet Top-Ups    |  |
|  |   [ExchangeRate API Engine]      <===> Real-Time Currency Matrix (USD, BDT, EUR, GBP, AED, SAR) |  |
|  +-------------------------------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------------------------------+
```

---

### 7.4 System State Diagram

```
[*] --> Unauthenticated_Browsing

Unauthenticated_Browsing --> Authenticating : User Submits Credentials / Register
Authenticating --> Customer_Session_Active : Credentials Validated (Role = CUSTOMER)
Authenticating --> Admin_Session_Active : Credentials Validated (Role = ADMIN)
Authenticating --> Unauthenticated_Browsing : Validation Failed

state Customer_Session_Active {
    [*] --> Idle_Dashboard
    Idle_Dashboard --> Flight_Radar_Inspecting : Selects Flight Details
    Flight_Radar_Inspecting --> Idle_Dashboard : Closes Radar Modal

    Idle_Dashboard --> Hotel_Radar_Browsing : Selects Nearby Hotel Radar
    Hotel_Radar_Browsing --> Idle_Dashboard : Returns to Search

    Idle_Dashboard --> Wallet_TopUp_Initiated : Adds Funds to Digital Wallet
    Wallet_TopUp_Initiated --> Wallet_Funds_Credited : Stripe Payment Approved
    Wallet_Funds_Credited --> Idle_Dashboard

    Idle_Dashboard --> Checkout_In_Progress : Selects Flight / Hotel / Package
    Checkout_In_Progress --> Payment_Processing : Submits Traveler Details
    Payment_Processing --> Booking_Confirmed : 1-Click Wallet Deduction / Card Settlement
    Payment_Processing --> Checkout_In_Progress : Payment Declined
    Booking_Confirmed --> ETicket_Voucher_Issued : PNR & Barcode Generated
    ETicket_Voucher_Issued --> Idle_Dashboard

    Idle_Dashboard --> Cancellation_Initiated : Cancels in My Bookings
    Cancellation_Initiated --> Refund_Credited_To_Wallet : Booking Cancelled & Wallet Recredited
    Refund_Credited_To_Wallet --> Idle_Dashboard
}

state Admin_Session_Active {
    [*] --> Admin_Dashboard_Idle
    Admin_Dashboard_Idle --> SSE_Order_Received : New Booking Arrives
    SSE_Order_Received --> Audio_Chime_Alerting : Sound Alert Plays & Row Highlighted
    Audio_Chime_Alerting --> Admin_Dashboard_Idle

    Admin_Dashboard_Idle --> Inspecting_Customer_Ticket : Clicks Ticket Button
    Inspecting_Customer_Ticket --> Admin_Dashboard_Idle : Closes Voucher

    Admin_Dashboard_Idle --> Catalog_CRUD_Managing : Adds / Modifies Inventory
    Catalog_CRUD_Managing --> Deletion_Reason_Prompt : Clicks Delete Item
    Deletion_Reason_Prompt --> Audit_Record_Logged : Reason Input >= 3 Chars
    Audit_Record_Logged --> Admin_Dashboard_Idle

    Admin_Dashboard_Idle --> Key_Vault_Locked : Opens API Keys Tab
    Key_Vault_Locked --> Key_Vault_Unlocked : Master PIN Verified (1234)
    Key_Vault_Unlocked --> Runtime_Key_HotReloaded : Key Saved & Applied to Memory
    Runtime_Key_HotReloaded --> Admin_Dashboard_Idle
}

Customer_Session_Active --> [*] : User Logs Out
Admin_Session_Active --> [*] : Admin Logs Out
```

---

### 7.5 Sequence Diagrams

#### Sequence 1: Flight Telemetry & Live GIS Radar Inspection
```
Traveler                ClientApp               BackendAPI             Aviationstack/Geoapify
   |                        |                       |                             |
   |--- Search Flights ---->|                       |                             |
   |                        |--- GET /flights ----->|                             |
   |                        |                       |--- Query Route Schedules -->|
   |                        |                       |<-- Return Active Flights ---|
   |                        |<-- Render Results ----|                             |
   |                        |                       |                             |
   |-- Click "Details" ---->|                       |                             |
   |                        |-- GET /radar/:id ---->|                             |
   |                        |                       |-- Fetch Live GPS & Status ->|
   |                        |                       |<-- Return Telemetry Data ---|
   |                        |                       |                             |
   |                        |-- Load Vector Tiles ------------------------------->|
   |                        |<- Return Map Tiles ---------------------------------|
   |                        |                       |                             |
   |                        |-- Plot Origin Pin (DAC)                             |
   |                        |-- Plot Destination Pin (DXB)                        |
   |                        |-- Render Geodesic Trajectory Corridor               |
   |                        |-- Place Aircraft Icon along Path (71%)              |
   |                        |-- Display HUD: 38,000 ft, 860 km/h, Gate, Carousel |
   |<- Display Radar Modal -|                       |                             |
   |                        |                       |                             |
   |-- Zoom In (+) -------->|                       |                             |
   |<- Sticky Map Zoom -----| (Maintains position without auto-reset)             |
```

#### Sequence 2: 1-Click Digital Wallet Checkout & Instant Refund
```
Customer                ClientApp               BackendAPI               Database/Ledger
   |                        |                       |                           |
   |-- Click "Book Now" --->|                       |                           |
   |                        |-- Open Checkout Modal |                           |
   |-- Select "Pay Wallet"->|                       |                           |
   |-- Submit Traveler ---->|                       |                           |
   |                        |-- POST /checkout ---->|                           |
   |                        |    (wallet = true)    |-- Check Wallet Balance -->|
   |                        |                       |<-- Balance >= Total ------|
   |                        |                       |                           |
   |                        |                       |-- Deduct Wallet Balance ->|
   |                        |                       |-- Create Booking Record ->|
   |                        |                       |-- Generate PNR (78-529) ->|
   |                        |                       |-- Generate ETKT-784-.. -->|
   |                        |                       |-- Dispatch SSE Event ---->|
   |                        |<-- Confirmation & PNR-|                           |
   |<- Show E-Ticket Modal -|                       |                           |
   |                        |                       |                           |
   |-- Later: Click Cancel->|                       |                           |
   |    (in My Bookings)    |-- PATCH /cancel ----->|                           |
   |                        |                       |-- Set Status: CANCELLED ->|
   |                        |                       |-- Credit Refund to Wallet>|
   |                        |                       |-- Log Transaction Ledger->|
   |                        |<-- Refund Complete ---|                           |
   |<- Toast: 100% Refunded |                       |                           |
```

#### Sequence 3: Real-Time SSE Order Telemetry & Admin Ticket Inspection
```
Customer                BackendAPI            AdminConsole              Dispatcher/Staff
   |                        |                       |                           |
   |-- Submits Booking ---->|                       |                           |
   |                        |-- Save to Database    |                           |
   |                        |-- Emit SSE Event ---->|                           |
   |                        | (booking_created)     |-- Play Audio Chime Alert !|
   |                        |                       |-- Highlight New Order Row |
   |                        |                       |                           |
   |                        |                       |<-- Clicks "Ticket" Button-|
   |                        |                       |                           |
   |                        |                       |-- Open ETicketModal       |
   |                        |                       |-- Render PNR & Barcode    |
   |                        |                       |-- Render Passenger Info   |
   |                        |                       |-- Render Flight Timetable |
   |                        |                       |                           |
   |                        |                       |<-- Clicks "Print Ticket" -|
   |                        |                       |-- Isolate @media print    |
   |                        |                       |-- Trigger Native Print PDF|
```

---

### 7.6 Data Flow Diagrams (DFD)

#### Level-0 Context DFD
```
+------------------+                   Credentials / Searches / Payments                 +------------------+
|                  | ------------------------------------------------------------------> |                  |
|  Retail Traveler | <------------------------------------------------------------------ |                  |
|                  |            Live Maps / Hotel Results / E-Tickets / Wallet           |                  |
+------------------+                                                                     |                  |
                                                                                         |                  |
+------------------+                   Wholesale Searches / Headless Bookings            |                  |
|   B2B Partner    | ------------------------------------------------------------------> |     TRAVEL.      |
|    Reseller      | <------------------------------------------------------------------ |     PLATFORM     |
|                  |                  Wholesale Net Fares / PNR Confirmations            |     SYSTEM       |
+------------------+                                                                     |                  |
                                                                                         |                  |
+------------------+               Catalog Updates / Master PIN / Key Rotations          |                  |
| Platform Admin / | ------------------------------------------------------------------> |                  |
|    Operations    | <------------------------------------------------------------------ |                  |
|                  |             SSE Live Order Alerts / Invoices / Audit Logs           |                  |
+------------------+                                                                     +------------------+
                                                                                                ^    |
                                                                       External Telemetry /     |    |
                                                                          Payment Sync          |    |
                                                                                                |    v
                                                                                         +------------------+
                                                                                         | Global Providers |
                                                                                         | (Geoapify, GDS,  |
                                                                                         | Aviation, Stripe)|
                                                                                         +------------------+
```

#### Level-1 DFD: Subsystem Process Decomposition
```
[User / Admin / B2B]
        |
        v
 ( 1.0 Identity & Access Gate ) ===> [User & Master PIN Store]
        |
        +----------> ( 2.0 Flight Telemetry & GIS Engine ) ===> [Geoapify & Aviationstack]
        |                    |
        |                    v
        +----------> ( 3.0 Hotel Places & Regex Radar ) ====> [Geoapify Places API]
        |                    |
        |                    v
        +----------> ( 4.0 Digital Wallet & Payment Ledger ) <===> [Wallet Balance Store]
        |                    |
        |                    v
        +----------> ( 5.0 Booking Core & E-Ticket Generator ) ==> [Reservations Store]
        |                    |
        |                    v
        +----------> ( 6.0 Real-Time SSE Broadcaster ) ======> [Live Administrative Screens]
        |                    |
        |                    v
        +----------> ( 7.0 Master Security Vault & Audit Trail ) => [Immutable Audit Store]
```

---

## 8. Screen Walkthrough & Live System Screenshots

### 8.1 Flight Radar & Live Telemetry Map
The flight telemetry modal visualizes departure and destination terminals connected by a geodesic trajectory polyline. An active aircraft icon tracks the journey in real time, accompanied by a dynamic HUD displaying live GPS coordinates, altitude, velocity, and airport gate logistics.

![Flight GIS Trajectory Radar](docs/screenshots/flight-live-map-radar.jpg)
*Figure 8.1: Interactive Leaflet GIS flight corridor connecting Dhaka (DAC) to Dubai (DXB) with aircraft tracking and telemetry HUD.*

![Flight Telemetry Overview](docs/screenshots/flight-telemetry-overview.jpg)
*Figure 8.2: Live flight progress telemetry displaying departure times, route duration, terminal, and baggage carousel assignments.*

---

### 8.2 Location-Based Hotel Discovery & Nearby Radar
Travelers can enter any city or click "Nearby / Near Me" to trigger an automated radial search via the Geoapify Places API. The platform enforces strict keyword filtering so that only verified commercial hotels, resorts, and motels are displayed, with long addresses protected by CSS overflow containment.

![Hotel Search Hero & Nearby Radar](docs/screenshots/hotel-search-nearby.png)
*Figure 8.3: Hotel search engine with destination input, dates, occupancy, and quick destination chips including "Nearby / Near Me".*

![Nearby Hotel Search Results](docs/screenshots/hotel-search-results.jpg)
*Figure 8.4: Geoapify nearby hotel radar results in Natore showing verified hotels, distance from city center, guest ratings, and nightly pricing.*

---

### 8.3 Live Flight Status Search Engine
Travelers and dispatchers can track any commercial flight in real time either by selecting origin and destination airports or by entering a specific airline flight number.

![Flight Status Live Radar Screen](docs/screenshots/flight-status-live.jpg)
*Figure 8.5: Live Aviationstack flight radar search supporting route search and direct flight number queries with live schedule telemetry.*

---

### 8.4 Promotional Offers & Bank Partner Privileges
The homepage displays a dynamic 3-column promotional grid featuring special discounts, promo voucher codes, and co-branded lifestyle banking privileges (EBL Visa, bKash, City Bank Amex).

![Special Offers & Bank Partnerships](docs/screenshots/special-offers-bank-partners.jpg)
*Figure 8.6: Dynamic promotional voucher cards and institutional bank partner lifestyle card privilege showcases.*

---

### 8.5 Enterprise Administrative Command Center & Bookings Management
The operations console provides a centralized table for customer bookings and invoices. When a new booking is completed, Server-Sent Events (SSE) update the dashboard in real time with an audible chime alert. Staff can review invoices or click the dedicated **Ticket** button to inspect the exact official passenger voucher.

![Admin Bookings Operations Console](docs/screenshots/admin-bookings-operations.png)
*Figure 8.7: Admin Console bookings management table displaying customer profiles, fares, live order sync, View Invoice, and Customer E-Ticket inspection.*

---

## 9. Conclusion Summary & System Handover Acceptance

The **Travel.** enterprise platform is delivered as a production-verified, fully integrated travel management system. Engineered for commercial autonomy, it bridges consumer-facing retail booking with automated B2B wholesale API distribution, backed by an operations center with audit logging and runtime key rotation.

All modules—including the interactive GIS flight radar, Geoapify nearby hotel discovery, curated holiday packages, promotional campaign manager, customer digital wallet, B2B wholesale API marketplace, and official IATA e-ticket engine—have been tested and verified for immediate commercial deployment.
