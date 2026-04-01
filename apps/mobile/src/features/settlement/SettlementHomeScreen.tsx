import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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

type ActionCardTone = "primary" | "secondary";

interface SettlementActionItem {
  key: string;
  label: string;
  hint: string;
  tone: ActionCardTone;
  onPress: () => void;
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
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
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
  const nextGoal = getNextGoal({
    activeQueueItem,
    blockedTileKey: blockedTile?.tileKey,
    hasWorkshop: Boolean(workshop),
    openBuildTileKey: openBuildTile?.tileKey,
  });
  const actionPlan = getActionPlan({
    activeQueueItem,
    blockedTile,
    openBuildTile,
    workshop,
    onBuild,
    onClearTile,
    onResolveQueueItem,
    onSyncTodayActivity,
    onUpgrade,
  });

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

      <View style={styles.goalCard}>
        <Text style={styles.goalEyebrow}>Next frontier goal</Text>
        <Text style={styles.goalTitle}>{nextGoal.title}</Text>
        <Text style={styles.goalBody}>{nextGoal.body}</Text>
      </View>

      <View style={[styles.topSplit, isWide ? styles.topSplitWide : null]}>
        <View style={[styles.topPrimary, isWide ? styles.topPrimaryWide : null]}>
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
        </View>

        <View style={[styles.topSecondary, isWide ? styles.topSecondaryWide : null]}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tonight's move</Text>
              <Text style={styles.sectionMeta}>{isSubmitting ? "Processing" : "Ready"}</Text>
            </View>
            <Text style={styles.sectionLead}>
              The session should take two or three minutes: collect the day, make one decision,
              leave with a visible next target.
            </Text>

            {activeQueueItem ? (
              <View style={styles.queueCard}>
                <Text style={styles.queueEyebrow}>Project in motion</Text>
                <Text style={styles.queueTitle}>{formatQueueAction(activeQueueItem.actionType)}</Text>
                <Text style={styles.queueMeta}>
                  Resolves at {formatTimestamp(activeQueueItem.completeAt)}
                </Text>
              </View>
            ) : null}

            {actionPlan.primaryAction ? (
              <View style={styles.primaryActionPanel}>
                <View style={styles.primaryActionHeader}>
                  <Text style={styles.primaryActionEyebrow}>Recommended move</Text>
                  <Text style={styles.primaryActionMeta}>
                    {activeQueueItem ? "Finish first" : "Best next step"}
                  </Text>
                </View>
                <ActionButton
                  label={actionPlan.primaryAction.label}
                  hint={actionPlan.primaryAction.hint}
                  disabled={isSubmitting}
                  onPress={actionPlan.primaryAction.onPress}
                  tone={actionPlan.primaryAction.tone}
                />
              </View>
            ) : (
              <Text style={styles.emptyState}>No settlement action is available yet.</Text>
            )}

            {actionPlan.secondaryActions.length > 0 ? (
              <View style={styles.secondaryActionsPanel}>
                <Text style={styles.secondaryActionsTitle}>Other options tonight</Text>
                {actionPlan.secondaryActions.map((action) => (
                  <ActionButton
                    key={action.key}
                    label={action.label}
                    hint={action.hint}
                    disabled={isSubmitting}
                    onPress={action.onPress}
                    tone={action.tone}
                  />
                ))}
              </View>
            ) : null}

            {actionMessage ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}
          </View>
        </View>
      </View>

      <View style={[styles.lowerSplit, isWide ? styles.lowerSplitWide : null]}>
        <View style={[styles.mainColumn, isWide ? styles.mainColumnWide : null]}>
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
                  const tileLabel = building
                    ? formatBuildingLabel(building.buildingType, building.level)
                    : formatTileState(tile.state);
                  const tileSummary = getTileSummary(tile.state, tile.terrainType, building?.buildingType);

