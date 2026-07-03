/**
 * Age Verification — Redirect to new verify flow
 * Kept for backward compatibility with any existing deep links.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AgeVerificationRedirect() {
  useEffect(() => {
    router.replace('/verify/method');
  }, []);
  return null;
}
