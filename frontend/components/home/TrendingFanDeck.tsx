import React from 'react';
import type { Event } from '../../types';
import { HappeningNowCarousel } from './HappeningNowCarousel';

interface TrendingFanDeckProps {
  events: Event[];
}

export function TrendingFanDeck({ events = [] }: TrendingFanDeckProps) {
  return <HappeningNowCarousel events={events} />;
}

export default TrendingFanDeck;
