1. Event setup

Admin creates a new event with a name, date, description and generates a single-use QR code.

Admin uploads or types in a guest list (email addresses).

2. Claiming cocktails

Guest scans the event QR code and lands on a claim page.

Guest enters their email and a password (or other simple credentials) to register.

System checks: if this guest hasn’t already claimed for this event, grant exactly 5 coupons and mark them as claimed. If they already claimed, show an error.

3. Guest dashboard

After login, show each guest:

How many of their 5 coupons remain.

A chronological list of every cocktail they ordered, with timestamps and status.

4. Redeeming a cocktail

Guest taps a “Redeem” button next to a cocktail name.

The app immediately shows an “Order processing…” indicator.

A new order record is created in status “pending.”

5. Bartender queue

Bartender logs in and sees a live list of pending orders (guest identity, cocktail, request time) in first‑come order.

When a drink is ready, bartender taps “Accept,” which:

Marks that order record as “complete.”

Decreases that guest’s remaining coupon count by one.

Updates both bartender and guest views in real time.

6. Admin overview

Organizer logs in separately from guest and bartender.

Organizer can view all guests for an event, see who has claimed, how many coupons they’ve used, how many remain, and see full redemption histories.

Organizer can revoke a guest’s coupons or disable a guest account if needed.

Workflows

Scan QR → Register → Receive 5 coupons

Login → See remaining coupons + history

Click “Redeem” → order created (pending) → show spinner

Bartender sees pending list → clicks “Accept” → order complete + coupon count updates

Organizer monitors all activity in one overview.