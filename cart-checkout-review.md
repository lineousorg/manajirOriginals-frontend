# Cart And Checkout Review

Date: 2026-05-18

Scope reviewed:
- Product add-to-cart flow
- Guest/auth reservation flow
- Cart state persistence and reservation lifecycle
- Cart drawer/cart page validation and cleanup
- Checkout payload building, calculations, and post-order handling

## Findings

### Critical

1. Checkout only sends one `reservationId` per cart line even when the line now contains multiple reservations.

Files:
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:264)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:355)
- [app/checkout/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/checkout/page.tsx:176)

Why this is a problem:
- Repeated adds to the same variant now create multiple backend reservations and store them in `reservationIds`.
- Checkout still serializes only `item.reservationId`, which is just the first reservation on the line.
- For a quantity built from multiple reserve calls, the checkout payload is incomplete from the frontend side.

Likely impact:
- Orders with repeated adds of the same variant can fail validation, reserve the wrong quantity, or leave extra reservations orphaned, depending on backend expectations.

2. Successful checkout immediately calls `clearCart()`, which releases reservations after order creation.

Files:
- [app/checkout/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/checkout/page.tsx:222)
- [app/checkout/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/checkout/page.tsx:252)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:514)

Why this is a problem:
- `clearCart()` is not just local cleanup. It actively calls the reservation release APIs for all cart items.
- That means the frontend releases reservations immediately after a successful order response.

Likely impact:
- If the backend consumes reservations into an order, the frontend is issuing post-order release calls that are at best redundant and at worst incorrect.
- This needs explicit backend contract confirmation; the current frontend behavior is risky.

3. Reservation expiry is tracked as a single `expiresAt` per cart line even though a line may hold multiple reservations with different expiry times.

Files:
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:220)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:270)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:630)
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:44)

Why this is a problem:
- Each additional add creates a fresh reservation and can return a different `expiresAt`.
- The cart line stores only one `expiresAt`, and the drawer checks only one `reservationId`/`expiresAt`.

Likely impact:
- Earlier reservations can expire while the cart still shows the full quantity as if all units are still reserved.
- Countdown UI and cleanup behavior become inaccurate for any cart line built from multiple reserve calls.

### High

4. Expired-reservation cleanup in the cart drawer releases a reservation manually and then calls `removeItem()`, which releases it again.

Files:
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:49)
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:87)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:383)

Why this is a problem:
- `checkExpiredReservations()` already calls the release API.
- It then calls `removeItem()` without `skipRelease`, so the store attempts another release for the same reservation(s).

Likely impact:
- Duplicate backend calls, noisy logs, harder debugging, and possible masking of real release errors.

5. Cart drawer stock validation contains dead and partial logic.

Files:
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:99)
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:107)
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:119)
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:159)

Why this is a problem:
- `itemsToUpdate` is collected but never applied.
- Reserved items are skipped from stock revalidation entirely.
- `variantStockMap` is populated but not used in rendering or enforcement.

Likely impact:
- The drawer gives a false sense of validation coverage.
- Stock drift in the cart is not corrected consistently.

6. `updateQuantity()` changes quantity locally without any reservation adjustment or backend sync.

Files:
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:478)
- [app/cart/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/cart/page.tsx:14)

Why this is a problem:
- The function validates against `variantStock`, then updates local quantity only.
- No additional reservation is created when increasing.
- No reservation is partially released when decreasing.

Likely impact:
- If quantity controls are wired up later, cart quantity and reserved quantity will diverge immediately.
- The imports in `app/cart/page.tsx` suggest this path was intended and may be activated later.

7. Guest add-to-cart can fail transiently if the user clicks before guest token initialization finishes.

Files:
- [app/providers.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/providers.tsx:18)
- [lib/cart.ts](/d:/Dominic/CMS/manajirOriginals-frontend/lib/cart.ts:116)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:240)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:311)

Why this is a problem:
- Guest token initialization is async on mount.
- Guest reserve calls fail hard if `guestToken` is still null.

Likely impact:
- First-click add-to-cart failures for guest users on fresh page loads or slow connections.

