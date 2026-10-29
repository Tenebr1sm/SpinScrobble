import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, ProgressBar, Surface, Text } from 'react-native-paper';

export default function NowPlayingCard({
  track,
  isNewSongBannerVisible,
  onOpenDiscogs,
  onOpenLastFm,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [track?.artworkUrl]);

  return (
    <Card mode="elevated" style={{ padding: 12 }}>
      <Card.Title
        title={isNewSongBannerVisible ? 'New Song Detected!' : 'Now Playing'}
        subtitle={
          track.confirmedAt ? `Scrobbled at ${track.confirmedAt}` : 'Track Confirmed'
        }
        right={() =>
          isNewSongBannerVisible ? (
            <View style={{ marginRight: 8 }}>
              <Chip mode="flat" compact>
                New Song Detected!
              </Chip>
            </View>
          ) : null
        }
      />

      {isNewSongBannerVisible ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <ProgressBar progress={1} visible />
        </View>
      ) : null}

      {track.artworkUrl && !imageFailed ? (
        <Card.Cover
          source={{ uri: track.artworkUrl }}
          onError={() => setImageFailed(true)}
          resizeMode="contain"
          style={{
            height: 280,
            width: 280,
            alignSelf: 'center',
            backgroundColor: 'transparent',
          }}
        />
      ) : (
        <Surface
          elevation={2}
          style={{
            height: 280,
            width: 280,
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
          }}
        >
          <Text variant="labelLarge">Album cover unavailable</Text>
        </Surface>
      )}

      <Card.Content style={{ marginTop: 16, alignItems: 'center' }}>
        <Text variant="titleLarge" style={{ fontWeight: 'bold', textAlign: 'center' }}>
          {track.title}
        </Text>
        <Text variant="bodyLarge" style={{ marginTop: 4, textAlign: 'center' }}>
          {track.artist}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
            marginTop: 10,
          }}
        >
          {track.album ? <Chip compact>{track.album}</Chip> : null}
          {track.releaseDate ? <Chip compact>{track.releaseDate.slice(0, 4)}</Chip> : null}
        </View>
      </Card.Content>

      <Card.Actions style={{ justifyContent: 'center', marginTop: 12 }}>
        <Button mode="outlined" onPress={() => onOpenDiscogs(track)}>
          Discogs
        </Button>
        <Button mode="contained-tonal" onPress={() => onOpenLastFm(track)}>
          View on Last.fm
        </Button>
      </Card.Actions>
    </Card>
  );
}