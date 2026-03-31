import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SettlementHomeScreen } from './src/features/settlement/SettlementHomeScreen';
import { useSettlementSnapshot } from './src/features/settlement/useSettlementSnapshot';

export default function App() {
  return (
    <SQLiteProvider databaseName="geo-run.db">
      <AppContent />
    </SQLiteProvider>
  );
}

function AppContent() {
  const {
    snapshot,
    isLoading,
    isSubmitting,
    error,
    actionMessage,
    source,
    syncTodayActivityAction,
    startBuildAction,
    startClearTileAction,
    startUpgradeAction,
    resolveActiveQueueItemAction,
  } = useSettlementSnapshot();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {snapshot ? (
          <SettlementHomeScreen
            snapshot={snapshot}
            isSubmitting={isSubmitting}
            actionMessage={actionMessage}
            onSyncTodayActivity={() => {
              void syncTodayActivityAction();
            }}
            onBuild={(tileKey, buildingType) => {
              void startBuildAction(tileKey, buildingType);
            }}
            onClearTile={(tileKey) => {
              void startClearTileAction(tileKey);
            }}
            onUpgrade={(buildingId) => {
              void startUpgradeAction(buildingId);
            }}
            onResolveQueueItem={() => {
              void resolveActiveQueueItemAction();
            }}
          />
        ) : null}

        <View style={styles.metaCard}>
          <Text style={styles.metaTitle}>Data layer</Text>
          <Text style={styles.metaBody}>
            Source: {source ?? 'none'}
            {'\n'}
            Loading: {isLoading ? 'yes' : 'no'}
            {'\n'}
            Submitting: {isSubmitting ? 'yes' : 'no'}
            {'\n'}
            Error: {error ?? 'none'}
          </Text>
        </View>
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
  metaCard: {
    marginTop: 16,
    backgroundColor: '#fffaf2',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d7c9ac',
  },
  metaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#352917',
    marginBottom: 8,
  },
  metaBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5b4c36',
  },
});
