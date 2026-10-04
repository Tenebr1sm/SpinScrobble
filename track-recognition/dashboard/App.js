import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { Provider as PaperProvider, Card, Text, ActivityIndicator } from 'react-native-paper';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [track, setTrack] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const refreshTrack = async () => {
      try {
        const response = await fetch(`${API_URL}/api/current-track`);
        if (!response.ok) {
          throw new Error(`Dashboard API returned ${response.status}`);
        }

        const data = await response.json();
        if (active) {
          setTrack(data.track);
          setConnectionError(false);
          setLoading(false);
        }
      } catch {
        if (active) {
          setConnectionError(true);
          setLoading(false);
        }
      }
    };

    refreshTrack();
    const interval = setInterval(refreshTrack, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setImageFailed(false);
  }, [track?.artworkUrl]);

  return (
    <PaperProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f5', justifyContent: 'center', padding: 20 }}>
        <StatusBar style="auto" />
        
        <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 'bold' }}>
          SpinScrobble
        </Text>

        {track ? (
          <Card mode="elevated" style={{ padding: 10 }}>
            <Card.Title title="Now Playing" subtitle="Track Confirmed" />
            
            {track.artworkUrl && !imageFailed ? (
              <Card.Cover 
                source={{ uri: track.artworkUrl }} 
                onError={() => setImageFailed(true)}
                resizeMode="contain"
                style={{ height: 300, width: 300, alignSelf: 'center', backgroundColor: 'transparent' }}
              />
            ) : (
              <View style={{ height: 300, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }}>
                <Text variant="labelLarge">Album cover unavailable</Text>
              </View>
            )}
            
            <Card.Content style={{ marginTop: 16, alignItems: 'center' }}>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', textAlign: 'center' }}>
                {track.title}
              </Text>
              <Text variant="bodyLarge" style={{ marginTop: 4, color: '#555' }}>
                {track.artist}
              </Text>
              {track.album ? (
                <Text variant="labelMedium" style={{ marginTop: 4, color: '#888' }}>
                  {track.album}
                </Text>
              ) : null}
            </Card.Content>
          </Card>
        ) : (
          <Card mode="contained" style={{ padding: 30, alignItems: 'center' }}>
            {loading ? <ActivityIndicator size="large" style={{ marginBottom: 20 }} /> : null}
            <Card.Content style={{ alignItems: 'center' }}>
              <Text variant="titleMedium" style={{ color: connectionError ? '#B3261E' : '#333' }}>
                {connectionError ? 'Backend unavailable' : 'Waiting for confirmation'}
              </Text>
              <Text variant="bodyMedium" style={{ textAlign: 'center', marginTop: 10, color: '#666' }}>
                {connectionError
                  ? 'Check that the backend is running and the API URL is correct.'
                  : 'No track confirmed yet.'}
              </Text>
            </Card.Content>
          </Card>
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}
