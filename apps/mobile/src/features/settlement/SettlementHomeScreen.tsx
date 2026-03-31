import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BuildingType, SettlementSnapshot } from "../../lib/api/contracts";

interface SettlementHomeScreenProps {
  snapshot: SettlementSnapshot;
  isSubmitting: boolean;
  actionMessage: string | null;
  onBuild: (tileKey: string, buildingType: Exclude<BuildingType, "camp">) => void;
  onClearTile: (tileKey: string) => void;
  onUpgrade: (buildingId: string) => void;
  onResolveQueueItem: () => void;
}

export function SettlementHomeScreen({
  snapshot,
  isSubmitting,
  actionMessage,
  onBuild,
  onClearTile,
  onUpgrade,
  onResolveQueueItem,
}: SettlementHomeScreenProps) {
  const visibleTiles = snapshot.tiles.filter((tile) => tile.state !== "hidden");
  const activeQueueItem = snapshot.activeQueueItem;
  const workshop = snapshot.buildings.find((building) => building.buildingType === "workshop");
  const openBuildTile = snapshot.tiles.find(
    (tile) =>
      tile.state === "cleared" &&
      !snapshot.buildings.some((building) => building.tileKey === tile.tileKey),
  );
  const blockedTile = snapshot.tiles.find((tile) => tile.state === "blocked");

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Geo Run</Text>
        <Text style={styles.title}>{snapshot.settlement.name}</Text>
        <Text style={styles.subtitle}>Frontier settlement builder powered by real-world activity.</Text>
      </View>

      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Supplies</Text>
          <Text style={styles.balanceValue}>{snapshot.settlement.balances.supplies}</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Stone</Text>
          <Text style={styles.balanceValue}>{snapshot.settlement.balances.stone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tonight's move</Text>
        {activeQueueItem ? (
          <>
            <Text style={styles.paragraph}>
              Current project: {formatQueueAction(activeQueueItem.actionType)} until{" "}
              {formatTimestamp(activeQueueItem.completeAt)}
            </Text>
            <ActionButton
              label="Resolve current project"
              hint="Use the mock backend to complete the active queue item and reveal the next state."
              disabled={isSubmitting}
              onPress={onResolveQueueItem}
            />
          </>
        ) : (
          <>
            {openBuildTile ? (
              <ActionButton
                label="Build workshop"
                hint={`Spend 40 Supplies on tile ${openBuildTile.tileKey}.`}
                disabled={isSubmitting}
                onPress={() => onBuild(openBuildTile.tileKey, "workshop")}
              />
            ) : null}

            {blockedTile ? (
              <ActionButton
                label="Clear blocked tile"
                hint={`Spend 30 Supplies to open ${blockedTile.tileKey}.`}
                disabled={isSubmitting}
                onPress={() => onClearTile(blockedTile.tileKey)}
              />
            ) : null}

            {workshop?.state === "complete" ? (
              <ActionButton
                label="Upgrade workshop"
                hint={`Spend 60 Supplies and 4 Stone to upgrade ${workshop.id}.`}
                disabled={isSubmitting}
                onPress={() => onUpgrade(workshop.id)}
              />
            ) : null}

            {!openBuildTile && !blockedTile && workshop?.state !== "complete" ? (
              <Text style={styles.emptyState}>No settlement action is available yet.</Text>
            ) : null}
          </>
        )}

        {actionMessage ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current outpost</Text>
        {snapshot.buildings.map((building) => (
          <View key={building.id} style={styles.rowCard}>
            <Text style={styles.rowTitle}>
              {building.buildingType} Lv.{building.level}
            </Text>
            <Text style={styles.rowMeta}>{building.state}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visible terrain</Text>
        <View style={styles.tileGrid}>
          {visibleTiles.map((tile) => (
            <View key={tile.id} style={styles.tileCard}>
              <Text style={styles.tileKey}>{tile.tileKey}</Text>
              <Text style={styles.tileState}>{tile.state}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tonight's ritual</Text>
        <Text style={styles.paragraph}>1. Sync activity and review today's gains.</Text>
        <Text style={styles.paragraph}>2. Start one build, upgrade, or tile clear.</Text>
        <Text style={styles.paragraph}>3. Leave with one visible next objective.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent milestones</Text>
        {snapshot.completedItems.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.rowCard}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowMeta}>{formatTimestamp(item.completedAt)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
}

function ActionButton({ label, hint, disabled, onPress }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        disabled ? styles.actionButtonDisabled : null,
        pressed && !disabled ? styles.actionButtonPressed : null,
      ]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionHint}>{hint}</Text>
    </Pressable>
  );
}

function formatQueueAction(actionType: string): string {
  return actionType.replace("_", " ");
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "#fffaf2",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#d7c9ac",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#8a6a37",
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: "#2f2415",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5b4c36",
  },
  balanceRow: {
    flexDirection: "row",
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: "#efe5d0",
    borderRadius: 18,
    padding: 16,
  },
  balanceLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#816845",
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3b2d18",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e3d8c4",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#352917",
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: "#efe4cc",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#d2bea0",
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3d2f19",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  actionHint: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6b5637",
  },
  actionMessage: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#5d6d3f",
  },
  emptyState: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7d6b4f",
  },
  rowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d6c9b4",
  },
  rowTitle: {
    fontSize: 16,
    color: "#463724",
    textTransform: "capitalize",
  },
  rowMeta: {
    fontSize: 14,
    color: "#8a7351",
    textTransform: "capitalize",
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tileCard: {
    width: "47%",
    backgroundColor: "#f6efe3",
    borderRadius: 16,
    padding: 12,
  },
  tileKey: {
    fontSize: 16,
    fontWeight: "700",
    color: "#463724",
    marginBottom: 4,
  },
  tileState: {
    fontSize: 14,
    color: "#836b46",
    textTransform: "capitalize",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5b4c36",
    marginBottom: 6,
  },
});
