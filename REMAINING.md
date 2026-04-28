# Remaining Work for Full Functionality

This document lists the remaining tasks required to make the MediHub system fully functional.

## Backend

- Configure Stripe environment variables:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Validate the Stripe webhook endpoint `/api/payments/webhook` and ensure it receives raw request bodies correctly from Stripe.
- Verify `shippingAddress` data handling across frontend and backend. The backend currently stores it as a string, so frontend order payload should send a single address string.
- Confirm tenant resolution via `x-tenant-domain` in `backend/src/middleware/tenantResolver.js` and ensure multi-tenant store responses work for current domains.
- Add backend support for profile updates or user account edits if desired (currently only `/api/auth/me` exists).
- Add stronger order lifecycle management:
  - order cancellation rules
  - pharmacist/admin order status updates
  - payment status transitions for card / M-Pesa flows
- Harden error handling for missing auth tokens and invalid user sessions.
- Add automated tests for authentication, order creation, payment flow, and tenant-specific behavior.

## Frontend

- Confirm Stripe has been initialized successfully and the card element mounted before card checkout.
- Verify checkout flow for all payment methods:
  - `cod` (Cash on Delivery)
  - `mpesa` (M-Pesa STK push)
  - `card` (Stripe card payment)
- Ensure the `Account` page loads authenticated profile data from `/api/auth/me` and displays it correctly.
- Validate order history rendering from `/api/orders/my` and detail view from `/api/orders/:id`.
- Make sure the cart persists properly in `localStorage` and that quantity updates/removals work.
- Add UI feedback for Stripe card errors, M-Pesa confirmation, and order creation failures.

## Responsive UI Audit

- Mobile layout check: the home page and AI page are now fitting inside the narrow preview viewport without horizontal overflow.
- Desktop layout check: the responsive breakpoints are present in `index.html`, but the integrated browser preview in this environment does not expose a true wide-screen viewport, so a final full-width browser spot-check is still recommended.

## Deployment and Environment

- Provide a working `.env` file or documentation for required environment variables.
- Ensure CORS configuration allows frontend requests from the intended client URL.
- If deploying to production, configure Stripe webhook URL and domain-specific tenant routing.

## Testing and Validation

- Run manual end-to-end tests for:
  - registration and login
  - adding items to cart
  - checkout with each payment method
  - order history view and order detail retrieval
- Add unit/integration tests for backend routes in `backend/src/routes` and controller logic.

## Optional Improvements

- Add user profile edit/update UI and backend endpoint.
- Implement real prescription upload and verification flows.
- Add a pharmacist/admin dashboard for order management and pharmacy inventory.
- Improve UI/UX for the cart modal and order status transitions.
