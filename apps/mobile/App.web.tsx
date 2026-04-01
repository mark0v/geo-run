import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { SettlementHomeScreen } from "./src/features/settlement/SettlementHomeScreen";
import { useSettlementSnapshotWeb } from "./src/features/settlement/useSettlementSnapshotWeb";
import { getApiRuntimeInfo } from "./src/lib/config/runtime";

export default function App() {
  const runtime = getApiRuntimeInfo();
  const {
    snapshot,
    isLoading,
    isSubmitting,
    error,
    actionMessage,
    revealMoment,
    source,
    syncTodayActivityAction,
    startBuildAction,
    startClearTileAction,
    startUpgradeAction,
    resolveActiveQueueItemAction,
  } = useSettlementSnapshotWeb();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contentInner}>
          {snapshot ? (
            <SettlementHomeScreen
              snapshot={snapshot}
              isSubmitting={isSubmitting}
              actionMessage={actionMessage}
              revealMoment={revealMoment}
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
          ) : (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Preparing the frontier</Text>
              <Text style={styles.stateBody}>
                {isLoading ? "Loading settlement snapshot..." : "Waiting for settlement data."}
              </Text>
            </View>
          )}

          <View style={styles.runtimeBar}>
            <Text style={styles.runtimeBadge}>{runtime.mode === "live" ? "Live backend" : "Mock mode"}</Text>
            <Text style={styles.runtimeText}>Source: {source ?? "none"}</Text>
            <Text style={styles.runtimeText}>{isSubmitting ? "Submitting action..." : "Idle"}</Text>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Runtime error</Text>
              <Text style={styles.errorBody}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4efe5",
  },
  content: {
    padding: 14,
  },
  contentInner: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: 16,
  },
  stateCard: {
    backgroundColor: "#fffaf2",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#d7c9ac",
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#352917",
    marginBottom: 8,
  },
  stateBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5b4c36",
  },
  runtimeBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 6,
    justifyContent: "center",
  },
  runtimeBadge: {
    backgroundColor: "#efe3c7",
    color: "#4f3d26",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  runtimeText: {
    fontSize: 13,
    color: "#6c5a40",
  },
  errorCard: {
    marginTop: 16,
    backgroundColor: "#fff2eb",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dfb5a3",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b2e18",
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6a4a38",
  },
});