### Medium

8. Stock and reservation rules are duplicated across several layers and are already drifting.

Files:
- [hooks/useVariantSelection.ts](/d:/Dominic/CMS/manajirOriginals-frontend/hooks/useVariantSelection.ts:51)
- [app/products/[id]/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/products/[id]/page.tsx:203)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:182)
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:99)

Why this is a problem:
- Quantity limiting, stock reads, reservation lifecycle, and stale-state correction all exist in separate places.
- The repeated-add bug and the guest parse bug are both examples of this logic already diverging.

Likely impact:
- Future fixes will keep breaking in one surface while working in another unless the logic is consolidated.

9. Checkout decides guest/auth mode from `user` presence instead of the explicit auth flag.

Files:
- [app/checkout/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/checkout/page.tsx:182)
- [store/auth.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/auth.store.ts:7)

Why this is a problem:
- The auth store already tracks `isAuthenticated`.
- Checkout uses `!user` instead.

Likely impact:
- If persisted auth state and user object ever drift, the frontend can hit the wrong order endpoint or omit guest token handling.

10. Multi-reservation support is only partial in the cart store API.

Files:
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:24)
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:630)

Why this is a problem:
- The store now persists `reservationIds`, but `getItemReservation()` still exposes only one `reservationId` and one `expiresAt`.
- Other consumers still behave as though a cart line maps to exactly one reservation.

Likely impact:
- Future features built on store selectors will inherit incorrect assumptions and reintroduce checkout/removal bugs.

### Low

11. The cart page contains incomplete quantity-management scaffolding.

Files:
- [app/cart/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/cart/page.tsx:5)
- [app/cart/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/cart/page.tsx:14)

Why this is a problem:
- `Minus`, `Plus`, `updateQuantity`, `trackBeginCheckout`, and `isAuthenticated` are imported but not used.
- This increases noise around a flow that is already complex and makes it harder to tell which quantity path is real.

Likely impact:
- Maintenance cost and higher chance of reactivating unsafe quantity behavior later.

## Duplicate Logic / Structural Risks

1. Discounted-price calculation is repeated across cart page, cart drawer, and checkout summary instead of coming from one helper.

Files:
- [store/cart.store.ts](/d:/Dominic/CMS/manajirOriginals-frontend/store/cart.store.ts:570)
- [app/cart/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/cart/page.tsx:200)
- [app/checkout/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/checkout/page.tsx:67)
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:215)

Risk:
- Price and subtotal rendering can drift if discount logic changes in one place only.

2. Delivery total calculation is repeated across cart page, drawer, and checkout.

Files:
- [app/cart/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/cart/page.tsx:51)
- [layout/CartDrawer.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/layout/CartDrawer.tsx:208)
- [app/checkout/page.tsx](/d:/Dominic/CMS/manajirOriginals-frontend/app/checkout/page.tsx:61)

Risk:
- This is currently contained by `DELIVERY_CHARGES`, but the behavior is still spread across multiple UIs and can diverge once shipping rules become more complex.

## Backend Contract Confirmations Needed

These are the only places where I would want backend request/response confirmation before recommending a frontend redesign:

1. After successful order creation, should the frontend release reservations at all, or are reservations consumed server-side as part of order placement?

2. For a cart line whose quantity was built from multiple reserve calls, what exact order payload does the backend expect?

Possible shapes to confirm:
- one `reservationId` for the whole line
- one reservation per unit
- an array of reservation IDs
- no reservation IDs at all for authenticated users

3. Can different reservations for the same variant legitimately have different expiries, and if so, how should the frontend represent them?

## Overall Assessment

The main architecture issue is that the cart line model still mostly assumes:
- one cart line = one reservation
- one reservation = one expiry

That assumption is no longer true once repeated adds to the same variant are supported by creating new reserve calls. The frontend now has partial multi-reservation support in storage, but checkout, expiry handling, selectors, and drawer validation still largely operate on the old one-reservation model.

If you want, the next step can be a second report that turns these findings into a recommended cleanup plan in priority order, but I have not included implementation steps here since you asked for report only.