                  return (
                    <View key={tile.id} style={[styles.tileCard, tileStyle.card]}>
                      <View style={styles.tileHeader}>
                        <View>
                          <Text style={[styles.tileTerrain, tileStyle.terrain]}>
                            {formatTerrain(tile.terrainType)}
                          </Text>
                          <Text style={[styles.tileKey, tileStyle.key]}>Tile {tile.tileKey}</Text>
                        </View>
                        <View style={[styles.tileStatusPill, tileStyle.badge]}>
                          <Text style={[styles.tileStatusPillLabel, tileStyle.badgeLabel]}>
                            {tileLabel}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.sceneFrame, tileStyle.sceneFrame]}>
                        <View style={[styles.sceneSky, tileStyle.sky]} />
                        <View style={[styles.sceneBackHorizon, tileStyle.backHorizon]} />
                        <View style={[styles.sceneGround, tileStyle.ground]}>
                          <View style={[styles.scenePath, tileStyle.path]} />
                          {renderTerrainDecoration(tile.terrainType, tile.state)}
                          {renderBuildingPresence(building?.buildingType)}
                        </View>
                      </View>

                      <Text style={[styles.tileState, tileStyle.state]}>{tileSummary}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.sideColumn, isWide ? styles.sideColumnWide : null]}>
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
            {snapshot.completedItems.length === 0 ? (
              <Text style={styles.emptyState}>
                Complete your next project to start writing the outpost history.
              </Text>
            ) : null}
            {snapshot.completedItems.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.rowCard}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>{formatTimestamp(item.completedAt)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
  tone: ActionCardTone;
}

function ActionButton({ label, hint, disabled, onPress, tone }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        tone === "primary" ? styles.actionButtonPrimary : styles.actionButtonSecondary,
        disabled ? styles.actionButtonDisabled : null,
        pressed && !disabled ? styles.actionButtonPressed : null,
      ]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionHint}>{hint}</Text>
    </Pressable>
  );
}

function getActionPlan({
  activeQueueItem,
  blockedTile,
  openBuildTile,
  workshop,
  onBuild,
  onClearTile,
  onResolveQueueItem,
  onSyncTodayActivity,
  onUpgrade,
}: {
  activeQueueItem: SettlementSnapshot["activeQueueItem"];
  blockedTile?: SettlementSnapshot["tiles"][number];
  openBuildTile?: SettlementSnapshot["tiles"][number];
  workshop?: SettlementSnapshot["buildings"][number];
  onBuild: SettlementHomeScreenProps["onBuild"];
  onClearTile: SettlementHomeScreenProps["onClearTile"];
  onResolveQueueItem: SettlementHomeScreenProps["onResolveQueueItem"];
  onSyncTodayActivity: SettlementHomeScreenProps["onSyncTodayActivity"];
  onUpgrade: SettlementHomeScreenProps["onUpgrade"];
}) {
  const actions: SettlementActionItem[] = [];

  if (activeQueueItem) {
    actions.push({
      key: "resolve",
      label: "Resolve current project",
      hint: "Finish the active queue item and reveal the next visible change in the outpost.",
      tone: "primary",
      onPress: onResolveQueueItem,
    });
  }

  if (!activeQueueItem && openBuildTile) {
    actions.push({
      key: "build-workshop",
      label: "Build workshop",
      hint: `Spend 40 Supplies on tile ${openBuildTile.tileKey} to turn the camp into a working outpost.`,
      tone: "primary",
      onPress: () => onBuild(openBuildTile.tileKey, "workshop"),
    });
  }

  if (!activeQueueItem && blockedTile) {
    actions.push({
      key: "clear-tile",
      label: "Clear blocked tile",
      hint: `Spend 30 Supplies to open ${blockedTile.tileKey} and widen the frontier board.`,
      tone: actions.length === 0 ? "primary" : "secondary",
      onPress: () => onClearTile(blockedTile.tileKey),
    });
  }

  if (!activeQueueItem && workshop?.state === "complete") {
    actions.push({
      key: "upgrade-workshop",
      label: "Upgrade workshop",
      hint: `Spend 60 Supplies and 4 Stone to upgrade ${workshop.id} and deepen the settlement silhouette.`,
      tone: actions.length === 0 ? "primary" : "secondary",
      onPress: () => onUpgrade(workshop.id),
    });
  }

  actions.push({
    key: "collect-activity",
    label: "Collect today's movement",
    hint: "Convert today's walk into Supplies and Stone before you close the evening loop.",
    tone: actions.length === 0 ? "primary" : "secondary",
    onPress: onSyncTodayActivity,
  });

  const [primaryAction, ...secondaryActions] = actions;

  return {
    primaryAction,
    secondaryActions,
  };
}

