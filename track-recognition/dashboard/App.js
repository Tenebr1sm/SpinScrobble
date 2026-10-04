import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const demoTrack = {
  artist: 'Daft Punk',
  title: 'Around the World',
  album: 'Homework',
  confirmed: true,
};

export default function App() {
  const [track, setTrack] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrack(demoTrack);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>SpinScrobble</Text>

        {track ? (
          <>
            <Text style={styles.status}>Now playing</Text>
            <Text style={styles.title}>{track.title}</Text>
            <Text style={styles.artist}>{track.artist}</Text>
            <Text style={styles.album}>{track.album}</Text>
          </>
        ) : (
          <>
            <Text style={styles.status}>Waiting for confirmation</Text>
            <Text style={styles.placeholder}>No track confirmed yet.</Text>
          </>
        )}
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121a2b',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#2a3552',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  label: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#7dd3fc',
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  status: {
    fontSize: 14,
    color: '#a5b4fc',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  artist: {
    fontSize: 20,
    color: '#dbeafe',
    marginBottom: 4,
  },
  album: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  placeholder: {
    fontSize: 18,
    color: '#cbd5e1',
  },
});
