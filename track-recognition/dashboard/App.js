import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Linking, SafeAreaView, ScrollView, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  List,
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  SegmentedButtons,
  Snackbar,
  Surface,
  Text,
} from 'react-native-paper';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function App() {
  const [track, setTrack] = useState(null);
  const [history, setHistory] = useState([]);
  const [imageFailed, setImageFailed] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Interactive UI states
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPolling, setIsPolling] = useState(true);
  const [activeTab, setActiveTab] = useState('nowPlaying');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const theme = isDarkMode ? MD3DarkTheme : MD3LightTheme;

  const refreshTrack = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/current-track`);
      if (!response.ok) {
        throw new Error(`Dashboard API returned ${response.status}`);
      }

      const data = await response.json();
      setTrack((prevTrack) => {
        const incoming = data.track;
        const isNewTrack =
          incoming &&
          (!prevTrack ||
            prevTrack.title !== incoming.title ||
            prevTrack.artist !== incoming.artist);

        if (isNewTrack) {
          const entry = {
            ...incoming,
            id: `${incoming.artist}-${incoming.title}-${Date.now()}`,
            confirmedAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          setHistory((prevHistory) => [entry, ...prevHistory]);
          setSnackbarMessage(`Confirmed: ${incoming.title} by ${incoming.artist}`);
        }
        return incoming;
      });

      setConnectionError(false);
      setLoading(false);
    } catch {
      setConnectionError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTrack();
    if (!isPolling) return;

    const interval = setInterval(refreshTrack, 2000);
    return () => clearInterval(interval);
  }, [isPolling, refreshTrack]);

  useEffect(() => {
    setImageFailed(false);
  }, [track?.artworkUrl]);

  const openLastFmTrack = (targetTrack) => {
    if (!targetTrack) return;
    const url = `https://www.last.fm/music/${encodeURIComponent(
      targetTrack.artist
    )}/_/${encodeURIComponent(targetTrack.title)}`;
    Linking.openURL(url);
  };

  return (
    <PaperProvider theme={theme}>
      <Surface style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />

          {/* Centered Title & Quick Controls */}
          <Text
            variant="headlineMedium"
            style={{ textAlign: 'center', marginBottom: 12, fontWeight: 'bold' }}
          >
            SpinScrobble
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Button
              mode="contained-tonal"
              compact
              onPress={() => {
                setIsPolling((prev) => !prev);
                setSnackbarMessage(isPolling ? 'Live polling paused' : 'Live polling resumed');
              }}
            >
              {isPolling ? 'Polling: Live' : 'Polling: Paused'}
            </Button>

            <Button
              mode="contained-tonal"
              compact
              onPress={() => setIsDarkMode((prev) => !prev)}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </View>

          {/* Tab Switcher */}
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            style={{ marginBottom: 20 }}
            buttons={[
              { value: 'nowPlaying', label: 'Now Playing' },
              { value: 'history', label: `History (${history.length})` },
            ]}
          />

          {/* Vertically Centered Main Card */}
          {activeTab === 'nowPlaying' ? (
            track ? (
              <Card mode="elevated" style={{ padding: 10 }}>
                <Card.Title title="Now Playing" subtitle="Track Confirmed" />

                {track.artworkUrl && !imageFailed ? (
                  <Card.Cover
                    source={{ uri: track.artworkUrl }}
                    onError={() => setImageFailed(true)}
                    resizeMode="contain"
                    style={{
                      height: 300,
                      width: 300,
                      alignSelf: 'center',
                      backgroundColor: 'transparent',
                    }}
                  />
                ) : (
                  <Surface
                    elevation={2}
                    style={{
                      height: 300,
                      width: 300,
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
                  <Text
                    variant="titleLarge"
                    style={{ fontWeight: 'bold', textAlign: 'center' }}
                  >
                    {track.title}
                  </Text>
                  <Text variant="bodyLarge" style={{ marginTop: 4, textAlign: 'center' }}>
                    {track.artist}
                  </Text>
                  {track.album ? (
                    <Text variant="labelMedium" style={{ marginTop: 4, textAlign: 'center' }}>
                      {track.album}
                    </Text>
                  ) : null}
                </Card.Content>

                <Card.Actions style={{ justifyContent: 'center', marginTop: 12 }}>
                  <Button mode="outlined" onPress={refreshTrack}>
                    Refresh
                  </Button>
                  <Button
                    mode="contained-tonal"
                    onPress={() => openLastFmTrack(track)}
                  >
                    View on Last.fm
                  </Button>
                </Card.Actions>
              </Card>
            ) : (
              <Card mode="contained" style={{ padding: 30, alignItems: 'center' }}>
                {loading ? (
                  <ActivityIndicator size="large" style={{ marginBottom: 20 }} />
                ) : null}
                <Card.Content style={{ alignItems: 'center' }}>
                  <Text
                    variant="titleMedium"
                    style={{ textAlign: 'center', fontWeight: 'bold' }}
                  >
                    {connectionError ? 'Backend unavailable' : 'Waiting for confirmation'}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ textAlign: 'center', marginTop: 10 }}
                  >
                    {connectionError
                      ? 'Check that the backend is running and the API URL is correct.'
                      : 'Drop the needle on a record to begin.'}
                  </Text>
                </Card.Content>
                <Card.Actions style={{ justifyContent: 'center', marginTop: 16 }}>
                  <Button mode="outlined" onPress={refreshTrack}>
                    Check Now
                  </Button>
                </Card.Actions>
              </Card>
            )
          ) : (
            /* Centered History Card */
            <Card mode="elevated" style={{ maxHeight: 450, padding: 10 }}>
              <Card.Title
                title="Session History"
                subtitle="Tap any track to view on Last.fm"
                right={() =>
                  history.length > 0 ? (
                    <Button compact onPress={() => setHistory([])}>
                      Clear
                    </Button>
                  ) : null
                }
              />
              <ScrollView>
                <Card.Content>
                  {history.length === 0 ? (
                    <Text
                      variant="bodyMedium"
                      style={{ textAlign: 'center', paddingVertical: 24 }}
                    >
                      No tracks confirmed during this session yet.
                    </Text>
                  ) : (
                    history.map((item) => (
                      <List.Item
                        key={item.id}
                        title={item.title}
                        description={`${item.artist}${
                          item.album ? ` • ${item.album}` : ''
                        } (${item.confirmedAt})`}
                        onPress={() => openLastFmTrack(item)}
                      />
                    ))
                  )}
                </Card.Content>
              </ScrollView>
            </Card>
          )}

          <Snackbar
            visible={Boolean(snackbarMessage)}
            onDismiss={() => setSnackbarMessage('')}
            duration={2500}
            action={{
              label: 'Dismiss',
              onPress: () => setSnackbarMessage(''),
            }}
          >
            {snackbarMessage}
          </Snackbar>
        </SafeAreaView>
      </Surface>
    </PaperProvider>
  );
}