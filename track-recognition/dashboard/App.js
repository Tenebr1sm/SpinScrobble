import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Linking, Platform, SafeAreaView, View } from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  Snackbar,
  Surface,
} from 'react-native-paper';

import HeaderControls from './components/HeaderControls';
import HistoryCard from './components/HistoryCard';
import NowPlayingCard from './components/NowPlayingCard';
import WaitingCard from './components/WaitingCard';
import { useTrackPoller } from './hooks/useTrackPoller';

export default function App() {
  const {
    track,
    history,
    clearHistory,
    connectionError,
    loading,
    statusPhase,
    isPolling,
    togglePolling,
    refreshTrack,
    snackbarMessage,
    setSnackbarMessage,
  } = useTrackPoller();

  const [activeTab, setActiveTab] = useState('nowPlaying');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('spinscrobble_dark_mode');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem('spinscrobble_dark_mode', JSON.stringify(isDarkMode));
    }
  }, [isDarkMode]);

  const openLastFmTrack = (targetTrack) => {
    if (!targetTrack) return;
    const url = `https://www.last.fm/music/${encodeURIComponent(
      targetTrack.artist
    )}/_/${encodeURIComponent(targetTrack.title)}`;
    Linking.openURL(url);
  };

  const openDiscogsRelease = (targetTrack) => {
    if (!targetTrack) return;
    const query = `${targetTrack.artist} ${targetTrack.album || targetTrack.title}`;
    const url = `https://www.discogs.com/search/?q=${encodeURIComponent(
      query
    )}&type=release`;
    Linking.openURL(url);
  };

  const isWaitingScreen = !track || statusPhase === 'waiting';

  return (
    <PaperProvider
      theme={isDarkMode ? MD3DarkTheme : MD3LightTheme}
      settings={{ icon: () => null }}
    >
      <Surface style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />

          <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
            <HeaderControls
              isPolling={isPolling}
              onTogglePolling={togglePolling}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode((prev) => !prev)}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              historyCount={history.length}
            />

            {activeTab === 'nowPlaying' ? (
              !isWaitingScreen ? (
                <NowPlayingCard
                  track={track}
                  isNewSongBannerVisible={statusPhase === 'detected'}
                  onOpenDiscogs={openDiscogsRelease}
                  onOpenLastFm={openLastFmTrack}
                />
              ) : (
                <WaitingCard
                  loading={loading}
                  isPolling={isPolling}
                  connectionError={connectionError}
                  onRetry={refreshTrack}
                />
              )
            ) : (
              <HistoryCard
                history={history}
                onClear={clearHistory}
                onSelectTrack={openLastFmTrack}
              />
            )}
          </View>

          <Snackbar
            visible={Boolean(snackbarMessage)}
            onDismiss={() => setSnackbarMessage('')}
            duration={3500}
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