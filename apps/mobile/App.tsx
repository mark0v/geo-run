import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { SettlementHomeScreen } from './src/features/settlement/SettlementHomeScreen';
import { mockSettlementSnapshot } from './src/lib/api/mock';

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <SettlementHomeScreen snapshot={mockSettlementSnapshot} />
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4efe5',
  },
  content: {
    padding: 20,
  },
});
