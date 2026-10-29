import { View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';

export default function HeaderControls({
  isPolling,
  onTogglePolling,
  isDarkMode,
  onToggleTheme,
  activeTab,
  onTabChange,
  historyCount,
}) {
  return (
    <>
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
        <Button mode="contained-tonal" compact onPress={onTogglePolling}>
          {isPolling ? 'Polling: Live' : 'Polling: Paused'}
        </Button>

        <Button mode="contained-tonal" compact onPress={onToggleTheme}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </View>

      <SegmentedButtons
        value={activeTab}
        onValueChange={onTabChange}
        style={{ marginBottom: 20 }}
        buttons={[
          { value: 'nowPlaying', label: 'Now Playing' },
          { value: 'history', label: `History (${historyCount})` },
        ]}
      />
    </>
  );
}