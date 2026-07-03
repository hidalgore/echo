import React from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { EventDetailMediaType } from '../../types';
import { EVENT_DETAIL_VIDEO_MAX_SECONDS } from '../../constants/eventMedia';

type EventHeroMediaProps = {
  uri?: string | null;
  type?: EventDetailMediaType | null;
  posterUri?: string | null;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  fallbackSeed?: string;
  autoplayVideo?: boolean;
};

const fallbackForSeed = (seed?: string) => `https://picsum.photos/seed/${seed || 'echo-event'}/900/600`;

function EventHeroVideo({
  uri,
  posterUri,
  style,
  imageStyle,
  autoplayVideo = true,
}: {
  uri: string;
  posterUri?: string | null;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  autoplayVideo?: boolean;
}) {
  // ECHO locked rule: supplied Event Details video assets must already be trimmed/processed
  // to EVENT_DETAIL_VIDEO_MAX_SECONDS or shorter before this player receives them.
  const player = useVideoPlayer({ uri }, (instance) => {
    const maxDurationSeconds = EVENT_DETAIL_VIDEO_MAX_SECONDS;
    void maxDurationSeconds;
    instance.loop = true;
    instance.muted = true;
    if (autoplayVideo) instance.play();
  });

  return (
    <View style={[styles.media, style]}>
      {posterUri ? <Image source={{ uri: posterUri }} style={[StyleSheet.absoluteFillObject, imageStyle]} resizeMode="cover" /> : null}
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFillObject, imageStyle]}
        nativeControls={false}
        contentFit="cover"
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

export function EventHeroMedia({
  uri,
  type = 'image',
  posterUri,
  style,
  imageStyle,
  fallbackSeed,
  autoplayVideo = true,
}: EventHeroMediaProps) {
  const resolvedUri = uri || posterUri || fallbackForSeed(fallbackSeed);

  if (type === 'video' && uri) {
    return <EventHeroVideo uri={uri} posterUri={posterUri || undefined} style={style} imageStyle={imageStyle} autoplayVideo={autoplayVideo} />;
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={[styles.media, style, imageStyle]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  media: {
    overflow: 'hidden',
    backgroundColor: '#161A22',
  },
});

export default EventHeroMedia;
