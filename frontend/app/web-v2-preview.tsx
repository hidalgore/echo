/**
 * /web-v2-preview — Legacy alias route for the public ECHO website.
 *
 * Locked v59 behavior:
 * - Both `/` and `/web-v2-preview` render the same canonical homepage component.
 * - The flagship homepage lives in `components/web/EchoPublicWebsite.tsx`.
 * - Native (iOS / Android) callers should never reach this file — `app/index.tsx`
 *   gates by Platform.OS === 'web' before rendering.
 *
 * Why the alias is kept: prior versions of ECHO Web documentation, marketing
 * links, and QR routes still point at /web-v2-preview. The alias keeps those
 * links live without forcing a redirect.
 */
import React from 'react';
import { EchoPublicWebsite } from '../components/web/EchoPublicWebsite';

export default function EchoWebV2Preview() {
  return <EchoPublicWebsite />;
}
