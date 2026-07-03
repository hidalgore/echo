# ECHO v50 — Event Details Video 30-Second Rule

## Locked Product Rule

Event Details videos are now locked to a maximum length of **30 seconds**.

This rule applies only to the **Event Details hero video** surface.

Home, discovery cards, ECHO Wallet, QR, NFC, Door Mode, Apple Wallet, and Google Wallet remain still-photo/access-safe surfaces.

## Canonical Rule

```txt
Event Details video maximum length: 30 seconds
Home screen media: still photo only
ECHO Wallet media: still photo only
Access credential surfaces: static only
```

## Implementation Added

### 1. Canonical media constants

Added/updated:

```txt
/constants/eventMedia.ts
```

Exports include:

```ts
EVENT_DETAIL_VIDEO_MAX_SECONDS = 30
EVENT_DETAIL_VIDEO_MAX_LABEL = '30 seconds'
normalizeEventDetailVideoDurationSeconds()
isEventDetailVideoDurationAllowed()
formatEventDetailVideoDuration()
getEventDetailVideoDurationLabel()
```

### 2. Host Create Event enforcement

Updated:

```txt
/app/(host)/create.tsx
/stores/eventDraftStore.ts
```

Behavior:

- Host may still choose photo or video for Event Details.
- Local video duration is normalized from ImagePicker metadata.
- Videos detected over 30 seconds are rejected immediately.
- Draft readiness fails if a selected Event Details video exceeds 30 seconds.
- Publish is blocked if a detected over-limit Event Details video is still present.
- Host copy now displays the locked 30-second limit.

### 3. Publish safety enforcement

Updated:

```txt
/app/(host)/publish.tsx
/stores/eventStore.ts
/stores/hostStore.ts
```

Behavior:

- Legacy/scan publish flow checks the same 30-second rule.
- Event store refuses to preserve an over-limit video as Event Details video media.
- If the media type is unsafe or over-limit, the published event safely resolves to the still image instead of an invalid video surface.

### 4. Types updated

Updated:

```txt
/types/index.ts
/types/hostEvents.ts
/stores/eventDraftStore.ts
```

Added duration metadata:

```ts
detail_media_duration_seconds?: number | null;
eventDetailMediaDurationSeconds?: number | null;
```

## Production Backend Requirement

The frontend blocks over-limit videos when local duration metadata is available. In production, backend/media processing must also enforce the same 30-second rule because some platforms may not provide reliable local duration metadata before upload.

Backend/media processor must:

```txt
1. Probe uploaded video duration.
2. Reject or trim any Event Details video over 30 seconds.
3. Generate a poster frame.
4. Return the processed video URL only after compliance.
5. Preserve the still Home cover image regardless of video upload.
```

## Acceptance Criteria

```txt
- Event Details videos over 30 seconds are rejected in Host Create Event when duration metadata is available.
- Create Event review and publish confirmation show the 30-second locked rule.
- Draft readiness respects the 30-second rule.
- Legacy host publish flow displays the 30-second rule.
- Published event records store detail_media_duration_seconds for video assets.
- Home remains still-photo only.
- ECHO Wallet remains still-photo only.
- QR/NFC/Door Mode/Apple Wallet/Google Wallet surfaces remain static.
```
