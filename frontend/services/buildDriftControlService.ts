/**
 * Build Drift Control Service
 * Holds open questions and recommendations so future Claude/frontend work does
 * not override previous locked decisions.
 */

import { ECHO_PHASE2_OPEN_BUILD_QUESTIONS } from '../types/canonicalPlatform';

export function getOpenBuildQuestions() {
  return ECHO_PHASE2_OPEN_BUILD_QUESTIONS;
}

export function getRecommendedDefault(questionId: string): string | undefined {
  return ECHO_PHASE2_OPEN_BUILD_QUESTIONS.find((question) => question.id === questionId)?.defaultLock;
}

export function getLockedBuildRecommendations(): string[] {
  return ECHO_PHASE2_OPEN_BUILD_QUESTIONS.map((question) => `${question.id}: ${question.recommendation}`);
}
