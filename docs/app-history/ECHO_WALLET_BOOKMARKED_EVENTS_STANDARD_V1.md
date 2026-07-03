# ECHO Wallet Bookmarked Events Standard v1

## Purpose
Wallet is an access command center, not only a ticket list. Bookmarked events represent user intent and should be visible in Wallet without being confused with purchased tickets.

## Locked placement
Wallet section order:
1. Active Circle, when relevant
2. Active Ticket / promoted ticket hero / discovery prompt
3. Bookmarked Events
4. Upcoming Tickets
5. Following Hosts
6. Past Events

## Product rules
1. Bookmarked Events only show saved events that are not expired and not already purchased.
2. Source of truth is `eventStore.getSavedEvents()`.
3. Saved events auto-remove after event date via eventStore expiration filtering.
4. Bookmarked cards must open Event Details.
5. Card action should allow removing the bookmark without entering Event Details.
6. Bookmarked events are not tickets and must not use QR/NFC/ticket language.
7. Empty state copy:
   “Save events from Home or Event Details. They’ll appear here until the event starts.”

## Visual standard
- Horizontal card rail.
- Event image on top.
- Floating bookmark control.
- Event title, venue, date/time, and starting price.
- “Saved” intent label instead of ticket status.
