import { useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { ActivityIndicator, Card, Chip, Surface, Text } from 'react-native-paper';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function RecommendationsBar({ track }) {
  const [recommendations, setRecommendations] = useState([]);
  const [failedImages, setFailedImages] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!track?.artist || !track?.title) {
      setRecommendations([]);
      return;
    }

    let active = true;
    setFailedImages({});

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const query = `artist=${encodeURIComponent(
          track.artist
        )}&track=${encodeURIComponent(track.title)}`;
        const response = await fetch(`${API_URL}/api/recommendations?${query}`);
        const data = await response.json();
        if (active) {
          setRecommendations(data.recommendations || []);
        }
      } catch {
        if (active) {
          setRecommendations([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();
    return () => {
      active = false;
    };
  }, [track?.artist, track?.title]);

  if (!track) return null;

  return (
    <View style={{ marginTop: 18 }}>
      <Text
        variant="titleMedium"
        style={{ marginBottom: 10, fontWeight: 'bold', textAlign: 'left' }}
      >
        Recommended Tracks
      </Text>

      {loading ? (
        <Card mode="contained" style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" />
        </Card>
      ) : recommendations.length === 0 ? (
        <Card mode="contained" style={{ padding: 14 }}>
          <Text variant="bodySmall" style={{ textAlign: 'center' }}>
            No similar track recommendations found on Last.fm.
          </Text>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
        >
          {recommendations.map((rec, index) => {
            const cardKey = `${rec.artist}-${rec.title}-${index}`;
            const hasCover = Boolean(rec.artworkUrl) && !failedImages[cardKey];

            return (
              <Card
                key={cardKey}
                mode="contained"
                style={{ width: 165, padding: 8 }}
                onPress={() => {
                  const targetUrl =
                    rec.url ||
                    `https://www.last.fm/music/${encodeURIComponent(
                      rec.artist
                    )}/_/${encodeURIComponent(rec.title)}`;
                  Linking.openURL(targetUrl);
                }}
              >
                {hasCover ? (
                  <Card.Cover
                    source={{ uri: rec.artworkUrl }}
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [cardKey]: true }))
                    }
                    resizeMode="contain"
                    style={{
                      height: 130,
                      width: 130,
                      alignSelf: 'center',
                      backgroundColor: 'transparent',
                    }}
                  />
                ) : (
                  <Surface
                    elevation={1}
                    style={{
                      height: 130,
                      width: 130,
                      alignSelf: 'center',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: 8,
                    }}
                  >
                    <Text variant="labelSmall">No Cover</Text>
                  </Surface>
                )}

                <Card.Content style={{ paddingHorizontal: 4, paddingTop: 10 }}>
                  <Text
                    variant="labelLarge"
                    numberOfLines={1}
                    style={{ fontWeight: 'bold', textAlign: 'center' }}
                  >
                    {rec.title}
                  </Text>
                  <Text
                    variant="bodySmall"
                    numberOfLines={1}
                    style={{ marginTop: 2, textAlign: 'center' }}
                  >
                    {rec.artist}
                  </Text>

                  <View style={{ marginTop: 8, alignSelf: 'center' }}>
                  </View>
                </Card.Content>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}