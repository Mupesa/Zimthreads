# DISPATCH: Milestone 2 Explorer 2 (Iteration 2) - Form Async Handlers & Error Display Strategy

## Context
Milestone 2 Iteration 1 Gate failed because `Booking.tsx`, `CartDrawer.tsx`, and `Contact.tsx` could not catch network failures during booking, checkout, or inquiry submission, leading to false confirmation screens and unreachable error banners.

## Objective
Recommend concrete changes for:
1. `src/pages/Booking.tsx`: `handleConfirmBooking` must `await addBooking(...)`, remain on wizard step 3 if an error is thrown, display error banner, and re-enable submit button.
2. `src/components/CartDrawer.tsx`: `handleCheckoutSubmit` must `await createOrder(...)`, keep drawer open with visible error message if an error occurs, and clear cart only after successful persistence.
3. `src/pages/Contact.tsx`: `handleSubmit` must `await addInquiry(...)`, show error banner on failure, and show success card only after successful persistence.

## Authoritative Inputs
- `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_reviewer_2\review.md`
- `src/pages/Booking.tsx`
- `src/components/CartDrawer.tsx`
- `src/pages/Contact.tsx`

## Output
Write fix strategy to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2\strategy.md` and handoff to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2\handoff.md`.
Report completion via send_message.

## 2026-10-10T19:14:06Z
You are Explorer 2 for Milestone 2 Iteration 2.
Your working directory is c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2.
Read your instructions in:
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2\DISPATCH.md
- c:\Dev\Active Projects\Zimthreads\PROJECT.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_reviewer_2\review.md
- src/pages/Booking.tsx
- src/components/CartDrawer.tsx
- src/pages/Contact.tsx

Formulate the concrete fix strategy for Booking.tsx, CartDrawer.tsx, and Contact.tsx to await submissions, show loading states, display error banners on network failure, and clear forms/carts only upon success.
Write strategy to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2\strategy.md and handoff report to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_2\handoff.md.
Report completion via send_message.