function renderTerrainDecoration(terrainType: string, tileState: string) {
  if (tileState === "blocked") {
    return (
      <View style={styles.terrainDecorationRow}>
        <View style={styles.rockLarge} />
        <View style={styles.rockMedium} />
        <View style={styles.rockSmall} />
      </View>
    );
  }

  if (terrainType === "forest-edge") {
    return (
      <View style={styles.terrainDecorationRow}>
        <View style={styles.treeCluster}>
          <View style={styles.treeCanopyTall} />
          <View style={styles.treeCanopyWide} />
        </View>
        <View style={styles.treeCluster}>
          <View style={styles.treeCanopyWide} />
          <View style={styles.treeCanopyTall} />
        </View>
      </View>
    );
  }

  if (terrainType === "hill") {
    return (
      <View style={styles.terrainDecorationRow}>
        <View style={styles.hillRiseLarge} />
        <View style={styles.hillRiseSmall} />
      </View>
    );
  }

  return (
    <View style={styles.terrainDecorationRow}>
      <View style={styles.grassBladeTall} />
      <View style={styles.grassBladeShort} />
      <View style={styles.grassBladeTall} />
    </View>
  );
}

function renderBuildingPresence(buildingType?: BuildingType) {
  if (!buildingType) {
    return null;
  }

  if (buildingType === "camp") {
    return (
      <View style={styles.structureBase}>
        <View style={styles.campTentLeft} />
        <View style={styles.campTentRight} />
        <View style={styles.campFireGlow} />
      </View>
    );
  }

  if (buildingType === "workshop") {
    return (
      <View style={styles.structureBase}>
        <View style={styles.workshopBody}>
          <View style={styles.workshopRoof} />
          <View style={styles.workshopDoor} />
          <View style={styles.workshopWindow} />
          <View style={styles.workshopChimney} />
        </View>
      </View>
    );
  }

  if (buildingType === "hut") {
    return (
      <View style={styles.structureBase}>
        <View style={styles.hutBody}>
          <View style={styles.hutRoof} />
        </View>
      </View>
    );
  }

  if (buildingType === "well") {
    return (
      <View style={styles.structureBase}>
        <View style={styles.wellBody}>
          <View style={styles.wellFrameLeft} />
          <View style={styles.wellFrameRight} />
          <View style={styles.wellRoof} />
        </View>
      </View>
    );
  }

  if (buildingType === "storehouse") {
    return (
      <View style={styles.structureBase}>
        <View style={styles.storehouseBody}>
          <View style={styles.storehouseRoof} />
        </View>
      </View>
    );
  }

  if (buildingType === "watchtower") {
    return (
      <View style={styles.structureBase}>
        <View style={styles.watchtowerBody}>
          <View style={styles.watchtowerTop} />
        </View>
      </View>
    );
  }

  return null;
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

function getNextGoal({
  activeQueueItem,
  blockedTileKey,
  hasWorkshop,
  openBuildTileKey,
}: {
  activeQueueItem: SettlementSnapshot["activeQueueItem"];
  blockedTileKey?: string;
  hasWorkshop: boolean;
  openBuildTileKey?: string;
}) {
  if (activeQueueItem) {
    return {
      title: "Finish the current project",
      body: `${formatQueueAction(activeQueueItem.actionType)} is underway. Resolve it to reveal the next state of the outpost.`,
    };
  }

  if (!hasWorkshop && openBuildTileKey) {
    return {
      title: "Anchor the outpost with a workshop",
      body: `Tile ${openBuildTileKey} is ready. A workshop is the first real signal that this place can grow beyond a camp.`,
    };
  }

  if (blockedTileKey) {
    return {
      title: "Push into the blocked frontier",
      body: `Clear tile ${blockedTileKey} to claim more ground and widen the silhouette of the settlement.`,
    };
  }

  return {
    title: "Build momentum for the next unlock",
    body: "The outpost is stable for tonight. More movement tomorrow will turn into the next visible milestone.",
  };
}

function getTileSummary(
  tileState: SettlementSnapshot["tiles"][number]["state"],
  terrainType: string,
  buildingType?: BuildingType,
): string {
  if (buildingType === "camp") {
    return "The first campfire holds the settlement together.";
  }

  if (buildingType === "workshop") {
    return "A real working structure now anchors the outpost.";
  }

  if (tileState === "blocked") {
    return `This ${formatTerrain(terrainType).toLowerCase()} edge still needs clearing.`;
  }

  return `${formatTerrain(terrainType)} ground is ready for the next structure.`;
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
      sky: styles.tileOccupiedSky,
      backHorizon: styles.tileOccupiedBackHorizon,
      ground: styles.tileOccupiedGround,
      path: styles.tileOccupiedPath,
      sceneFrame: styles.tileOccupiedSceneFrame,
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
      sky: styles.tileBlockedSky,
      backHorizon: styles.tileBlockedBackHorizon,
      ground: styles.tileBlockedGround,
      path: styles.tileBlockedPath,
      sceneFrame: styles.tileBlockedSceneFrame,
    };
  }

  return {
    card: styles.tileCleared,
    key: styles.tileClearedKey,
    terrain: styles.tileClearedTerrain,
    badge: styles.tileClearedBadge,
    badgeLabel: styles.tileClearedBadgeLabel,
    state: styles.tileClearedState,
    sky: styles.tileClearedSky,
    backHorizon: styles.tileClearedBackHorizon,
    ground: styles.tileClearedGround,
    path: styles.tileClearedPath,
    sceneFrame: styles.tileClearedSceneFrame,
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 16,
  },
  goalCard: {
    backgroundColor: "#fbf2de",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ddc79d",
  },
  goalEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#8b683f",
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#392715",
    marginBottom: 6,
  },
  goalBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6a5638",
    maxWidth: 760,
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
  topSplit: {
    gap: 16,
  },
  topSplitWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  topPrimary: {
    gap: 16,
  },
  topPrimaryWide: {
    flex: 1,
  },
  topSecondary: {
    gap: 16,
  },
  topSecondaryWide: {
    width: 380,
  },
  lowerSplit: {
    gap: 16,
  },
  lowerSplitWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  mainColumn: {
    gap: 16,
  },
  mainColumnWide: {
    flex: 1.6,
  },
  sideColumn: {
    gap: 16,
  },
  sideColumnWide: {
    flex: 1,
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  actionButtonPrimary: {
    backgroundColor: "#f0dfb7",
    borderColor: "#c8ac72",
    paddingVertical: 18,
    shadowColor: "#8f6a2a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  actionButtonSecondary: {
    backgroundColor: "#f7f0df",
    borderColor: "#d7c5a1",
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
  primaryActionPanel: {
    marginTop: 2,
    marginBottom: 10,
  },
  primaryActionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  primaryActionEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#8a663a",
  },
  primaryActionMeta: {
    fontSize: 12,
    color: "#887151",
  },
  secondaryActionsPanel: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e2d5bc",
  },
  secondaryActionsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6d5738",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.9,
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
    width: "49%",
    minHeight: 232,
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
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  tileTerrain: {
    fontSize: 14,
    fontWeight: "700",
  },
  tileStatusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tileStatusPillLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  sceneFrame: {
    marginTop: 14,
    height: 116,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  sceneSky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 54,
  },
  sceneBackHorizon: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 34,
    height: 32,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  sceneGround: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 52,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  scenePath: {
    position: "absolute",
    left: 28,
    right: 32,
    bottom: 10,
    height: 10,
    borderRadius: 999,
  },
  terrainDecorationRow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  grassBladeTall: {
    width: 10,
    height: 22,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "#6f8d51",
  },
  grassBladeShort: {
    width: 10,
    height: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "#809a61",
  },
  rockLarge: {
    width: 26,
    height: 20,
    borderRadius: 12,
    backgroundColor: "#8d7f73",
  },
  rockMedium: {
    width: 18,
    height: 14,
    borderRadius: 10,
    backgroundColor: "#9e9081",
  },
  rockSmall: {
    width: 12,
    height: 10,
    borderRadius: 8,
    backgroundColor: "#b4a89b",
  },
  hillRiseLarge: {
    width: 56,
    height: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#8fa36d",
  },
  hillRiseSmall: {
    width: 42,
    height: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#a3b67f",
  },
  treeCluster: {
    alignItems: "center",
  },
  treeCanopyTall: {
    width: 22,
    height: 30,
    borderRadius: 16,
    backgroundColor: "#597243",
    marginBottom: -6,
  },
  treeCanopyWide: {
    width: 30,
    height: 22,
    borderRadius: 16,
    backgroundColor: "#6a8451",
  },
  structureBase: {
    position: "absolute",
    right: 18,
    bottom: 8,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  campTentLeft: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 22,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#8b5f37",
    position: "absolute",
    bottom: 10,
    left: -14,
  },
  campTentRight: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#a17145",
    position: "absolute",
    bottom: 10,
    left: 6,
  },
  campFireGlow: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#f2b85c",
    position: "absolute",
    bottom: 8,
    left: 0,
  },
  workshopBody: {
    width: 48,
    height: 30,
    backgroundColor: "#7b5834",
    borderRadius: 6,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  workshopRoof: {
    position: "absolute",
    top: -10,
    width: 56,
    height: 14,
    backgroundColor: "#a97845",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  workshopDoor: {
    width: 12,
    height: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: "#58391f",
  },
  workshopWindow: {
    position: "absolute",
    left: 8,
    bottom: 10,
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#e7c97d",
  },
  workshopChimney: {
    position: "absolute",
    top: -18,
    right: 6,
    width: 8,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#654526",
  },
  hutBody: {
    width: 42,
    height: 26,
    backgroundColor: "#8a6741",
    borderRadius: 6,
  },
  hutRoof: {
    position: "absolute",
    top: -9,
    left: -3,
    width: 48,
    height: 12,
    backgroundColor: "#a77b4d",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  wellBody: {
    width: 28,
    height: 18,
    backgroundColor: "#8e7758",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  wellFrameLeft: {
    position: "absolute",
    left: 4,
    top: -14,
    width: 4,
    height: 18,
    backgroundColor: "#6e5638",
    borderRadius: 2,
  },
  wellFrameRight: {
    position: "absolute",
    right: 4,
    top: -14,
    width: 4,
    height: 18,
    backgroundColor: "#6e5638",
    borderRadius: 2,
  },
  wellRoof: {
    position: "absolute",
    top: -18,
    width: 30,
    height: 8,
    backgroundColor: "#9c7346",
    borderRadius: 6,
  },
  storehouseBody: {
    width: 50,
    height: 28,
    backgroundColor: "#7d5a34",
    borderRadius: 6,
  },
  storehouseRoof: {
    position: "absolute",
    top: -10,
    left: -3,
    width: 56,
    height: 14,
    backgroundColor: "#a97845",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  watchtowerBody: {
    width: 10,
    height: 40,
    backgroundColor: "#6d5031",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  watchtowerTop: {
    marginTop: -4,
    width: 28,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#9f7648",
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
  tileOccupiedSky: {
    backgroundColor: "#f1d594",
  },
  tileOccupiedBackHorizon: {
    backgroundColor: "#c2b177",
  },
  tileOccupiedGround: {
    backgroundColor: "#b99658",
  },
  tileOccupiedPath: {
    backgroundColor: "#d6be87",
  },
  tileOccupiedSceneFrame: {
    borderColor: "#b4945e",
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
  tileClearedSky: {
    backgroundColor: "#dce7c3",
  },
  tileClearedBackHorizon: {
    backgroundColor: "#b7ca98",
  },
  tileClearedGround: {
    backgroundColor: "#9eb57b",
  },
  tileClearedPath: {
    backgroundColor: "#cfdfb9",
  },
  tileClearedSceneFrame: {
    borderColor: "#b7c399",
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
  tileBlockedSky: {
    backgroundColor: "#ddd4cb",
  },
  tileBlockedBackHorizon: {
    backgroundColor: "#bfb3a5",
  },
  tileBlockedGround: {
    backgroundColor: "#9f8e7f",
  },
  tileBlockedPath: {
    backgroundColor: "#d0c4b7",
  },
  tileBlockedSceneFrame: {
    borderColor: "#aa9b87",
  },
  tileBlockedState: {
    color: "#6d5f51",
  },
  tileState: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
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
