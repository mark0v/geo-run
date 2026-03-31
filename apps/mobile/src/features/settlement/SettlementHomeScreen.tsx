import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BuildingType, SettlementSnapshot } from "../../lib/api/contracts";

interface SettlementHomeScreenProps {
  snapshot: SettlementSnapshot;
  isSubmitting: boolean;
  actionMessage: string | null;
  onSyncTodayActivity: () => void;
  onBuild: (tileKey: string, buildingType: Exclude<BuildingType, "camp">) => void;
  onClearTile: (tileKey: string) => void;
  onUpgrade: (buildingId: string) => void;
  onResolveQueueItem: () => void;
}

export function SettlementHomeScreen({
  snapshot,
  isSubmitting,
  actionMessage,
  onSyncTodayActivity,
  onBuild,
  onClearTile,
  onUpgrade,
  onResolveQueueItem,
}: SettlementHomeScreenProps) {
  const visibleTiles = snapshot.tiles.filter((tile) => tile.state !== "hidden");
  const activeQueueItem = snapshot.activeQueueItem;
  const workshop = snapshot.buildings.find((building) => building.buildingType === "workshop");
  const buildingByTileKey = new Map(snapshot.buildings.map((building) => [building.tileKey, building]));
  const openBuildTile = snapshot.tiles.find(
    (tile) =>
      tile.state === "cleared" &&
      !snapshot.buildings.some((building) => building.tileKey === tile.tileKey),
  );
  const blockedTile = snapshot.tiles.find((tile) => tile.state === "blocked");
  const settlementStage = getSettlementStage(snapshot.buildings.length, snapshot.settlement.milestoneLevel);
  const sortedVisibleTiles = [...visibleTiles].sort(compareTiles);
  const completedBuildings = snapshot.buildings.filter((building) => building.state === "complete").length;

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={styles.heroSky} />
        <View style={styles.heroGlow} />
        <Text style={styles.eyebrow}>Geo Run frontier</Text>
        <Text style={styles.title}>{snapshot.settlement.name}</Text>
        <Text style={styles.subtitle}>
          A quiet outpost growing from everyday movement, one evening decision at a time.
        </Text>
        <View style={styles.heroTagRow}>
          <View style={styles.heroTag}>
            <Text style={styles.heroTagLabel}>Stage</Text>
            <Text style={styles.heroTagValue}>{settlementStage}</Text>
          </View>
          <View style={styles.heroTag}>
            <Text style={styles.heroTagLabel}>Queue</Text>
            <Text style={styles.heroTagValue}>{activeQueueItem ? "1 active" : "Open"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Milestone</Text>
          <Text style={styles.progressValue}>Lv.{snapshot.settlement.milestoneLevel}</Text>
        </View>
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Visible land</Text>
          <Text style={styles.progressValue}>{visibleTiles.length}</Text>
        </View>
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Structures</Text>
          <Text style={styles.progressValue}>{completedBuildings}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily summary</Text>
        <Text style={styles.sectionLead}>
          Today's movement becomes the material that shapes tomorrow's silhouette.
        </Text>
        <View style={styles.balanceRow}>
          <View style={[styles.balanceCard, styles.balanceCardWarm]}>
            <Text style={styles.balanceLabel}>Supplies</Text>
            <Text style={styles.balanceValue}>{snapshot.settlement.balances.supplies}</Text>
            <Text style={styles.balanceHint}>Primary build resource from steps</Text>
          </View>
          <View style={[styles.balanceCard, styles.balanceCardStone]}>
            <Text style={styles.balanceLabel}>Stone</Text>
            <Text style={styles.balanceValue}>{snapshot.settlement.balances.stone}</Text>
            <Text style={styles.balanceHint}>Bonus depth from floors and climbs</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Frontier board</Text>
          <Text style={styles.sectionMeta}>{visibleTiles.length} discovered tiles</Text>
        </View>
        <Text style={styles.sectionLead}>
          Cleared land becomes buildable ground. Blocked edges mark the next push outward.
        </Text>
        <View style={styles.boardFrame}>
          <View style={styles.tileGrid}>
            {sortedVisibleTiles.map((tile) => {
              const building = buildingByTileKey.get(tile.tileKey);
              const tileStyle = getTileStyle(tile.state, tile.terrainType);
              const tileLabel = building ? formatBuildingLabel(building.buildingType, building.level) : formatTileState(tile.state);

              return (
                <View key={tile.id} style={[styles.tileCard, tileStyle.card]}>
                  <View style={styles.tileHeader}>
                    <Text style={[styles.tileKey, tileStyle.key]}>{tile.tileKey}</Text>
                    <Text style={[styles.tileTerrain, tileStyle.terrain]}>{formatTerrain(tile.terrainType)}</Text>
                  </View>
                  <View style={[styles.tileBadge, tileStyle.badge]}>
                    <Text style={[styles.tileBadgeLabel, tileStyle.badgeLabel]}>{tileLabel}</Text>
                  </View>
                  <Text style={[styles.tileState, tileStyle.state]}>
                    {building ? `Structure ${building.state}` : formatTileState(tile.state)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tonight's move</Text>
          <Text style={styles.sectionMeta}>{isSubmitting ? "Processing" : "Ready"}</Text>
        </View>
        <Text style={styles.sectionLead}>
          The session should take two or three minutes: collect the day, make one decision, leave
          with a visible next target.
        </Text>
        <ActionButton
          label="Sync today's activity"
          hint="Demo sync 8,400 steps and 6 floors into Supplies and Stone."
          disabled={isSubmitting}
          onPress={onSyncTodayActivity}
        />

        {activeQueueItem ? (
          <>
            <View style={styles.queueCard}>
              <Text style={styles.queueEyebrow}>Project in motion</Text>
              <Text style={styles.queueTitle}>{formatQueueAction(activeQueueItem.actionType)}</Text>
              <Text style={styles.queueMeta}>Resolves at {formatTimestamp(activeQueueItem.completeAt)}</Text>
            </View>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settlement ledger</Text>
          <Text style={styles.sectionMeta}>{snapshot.buildings.length} tracked structures</Text>
        </View>
        <Text style={styles.sectionLead}>
          A compact readout of what has been established and what the outpost remembers.
        </Text>
        {snapshot.buildings.map((building) => (
          <View key={building.id} style={styles.rowCard}>
            <Text style={styles.rowTitle}>
              {formatBuildingLabel(building.buildingType, building.level)}
            </Text>
            <Text style={styles.rowMeta}>{building.state}</Text>
          </View>
        ))}
        <View style={styles.ritualPanel}>
          <Text style={styles.ritualTitle}>Evening ritual</Text>
          <Text style={styles.paragraph}>1. Convert movement into materials.</Text>
          <Text style={styles.paragraph}>2. Start one build, upgrade, or tile clear.</Text>
          <Text style={styles.paragraph}>3. Leave with one visible frontier objective.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent milestones</Text>
          <Text style={styles.sectionMeta}>{snapshot.completedItems.length} recorded</Text>
        </View>
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

function compareTiles(left: SettlementSnapshot["tiles"][number], right: SettlementSnapshot["tiles"][number]): number {
  const [leftX, leftY] = left.tileKey.split(",").map(Number);
  const [rightX, rightY] = right.tileKey.split(",").map(Number);

  if (leftY === rightY) {
    return leftX - rightX;
  }

  return leftY - rightY;
}

function formatBuildingLabel(buildingType: BuildingType, level: number): string {
  return `${buildingType.replace("_", " ")} Lv.${level}`;
}

function formatQueueAction(actionType: string): string {
  return actionType.replace("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTileState(state: string): string {
  return state.replace("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTerrain(terrainType: string): string {
  return terrainType.replace("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function getSettlementStage(buildingCount: number, milestoneLevel: number): string {
  if (buildingCount <= 1) {
    return "Camp";
  }

  if (milestoneLevel <= 1) {
    return "Outpost";
  }

  return "Settlement";
}

function getTileStyle(state: string, terrainType: string) {
  const isHill = terrainType === "hill";

  if (state === "occupied") {
    return {
      card: styles.tileOccupied,
      key: styles.tileOccupiedKey,
      terrain: styles.tileOccupiedTerrain,
      badge: styles.tileOccupiedBadge,
      badgeLabel: styles.tileOccupiedBadgeLabel,
      state: styles.tileOccupiedState,
    };
  }

  if (state === "blocked") {
    return {
      card: isHill ? styles.tileBlockedHill : styles.tileBlocked,
      key: styles.tileBlockedKey,
      terrain: styles.tileBlockedTerrain,
      badge: styles.tileBlockedBadge,
      badgeLabel: styles.tileBlockedBadgeLabel,
      state: styles.tileBlockedState,
    };
  }

  return {
    card: styles.tileCleared,
    key: styles.tileClearedKey,
    terrain: styles.tileClearedTerrain,
    badge: styles.tileClearedBadge,
    badgeLabel: styles.tileClearedBadgeLabel,
    state: styles.tileClearedState,
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 16,
  },
  heroCard: {
    overflow: "hidden",
    backgroundColor: "#f4e6c4",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#d0ba8f",
  },
  heroSky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "#e4c684",
  },
  heroGlow: {
    position: "absolute",
    top: 22,
    right: 22,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#f7deb0",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#7a5328",
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: "#2d1e10",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5f4428",
    maxWidth: "90%",
  },
  heroTagRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  heroTag: {
    minWidth: 110,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 250, 242, 0.72)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7c39c",
  },
  heroTagLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#89663e",
    marginBottom: 4,
  },
  heroTagValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3a2917",
  },
  progressRow: {
    flexDirection: "row",
    gap: 10,
  },
  progressCard: {
    flex: 1,
    backgroundColor: "#fff8eb",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#deceb0",
  },
  progressLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#8a6f46",
    marginBottom: 6,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3a2916",
  },
  balanceRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  balanceCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  balanceCardWarm: {
    backgroundColor: "#efe2be",
    borderColor: "#d6bf92",
  },
  balanceCardStone: {
    backgroundColor: "#e4ddcf",
    borderColor: "#c7baa4",
  },
  balanceLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#7b6747",
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: "700",
    color: "#332416",
  },
  balanceHint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6d5a3e",
    marginTop: 10,
  },
  section: {
    backgroundColor: "#fffdf8",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e3d8c4",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#352917",
  },
  sectionMeta: {
    fontSize: 13,
    color: "#8a7351",
  },
  sectionLead: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6a573a",
    marginTop: 8,
    marginBottom: 14,
  },
  actionButton: {
    backgroundColor: "#f3ead5",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#cfbc99",
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
  queueCard: {
    backgroundColor: "#ecdfc2",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d0bb8e",
  },
  queueEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#8a663a",
    marginBottom: 6,
  },
  queueTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#392816",
    marginBottom: 4,
  },
  queueMeta: {
    fontSize: 14,
    color: "#6a5435",
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
    alignItems: "center",
    paddingVertical: 12,
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
  boardFrame: {
    backgroundColor: "#efe3c9",
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d7c39d",
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tileCard: {
    width: "48%",
    minHeight: 138,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
  },
  tileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  tileKey: {
    fontSize: 15,
    fontWeight: "700",
  },
  tileTerrain: {
    fontSize: 12,
    textAlign: "right",
    maxWidth: "50%",
  },
  tileBadge: {
    marginTop: 28,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tileBadgeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  tileOccupied: {
    backgroundColor: "#d7c497",
    borderColor: "#b4945e",
  },
  tileOccupiedKey: {
    color: "#3c2b16",
  },
  tileOccupiedTerrain: {
    color: "#6f5430",
  },
  tileOccupiedBadge: {
    backgroundColor: "#fff3d7",
  },
  tileOccupiedBadgeLabel: {
    color: "#5f431b",
  },
  tileOccupiedState: {
    color: "#5d4729",
  },
  tileCleared: {
    backgroundColor: "#dbe2c7",
    borderColor: "#b7c399",
  },
  tileClearedKey: {
    color: "#2d3b20",
  },
  tileClearedTerrain: {
    color: "#59694a",
  },
  tileClearedBadge: {
    backgroundColor: "#f4f8ea",
  },
  tileClearedBadgeLabel: {
    color: "#465832",
  },
  tileClearedState: {
    color: "#526245",
  },
  tileBlocked: {
    backgroundColor: "#dbd0c3",
    borderColor: "#b8a793",
  },
  tileBlockedHill: {
    backgroundColor: "#d6cabd",
    borderColor: "#aa9b87",
  },
  tileBlockedKey: {
    color: "#43352a",
  },
  tileBlockedTerrain: {
    color: "#716354",
  },
  tileBlockedBadge: {
    backgroundColor: "#f2ede7",
  },
  tileBlockedBadgeLabel: {
    color: "#5d4b39",
  },
  tileBlockedState: {
    color: "#6d5f51",
  },
  tileState: {
    fontSize: 14,
    marginTop: 22,
  },
  ritualPanel: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f7f1e6",
    borderWidth: 1,
    borderColor: "#e0d4c0",
  },
  ritualTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#433220",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5b4c36",
    marginBottom: 6,
  },
});
