import { View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, ProgressBar, Text } from 'react-native-paper';

export default function WaitingCard({
  loading,
  isPolling,
  connectionError,
  onRetry,
}) {
  return (
    <Card mode="contained" style={{ padding: 30 }}>
      {loading || (isPolling && !connectionError) ? (
        <ActivityIndicator size="large" style={{ marginBottom: 16 }} />
      ) : null}

      <Card.Content style={{ alignItems: 'center' }}>
        <Chip mode="outlined" compact style={{ marginBottom: 12 }}>
          {connectionError
            ? 'Connection lost'
            : isPolling
            ? 'Scanning turntable • Listening for next song'
            : 'Listener paused'}
        </Chip>

        <Text variant="titleLarge" style={{ textAlign: 'center', fontWeight: 'bold' }}>
          {connectionError
            ? 'Backend unavailable'
            : isPolling
            ? 'Waiting for Song'
            : 'Polling Paused'}
        </Text>

        <Text
          variant="bodyMedium"
          style={{ textAlign: 'center', marginTop: 10, marginBottom: 16 }}
        >
          {connectionError
            ? 'Check that the backend is running and the API URL is correct.'
            : isPolling
            ? 'Listening to the turntable and matching audio...'
            : 'Resume polling or check manually to detect tracks.'}
        </Text>

        {isPolling && !connectionError ? (
          <View style={{ width: '60%' }}>
            <ProgressBar indeterminate />
          </View>
        ) : null}
      </Card.Content>

      {(!isPolling || connectionError) && (
        <Card.Actions style={{ justifyContent: 'center', marginTop: 12 }}>
          <Button mode="outlined" onPress={onRetry}>
            Check Now
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}