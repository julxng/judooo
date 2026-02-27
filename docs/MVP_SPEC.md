# Vietnam Art Marketplace MVP Spec

## 1. Product scope

### In scope for MVP
- Buyer-facing marketplace for original artworks.
- Sale types: fixed price and auction.
- Event hub with list and map views.
- Event detail pages linked to purchasable artworks.
- Public artist profiles and portfolio discovery.
- Google sign-in and role-aware permissions.
- Saved events/watchlist.
- Basic moderation workflow for events and artworks.
- Buyer inquiry flow for fixed price, commission, and performance booking.

### Out of scope for MVP (Phase 2+)
- Integrated shipping, logistics dispatch, and conservation operations dashboard.
- Automated tax invoicing and advanced accounting.
- Native in-app chat.
- Multi-currency settlement and escrow.
- Algorithmic recommendations.

## 2. User roles
- `art_lover`: buyer-only permissions.
- `artist`: can manage own profile and own listings.
- `gallery`: can create/manage events and marketplace listings.
- `art_dealer`: same as gallery, plus promotion controls.

## 3. Core journeys

### Buyer journey
1. Discover events via timeline and map.
2. Open event details and browse linked artworks.
3. Open artwork detail and choose action:
   - Fixed: send purchase intent/inquiry.
   - Auction: place bid higher than current bid.
   - Commission/booking: submit inquiry.
4. Save events to watchlist.

### Artist/gallery journey
1. Sign in with Google.
2. Complete profile.
3. Create event.
4. Submit artwork in `draft` state.
5. Publish after moderation (`approved` only).

### Admin/moderation journey
1. Review `pending` events and artworks.
2. Approve or reject with reason.
3. Feature selected items.

## 4. MVP data model
- `profiles`: identity and role.
- `artists`: public artist profiles.
- `events`: event catalog, geodata, lifecycle status.
- `artworks`: listings across painting/sculpture/video/performance/installation.
- `bids`: immutable bid records.
- `watchlist`: saved events by user.
- `purchase_intents`: buyer requests for fixed sale, commission, and booking.
- `event_promotions`: paid promotion placements.

## 5. Business defaults (editable)
- Platform commission default: 12%.
- Promotion plans: Basic / Featured / Spotlight.
- Vetting policy v1:
  - New listing starts `draft`.
  - Creator submits to `pending`.
  - Moderator sets `approved` or `rejected`.

## 6. Metrics to instrument at MVP
- New profiles by role per week.
- New artist profiles per week.
- Published artworks per week.
- Event page to artwork click-through rate.
- Artwork detail to purchase-intent conversion.
- Auction participation rate and average bid count.
- GMV proxy: sum of accepted fixed intents + winning bids.

## 7. API/permission rules
- Public users can read only `published` events and `approved/active` artworks.
- Authenticated users can manage only their own profile data.
- `artist`/`gallery`/`art_dealer` can create content.
- `art_lover` cannot create events or listings.
- Bid insertion must validate auction mode, active state, and minimum increment.

## 8. Acceptance criteria for this foundation phase
- Database migration is reproducible on a clean Supabase project.
- RLS blocks unauthorized writes for all user-owned tables.
- Bid trigger updates current bid and bid count deterministically.
- Seed script creates demo users, events, artworks, and bids for local QA.

## 9. Open decisions to confirm
- Final project name.
- Commission policy by category (fixed, auction, commission work).
- Moderation SLA targets.
- Payment execution partner and launch-country legal terms.
