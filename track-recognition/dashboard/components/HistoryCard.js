import { ScrollView } from 'react-native';
import { Button, Card, Divider, List, Text } from 'react-native-paper';

export default function HistoryCard({ history, onClear, onSelectTrack }) {
  return (
    <Card mode="elevated" style={{ maxHeight: 450, padding: 10 }}>
      <Card.Title
        title="Session History"
        subtitle="Tap any track to view on Last.fm"
        right={() =>
          history.length > 0 ? (
            <Button compact onPress={onClear}>
              Clear
            </Button>
          ) : null
        }
      />
      <Divider />
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
                onPress={() => onSelectTrack(item)}
              />
            ))
          )}
        </Card.Content>
      </ScrollView>
    </Card>
  );
}