# ECHO Locked Event Policy Creation v1

## Purpose
This update makes age requirements, refund policy, and ticket transfer policy explicit during event creation and locks those settings after the event is created.

## Creation Flow Updates

### Age requirement
The Create Event Basics step now uses a locked policy card with switch controls:
- 18+ event
- 21+ event
- All Ages is represented when both switches are off

Selecting 18+ or 21+ makes the event age-gated and requires age verification wherever ECHO enforces age access.

### Ticket policies
The Ticketing step now presents refund and transfer policy switches as locked event policies:
- Allow refunds
- Allow ticket transfers

Both default to off unless the host explicitly enables them.

## Final Publish Warning
When the host taps Create & Lock Event, ECHO shows a confirmation alert before publishing. The alert summarizes:
- Age setting
- Refund policy
- Transfer policy

The host must confirm before the event is posted. The warning states these settings cannot be changed after event creation.

## Locked After Creation
Published event edit surfaces now treat age requirement, refund policy, and transfer policy as locked trust/compliance controls. The host can see the current locked values, but those fields are not editable for that event.

## Event Sync
Published hosted events now persist these policy fields into the shared event store:
- age_restriction
- allow_refunds
- allow_transfers

These values sync into consumer/event mode surfaces, wallet/ticket logic, and host event detail flows through the shared event object.
