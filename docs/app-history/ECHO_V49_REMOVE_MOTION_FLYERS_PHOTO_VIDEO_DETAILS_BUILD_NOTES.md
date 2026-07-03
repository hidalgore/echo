# ECHO v49 — Remove Motion Event Flyers + Restore Static Home / Photo-Video Event Details

## Product Direction

ECHO has removed the Motion Event Flyer direction from this build.

The new locked media direction is:

- **Home screen:** still photo / flyer only.
- **Discovery cards and rails:** still photo only.
- **ECHO in-app Wallet:** still photo only for ticket artwork and access trust.
- **Event Details page:** host-selected photo or video hero media.
- **Host event creation:** still Home cover image is required; Event Details media can be photo or video.
- **Host event details:** clearly displays the Home still photo policy and Event Details media type.

## Removed from Build

The following event-flyer animation systems were removed from app runtime and source folders:

- Motion event flyer components
- Hero animation preview components
- Motion flyer stores
- Motion flyer metadata mocks
- AI/live-art event flyer services
- Runtime governor used for flyer animation
- Motion-review host components
- Prior motion flyer buildout documentation

## Home Screen Rules

Home is now a still-photo-only surface.

All Home event cards use:

```txt
image_url
```

Home does not render video, animated artwork, AI motion overlays, or live flyer effects.

## Event Details Rules

Event Details supports either a photo or a video hero.

Fields added to the Event model:

```ts
detail_media_url?: string;
detail_media_type?: 'image' | 'video';
detail_media_poster_url?: string;
```

Fallback behavior:

```txt
Event Details media missing → use Home still image
Video poster missing → use Home still image
Video unavailable → static poster remains visible
```

## Wallet Rules

ECHO Wallet remains access-safe.

Wallet ticket artwork uses a still image only. QR, NFC, credential, Door Mode, Apple Wallet, and Google Wallet surfaces remain static and reliable.

## Host Event Creation Updates

Host Create Event now separates media into two decisions:

1. **Home cover image / flyer**
   - still image only
   - required for Home cards
   - recommended 16:9 crop

2. **Event Details media**
   - photo or video
   - appears only on Event Details
   - Home remains still even when a video is selected

If the host selects a video for Event Details without a still Home cover, ECHO reminds the host to add a static cover image.

## Host Event Details Updates

Host Event Details now shows a media preview and labels:

```txt
Home: still photo
Event Details: photo/video
```

This gives hosts clarity on where each media asset appears.

## Strong Recommendations

1. Keep the still cover image mandatory for every event.
2. Allow video only on the Event Details hero surface, not Home or Wallet.
3. Require a poster image for every Event Details video, either host-uploaded or auto-generated later.
4. Keep all access surfaces static: QR, NFC, Door Mode, Apple Wallet, Google Wallet.
5. Add backend video processing in a future build: compression, 30-second duration enforcement, poster extraction, and safety checks.
6. Use muted autoplay with a visible pause control on Event Details once the video player controls are polished.

## Locked / Remaining Product Decisions

1. Event Details video length is locked in v50 at 30 seconds maximum.
2. Event Details video autoplay remains recommended as muted autoplay with a pause control.
3. Video poster images should support both auto-generated and host-overridden posters in a future backend/media-processing pass.
4. Portrait and landscape video can both be supported through a consistent hero crop preview.
5. ECHO Wallet remains still-photo only.

## Testing Checklist

- Home cards render still images only.
- Happening Now carousel remains snap-based and still-photo only.
- Trending and Upcoming cards render still images only.
- Event Details photo hero renders correctly.
- Event Details video hero renders with static poster fallback.
- Host creation requires/selects Home still cover.
- Host creation allows Event Details photo/video.
- Host Event Details displays media preview and labels.
- Wallet ticket artwork remains static.
- No event-flyer animation source folders remain in the build.

## Locked Media Rule Update

- Event Details videos are now locked to a maximum length of 30 seconds.
- Home remains still-photo only.
- ECHO Wallet, QR, NFC, Door Mode, Apple Wallet, and Google Wallet remain still-photo/access-safe.
- Host creation should reject any locally detected video longer than 30 seconds.
- Backend/media processing must enforce the same 30-second max for all uploaded Event Details video assets before publish.
