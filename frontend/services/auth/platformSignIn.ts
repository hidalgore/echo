/**
 * services/auth/platformSignIn.ts
 * ═══════════════════════════════
 * Native identity-token ACQUISITION — the client half of Sign in with
 * Apple / Google Sign-In.
 *
 * Phase 1 credential gate (flagged, mirrors the backend verifier gate): the
 * Apple Team ID / Service ID and Google OAuth client IDs were not available
 * this phase, so the acquisition SDKs (`expo-apple-authentication`,
 * `@react-native-google-signin/google-signin` — both native-build
 * dependencies) are NOT installed. This adapter is the single seam: when the
 * credentials exist, implement these two functions with the real SDKs and
 * nothing else changes — authService/authStore already consume them.
 *
 * Until then both throw PlatformSignInUnavailable; the sign-in screen shows
 * the message instead of faking a session.
 */

export class PlatformSignInUnavailable extends Error {
  constructor(provider: 'apple' | 'google') {
    super(
      provider === 'apple'
        ? 'Sign in with Apple isn’t configured in this build yet.'
        : 'Google Sign-In isn’t configured in this build yet.',
    );
    this.name = 'PlatformSignInUnavailable';
  }
}

export type AppleCredential = { identityToken: string; name?: string };

/** Returns Apple's identity token (+ the first-auth-only name, which never
 * appears in the token itself and must be forwarded to the backend). */
export async function acquireAppleIdentityToken(): Promise<AppleCredential> {
  throw new PlatformSignInUnavailable('apple');
}

/** Returns Google's ID token for the configured OAuth client. */
export async function acquireGoogleIdentityToken(): Promise<string> {
  throw new PlatformSignInUnavailable('google');
}
