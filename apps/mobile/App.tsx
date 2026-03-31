import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Geo Run</Text>
        <Text style={styles.title}>Frontier settlement builder powered by real activity.</Text>
        <Text style={styles.body}>
          This scaffold is wired for the MVP architecture we locked:
          {'\n'}steps {"->"} Supplies
          {'\n'}floors {"->"} Stone
          {'\n'}backend-authoritative settlement state
        </Text>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4efe5',
    padding: 24,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fffaf2',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#d7c9ac',
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8a6a37',
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: '#2f2415',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5b4c36',
  },
});
