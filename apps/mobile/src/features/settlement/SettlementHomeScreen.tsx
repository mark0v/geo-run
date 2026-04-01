import React, { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { BuildingType, SettlementBuilding, SettlementSnapshot } from "../../lib/api/contracts";
import type { SettlementRevealMoment } from "./reveal";

interface SettlementHomeScreenProps {
  snapshot: SettlementSnapshot;
  isSubmitting: boolean;
  actionMessage: string | null;
  revealMoment: SettlementRevealMoment | null;
  onSyncTodayActivity: () => void;
  onBuild: (tileKey: string, buildingType: Exclude<BuildingType, "camp">) => void;
  onClearTile: (tileKey: string) => void;
  onUpgrade: (buildingId: string) => void;
  onResolveQueueItem: () => void;
}

type ActionCardTone = "primary" | "secondary";
type SheetKind = "territory" | "record" | null;

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
  revealMoment,
  onSyncTodayActivity,
  onBuild,
  onClearTile,
  onUpgrade,
  onResolveQueueItem,
}: SettlementHomeScreenProps) {
  const [activeSheet, setActiveSheet] = useState<SheetKind>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 560;
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
  const progressTarget = 6;
  const progressValue = Math.max(1, Math.min(progressTarget, completedBuildings));
  const progressPercent = Math.max(16, (progressValue / progressTarget) * 100);
  const stageBadge = `Lv.${snapshot.settlement.milestoneLevel}`;
  const nextGoal = getNextGoal({
    activeQueueItem,
    blockedTileKey: blockedTile?.tileKey,
    hasWorkshop: Boolean(workshop),
    openBuildTileKey: openBuildTile?.tileKey,
  });
  const sceneStatus = getSceneStatus({
    activeQueueItem,
    nextGoal,
    revealMoment,
  });
  const hasWestFog = snapshot.tiles.some(
    (tile) => (tile.state === "hidden" || tile.state === "blocked") && getTileX(tile.tileKey) <= 0,
  );
  const hasEastFog = snapshot.tiles.some(
    (tile) => (tile.state === "hidden" || tile.state === "blocked") && getTileX(tile.tileKey) > 0,
  );
  const latestMilestone = snapshot.completedItems[0] ?? null;
  const shouldShowEventPanel = Boolean(revealMoment || activeQueueItem);
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
      <View style={styles.mobileShell}>
        <View style={styles.sceneCardModern}>
          <View style={[styles.sceneHeaderModern, isWide ? styles.sceneHeaderModernWide : null]}>
            <View style={styles.sceneHeaderCopy}>
              <Text style={styles.sceneEyebrow}>Settlement</Text>
              <Text style={styles.sceneTitleModern}>{snapshot.settlement.name}</Text>
              <Text style={styles.sceneSubtitleModern}>
                A quiet outpost growing from everyday movement.
              </Text>
            </View>

            <View style={styles.resourceChipRow}>
              <View style={[styles.resourceChip, styles.resourceChipWarm]}>
                <Text style={styles.resourceChipValue}>{snapshot.settlement.balances.supplies}</Text>
                <Text style={styles.resourceChipLabel}>Supplies</Text>
              </View>
              <View style={[styles.resourceChip, styles.resourceChipStone]}>
                <Text style={styles.resourceChipValue}>{snapshot.settlement.balances.stone}</Text>
                <Text style={styles.resourceChipLabel}>Stone</Text>
              </View>
            </View>
          </View>

          <View style={styles.statusChipRow}>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipLabel}>Stage</Text>
              <Text style={styles.statusChipValue}>{settlementStage}</Text>
            </View>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipLabel}>Milestone</Text>
              <Text style={styles.statusChipValue}>{stageBadge}</Text>
            </View>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipLabel}>Queue</Text>
              <Text style={styles.statusChipValue}>{activeQueueItem ? "Active" : "Open"}</Text>
            </View>
          </View>

          <View style={styles.sceneCanvasModern}>
            <View style={styles.sceneSkyModern} />
            <View style={styles.sceneSunModern} />
            <View style={styles.sceneRidgeLeft} />
            <View style={styles.sceneRidgeRight} />
            <View style={styles.sceneGroundModern} />
            <View style={styles.scenePathModern} />
            {hasWestFog ? <View style={[styles.sceneFog, styles.sceneFogLeft]} /> : null}
            {hasEastFog ? <View style={[styles.sceneFog, styles.sceneFogRight]} /> : null}
            {snapshot.buildings.map((building) => renderSceneStructure(building, revealMoment))}
            <View style={styles.sceneBadgeModern}>
              <Text style={styles.sceneBadgeModernLabel}>{stageBadge}</Text>
            </View>
            <View style={styles.sceneFooterModern}>
              <Text style={styles.sceneFooterTitle}>{sceneStatus.title}</Text>
              <Text style={styles.sceneFooterBody}>{sceneStatus.body}</Text>
            </View>
          </View>

          <View style={styles.progressStripModern}>
            <View style={styles.progressStripHeader}>
              <Text style={styles.progressStripTitle}>{getProgressLabel(completedBuildings)}</Text>
              <Text style={styles.progressStripFraction}>
                {progressValue} / {progressTarget}
              </Text>
            </View>
            <View style={styles.progressTrackModern}>
              <View style={[styles.progressFillModern, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {shouldShowEventPanel ? (
          <View style={styles.eventPanelModern}>
            <Text style={styles.eventEyebrow}>{sceneStatus.eyebrow}</Text>
            <Text style={styles.eventTitle}>{sceneStatus.title}</Text>
            <Text style={styles.eventBody}>{sceneStatus.body}</Text>
          </View>
        ) : null}

        <View style={styles.actionSectionModern}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={styles.sectionTitleCompact}>Tonight</Text>
            <Text style={styles.sectionMetaCompact}>{isSubmitting ? "Processing" : "Ready"}</Text>
          </View>

          {actionPlan.primaryAction ? (
            <ActionButton
              label={actionPlan.primaryAction.label}
              hint={actionPlan.primaryAction.hint}
              disabled={isSubmitting}
              onPress={actionPlan.primaryAction.onPress}
              tone="primary"
            />
          ) : (
            <Text style={styles.emptyState}>No settlement action is available yet.</Text>
          )}

          {actionPlan.secondaryActions.length > 0 ? (
            <View style={styles.secondaryChipGroup}>
              {actionPlan.secondaryActions.map((action) => (
                <SecondaryActionButton
                  key={action.key}
                  label={action.label}
                  hint={compressActionHint(action.hint)}
                  disabled={isSubmitting}
                  onPress={action.onPress}
                />
              ))}
            </View>
          ) : null}

          {actionMessage ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}
        </View>

        <View style={styles.homeDockRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet("territory")}
            style={({ pressed }) => [styles.dockCard, pressed ? styles.dockCardPressed : null]}
          >
            <Text style={styles.dockEyebrow}>Territory</Text>
            <Text style={styles.dockTitle}>{visibleTiles.length} visible tiles</Text>
            <View style={styles.dockMiniGrid}>
              {sortedVisibleTiles.slice(0, 3).map((tile) => {
                const building = buildingByTileKey.get(tile.tileKey);
                const compactTile = getCompactTileStyle(tile.state);
                const compactLabel = building
                  ? formatBuildingNameCompact(building.buildingType, building.level)
                  : formatCompactTileState(tile.state);

                return (
                  <View
                    key={tile.id}
                    style={[
                      styles.dockMiniTile,
                      compactTile.card,
                      revealMoment?.tileKey === tile.tileKey ? styles.territoryTileReveal : null,
                    ]}
                  >
                    <Text style={[styles.dockMiniTileLabel, compactTile.label]}>{compactLabel}</Text>
                  </View>
                );
              })}
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet("record")}
            style={({ pressed }) => [styles.dockCard, pressed ? styles.dockCardPressed : null]}
          >
            <Text style={styles.dockEyebrow}>Record</Text>
            <Text style={styles.dockTitle}>
              {latestMilestone ? latestMilestone.title : `${snapshot.buildings.length} structures standing`}
            </Text>
            <Text style={styles.dockBody}>
              {latestMilestone
                ? formatTimestamp(latestMilestone.completedAt)
                : `${snapshot.completedItems.length} milestones recorded`}
            </Text>
          </Pressable>
        </View>
      </View>

      {activeSheet ? (
        <View style={styles.sheetOverlay}>
          <Pressable
            accessibilityRole="button"
            style={styles.sheetBackdrop}
            onPress={() => setActiveSheet(null)}
          />
          <View style={styles.sheetCard}>
            <View style={styles.sheetGrabber} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>
                  {activeSheet === "territory" ? "Territory" : "Settlement record"}
                </Text>
                <Text style={styles.sheetTitle}>
                  {activeSheet === "territory"
                    ? "Frontier details"
                    : "What the outpost remembers"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveSheet(null)}
                style={({ pressed }) => [
                  styles.sheetCloseButton,
                  pressed ? styles.dockCardPressed : null,
                ]}
              >
                <Text style={styles.sheetCloseLabel}>Close</Text>
              </Pressable>
            </View>

            {activeSheet === "territory" ? (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetLead}>
                  Cleared land is ready for building. Blocked edges mark the next expansion target.
                </Text>
                <View style={styles.sheetTerritoryGrid}>
                  {sortedVisibleTiles.map((tile) => {
                    const building = buildingByTileKey.get(tile.tileKey);
                    const compactTile = getCompactTileStyle(tile.state);
                    const compactLabel = building
                      ? formatBuildingNameCompact(building.buildingType, building.level)
                      : formatCompactTileState(tile.state);

                    return (
                      <View
                        key={tile.id}
                        style={[
                          styles.sheetTerritoryTile,
                          compactTile.card,
                          revealMoment?.tileKey === tile.tileKey ? styles.territoryTileReveal : null,
                        ]}
                      >
                        <Text style={[styles.sheetTerritoryLabel, compactTile.label]}>{compactLabel}</Text>
                        <Text style={[styles.sheetTerritoryMeta, compactTile.meta]}>
                          {formatTerrain(tile.terrainType)}
                        </Text>
                        <Text style={[styles.sheetTerritoryKey, compactTile.meta]}>{tile.tileKey}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {activeSheet === "record" ? (
              <View style={styles.sheetSection}>
                <View style={styles.recordSection}>
                  <Text style={styles.recordSectionTitle}>Built so far</Text>
                  <View style={styles.recordPillWrap}>
                    {snapshot.buildings.map((building) => (
                      <View key={building.id} style={styles.recordPill}>
                        <Text style={styles.recordPillLabel}>
                          {formatBuildingNameCompact(building.buildingType, building.level)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.recordSection}>
                  <Text style={styles.recordSectionTitle}>Recent milestones</Text>
                  {snapshot.completedItems.length === 0 ? (
                    <Text style={styles.emptyState}>Complete a project to start the outpost history.</Text>
                  ) : (
                    snapshot.completedItems.slice(0, 5).map((item) => (
                      <View key={item.id} style={styles.recordRow}>
                        <Text style={styles.recordRowTitle}>{item.title}</Text>
                        <Text style={styles.recordRowMeta}>{formatTimestamp(item.completedAt)}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
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

interface SecondaryActionButtonProps {
  label: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
}

function SecondaryActionButton({
  label,
  hint,
  disabled,
  onPress,
}: SecondaryActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryActionChip,
        disabled ? styles.actionButtonDisabled : null,
        pressed && !disabled ? styles.actionButtonPressed : null,
      ]}
    >
      <Text style={styles.secondaryActionLabel}>{label}</Text>
      <Text style={styles.secondaryActionHint}>{hint}</Text>
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

function getSceneStatus({
  activeQueueItem,
  nextGoal,
  revealMoment,
}: {
  activeQueueItem: SettlementSnapshot["activeQueueItem"];
  nextGoal: ReturnType<typeof getNextGoal>;
  revealMoment: SettlementRevealMoment | null;
}) {
  if (revealMoment) {
    return {
      eyebrow: "Just completed",
      title: revealMoment.title,
      body: revealMoment.body,
    };
  }

  if (activeQueueItem) {
    return {
      eyebrow: "Project in motion",
      title: formatQueueAction(activeQueueItem.actionType),
      body: `Ready at ${formatTimestamp(activeQueueItem.completeAt)}. The next visible change is already underway.`,
    };
  }

  return {
    eyebrow: "Next frontier goal",
    title: nextGoal.title,
    body: nextGoal.body,
  };
}

function renderSceneStructure(
  building: SettlementBuilding,
  revealMoment: SettlementRevealMoment | null,
) {
  const positionStyle = getSceneStructurePosition(building.buildingType);
  const isHighlighted =
    revealMoment?.buildingId === building.id || revealMoment?.tileKey === building.tileKey;

  return (
    <View
      key={building.id}
      style={[
        styles.sceneStructureBase,
        positionStyle,
        building.state !== "complete" ? styles.sceneStructureBuilding : null,
        isHighlighted ? styles.sceneStructureReveal : null,
      ]}
    >
      {building.buildingType === "camp" ? (
        <>
          <View style={styles.sceneTentLeft} />
          <View style={styles.sceneTentRight} />
          <View style={styles.sceneCampfire} />
        </>
      ) : null}

      {building.buildingType === "workshop" ? (
        <>
          <View style={styles.sceneWorkshopRoof} />
          <View style={styles.sceneWorkshopBody} />
          <View style={styles.sceneWorkshopDoor} />
          <View style={styles.sceneWorkshopSmokeOne} />
          <View style={styles.sceneWorkshopSmokeTwo} />
        </>
      ) : null}

      {building.buildingType === "hut" ? (
        <>
          <View style={styles.sceneHutRoof} />
          <View style={styles.sceneHutBody} />
        </>
      ) : null}

      {building.buildingType === "well" ? (
        <>
          <View style={styles.sceneWellRoof} />
          <View style={styles.sceneWellLegLeft} />
          <View style={styles.sceneWellLegRight} />
          <View style={styles.sceneWellBase} />
        </>
      ) : null}

      {building.buildingType === "storehouse" ? (
        <>
          <View style={styles.sceneStorehouseRoof} />
          <View style={styles.sceneStorehouseBody} />
        </>
      ) : null}

      {building.buildingType === "watchtower" ? (
        <>
          <View style={styles.sceneTowerTop} />
          <View style={styles.sceneTowerBody} />
        </>
      ) : null}
    </View>
  );
}

function getSceneStructurePosition(buildingType: BuildingType) {
  switch (buildingType) {
    case "camp":
      return styles.sceneStructureCamp;
    case "workshop":
      return styles.sceneStructureWorkshop;
    case "hut":
      return styles.sceneStructureHut;
    case "well":
      return styles.sceneStructureWell;
    case "storehouse":
      return styles.sceneStructureStorehouse;
    case "watchtower":
      return styles.sceneStructureTower;
    default:
      return styles.sceneStructureCamp;
  }
}

function getProgressLabel(completedBuildings: number): string {
  if (completedBuildings <= 1) {
    return "Camp established";
  }

  if (completedBuildings <= 3) {
    return "Settlement growing";
  }

  return "Outpost taking shape";
}

function getTileX(tileKey: string): number {
  return Number(tileKey.split(",")[0] ?? 0);
}

function getCompactTileStyle(state: SettlementSnapshot["tiles"][number]["state"]) {
  if (state === "occupied") {
    return {
      card: styles.territoryTileOccupied,
      label: styles.territoryTileOccupiedLabel,
      meta: styles.territoryTileOccupiedMeta,
    };
  }

  if (state === "blocked") {
    return {
      card: styles.territoryTileBlocked,
      label: styles.territoryTileBlockedLabel,
      meta: styles.territoryTileBlockedMeta,
    };
  }

  return {
    card: styles.territoryTileCleared,
    label: styles.territoryTileClearedLabel,
    meta: styles.territoryTileClearedMeta,
  };
}

function formatBuildingNameCompact(buildingType: BuildingType, level: number): string {
  const name = buildingType.replace("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
  return level > 1 ? `${name} Lv.${level}` : name;
}

function formatCompactTileState(state: SettlementSnapshot["tiles"][number]["state"]): string {
  if (state === "cleared") {
    return "Cleared";
  }

  if (state === "blocked") {
    return "Blocked";
  }

  return "Occupied";
}

function compressActionHint(hint: string): string {
  return hint
    .replace("Spend ", "")
    .replace("Supplies", "supplies")
    .replace("Stone", "stone")
    .replace(
      "Convert today's walk into Supplies and Stone before you close the evening loop.",
      "Sync the day into resources.",
    )
    .replace(
      "Convert today's walk into supplies and stone before you close the evening loop.",
      "Sync the day into resources.",
    )
    .replace("and widen the frontier board.", "and widen the frontier.")
    .replace("to turn the camp into a working outpost.", "to anchor the outpost.");
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
  mobileShell: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 14,
  },
  sceneCardModern: {
    backgroundColor: "#1f140d",
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "#4b3220",
    overflow: "hidden",
  },
  sceneHeaderModern: {
    gap: 12,
  },
  sceneHeaderModernWide: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sceneHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  sceneEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#b69363",
  },
  sceneTitleModern: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "700",
    color: "#f4e6c8",
  },
  sceneSubtitleModern: {
    fontSize: 13,
    lineHeight: 19,
    color: "#c5ab86",
    maxWidth: 240,
  },
  resourceChipRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  resourceChip: {
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  resourceChipWarm: {
    backgroundColor: "rgba(196, 97, 27, 0.16)",
    borderColor: "#9d5a28",
  },
  resourceChipStone: {
    backgroundColor: "rgba(120, 146, 111, 0.18)",
    borderColor: "#6c7f62",
  },
  resourceChipValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f5ecd9",
  },
  resourceChipLabel: {
    fontSize: 11,
    color: "#c8b18f",
    marginTop: 2,
  },
  statusChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 243, 221, 0.08)",
    borderWidth: 1,
    borderColor: "#594130",
  },
  statusChipLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#977550",
  },
  statusChipValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f0e1c3",
    marginTop: 3,
  },
  sceneCanvasModern: {
    position: "relative",
    height: 230,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 14,
    backgroundColor: "#2a1a10",
  },
  sceneSkyModern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 124,
    backgroundColor: "#2a1e14",
  },
  sceneSunModern: {
    position: "absolute",
    right: 28,
    top: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f1ca7f",
  },
  sceneRidgeLeft: {
    position: "absolute",
    left: -10,
    top: 94,
    width: 180,
    height: 44,
    borderTopRightRadius: 44,
    backgroundColor: "#3b2818",
    transform: [{ skewX: "-18deg" }],
  },
  sceneRidgeRight: {
    position: "absolute",
    right: -24,
    top: 82,
    width: 180,
    height: 52,
    borderTopLeftRadius: 52,
    backgroundColor: "#342214",
    transform: [{ skewX: "20deg" }],
  },
  sceneGroundModern: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 112,
    backgroundColor: "#4d3020",
  },
  scenePathModern: {
    position: "absolute",
    left: 104,
    right: 94,
    bottom: 48,
    height: 20,
    borderRadius: 16,
    backgroundColor: "#7a5636",
  },
  sceneFog: {
    position: "absolute",
    top: 86,
    width: 64,
    height: 52,
    borderRadius: 8,
    backgroundColor: "rgba(133, 116, 95, 0.72)",
  },
  sceneFogLeft: {
    left: 0,
  },
  sceneFogRight: {
    right: 0,
  },
  sceneBadgeModern: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(23, 13, 7, 0.88)",
  },
  sceneBadgeModernLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#caa67a",
  },
  sceneFooterModern: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "rgba(23, 13, 7, 0.76)",
  },
  sceneFooterTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f2e4c5",
    marginBottom: 4,
  },
  sceneFooterBody: {
    fontSize: 12,
    lineHeight: 17,
    color: "#c7b08a",
  },
  sceneStructureBase: {
    position: "absolute",
  },
  sceneStructureBuilding: {
    opacity: 0.72,
  },
  sceneStructureReveal: {
    shadowColor: "#f1ca7f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  sceneStructureCamp: {
    left: 128,
    bottom: 68,
    width: 46,
    height: 48,
  },
  sceneStructureWorkshop: {
    right: 70,
    bottom: 64,
    width: 62,
    height: 62,
  },
  sceneStructureHut: {
    left: 76,
    bottom: 67,
    width: 44,
    height: 46,
  },
  sceneStructureWell: {
    right: 32,
    bottom: 68,
    width: 32,
    height: 40,
  },
  sceneStructureStorehouse: {
    left: 36,
    bottom: 66,
    width: 56,
    height: 50,
  },
  sceneStructureTower: {
    right: 18,
    bottom: 88,
    width: 32,
    height: 72,
  },
  sceneTentLeft: {
    position: "absolute",
    left: 4,
    bottom: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#b48a5f",
  },
  sceneTentRight: {
    position: "absolute",
    left: 18,
    bottom: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#c9a274",
  },
  sceneCampfire: {
    position: "absolute",
    left: 21,
    bottom: 8,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#f07820",
  },
  sceneWorkshopRoof: {
    position: "absolute",
    top: 12,
    left: 8,
    width: 46,
    height: 16,
    backgroundColor: "#7c4f2f",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sceneWorkshopBody: {
    position: "absolute",
    top: 25,
    left: 12,
    width: 40,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#a4764f",
  },
  sceneWorkshopDoor: {
    position: "absolute",
    top: 32,
    left: 27,
    width: 10,
    height: 17,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: "#5f391f",
  },
  sceneWorkshopSmokeOne: {
    position: "absolute",
    top: 6,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(98, 79, 62, 0.46)",
  },
  sceneWorkshopSmokeTwo: {
    position: "absolute",
    top: 0,
    right: 4,
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: "rgba(98, 79, 62, 0.28)",
  },
  sceneHutRoof: {
    position: "absolute",
    top: 10,
    left: 7,
    width: 30,
    height: 14,
    backgroundColor: "#73492d",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sceneHutBody: {
    position: "absolute",
    top: 20,
    left: 9,
    width: 26,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#b18158",
  },
  sceneWellRoof: {
    position: "absolute",
    top: 8,
    left: 4,
    width: 24,
    height: 7,
    borderRadius: 6,
    backgroundColor: "#7b8f71",
  },
  sceneWellLegLeft: {
    position: "absolute",
    top: 14,
    left: 8,
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: "#7a5a3a",
  },
  sceneWellLegRight: {
    position: "absolute",
    top: 14,
    right: 8,
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: "#7a5a3a",
  },
  sceneWellBase: {
    position: "absolute",
    top: 26,
    left: 6,
    width: 20,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#8d7a5c",
  },
  sceneStorehouseRoof: {
    position: "absolute",
    top: 8,
    left: 4,
    width: 42,
    height: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#7b5030",
  },
  sceneStorehouseBody: {
    position: "absolute",
    top: 20,
    left: 8,
    width: 34,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#9c724b",
  },
  sceneTowerTop: {
    position: "absolute",
    top: 6,
    left: 2,
    width: 24,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#846242",
  },
  sceneTowerBody: {
    position: "absolute",
    top: 12,
    left: 9,
    width: 10,
    height: 48,
    backgroundColor: "#aa8260",
  },
  progressStripModern: {
    marginTop: 14,
    paddingTop: 2,
  },
  progressStripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressStripTitle: {
    fontSize: 13,
    color: "#e4d3b3",
  },
  progressStripFraction: {
    fontSize: 13,
    fontWeight: "700",
    color: "#c8a06f",
  },
  progressTrackModern: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#5b402b",
    overflow: "hidden",
  },
  progressFillModern: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#c4611b",
  },
  eventPanelModern: {
    backgroundColor: "#2a1b12",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#513625",
  },
  eventEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: "#b18d64",
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f0e1c3",
    marginBottom: 4,
  },
  eventBody: {
    fontSize: 12,
    lineHeight: 17,
    color: "#bca17c",
  },
  focusCardModern: {
    backgroundColor: "#f8edd8",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dcc298",
  },
  focusEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#8a663a",
    marginBottom: 6,
  },
  focusTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    color: "#352514",
    marginBottom: 6,
  },
  focusBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#69563a",
  },
  actionSectionModern: {
    backgroundColor: "#2a1b12",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#513625",
  },
  sectionHeaderCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitleCompact: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f0e1c3",
  },
  sectionMetaCompact: {
    fontSize: 12,
    color: "#b89870",
  },
  sectionLeadCompact: {
    fontSize: 14,
    lineHeight: 20,
    color: "#c0a784",
    marginTop: 8,
    marginBottom: 12,
  },
  secondaryChipGroup: {
    marginTop: 6,
    gap: 8,
  },
  secondaryActionChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#362419",
    borderWidth: 1,
    borderColor: "#5a402d",
  },
  secondaryActionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ead9b8",
    marginBottom: 2,
  },
  secondaryActionHint: {
    fontSize: 11,
    lineHeight: 15,
    color: "#bca17c",
  },
  homeDockRow: {
    flexDirection: "row",
    gap: 8,
  },
  dockCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#2a1b12",
    borderWidth: 1,
    borderColor: "#513625",
  },
  dockCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },
  dockEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: "#b18d64",
    marginBottom: 6,
  },
  dockTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    color: "#f0e1c3",
  },
  dockBody: {
    fontSize: 12,
    lineHeight: 16,
    color: "#bca17c",
    marginTop: 8,
  },
  dockMiniGrid: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  dockMiniTile: {
    flex: 1,
    minHeight: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  territoryTileReveal: {
    borderColor: "#c47c30",
    shadowColor: "#c47c30",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  dockMiniTileLabel: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 13,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 5, 3, 0.58)",
  },
  sheetCard: {
    backgroundColor: "#1f140d",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: "#4a3020",
    maxHeight: "68%",
  },
  sheetGrabber: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#6d5037",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  sheetHeaderCopy: {
    flex: 1,
  },
  sheetEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: "#b18d64",
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f0e1c3",
  },
  sheetCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#332116",
    borderWidth: 1,
    borderColor: "#5a402d",
  },
  sheetCloseLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ead9b8",
  },
  sheetSection: {
    gap: 14,
  },
  sheetLead: {
    fontSize: 13,
    lineHeight: 19,
    color: "#c0a784",
  },
  sheetTerritoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetTerritoryTile: {
    width: "31.8%",
    minHeight: 82,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  sheetTerritoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },
  sheetTerritoryMeta: {
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  sheetTerritoryKey: {
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
  },
  territoryTileOccupied: {
    backgroundColor: "#c4611b",
    borderColor: "#a35216",
  },
  territoryTileOccupiedLabel: {
    color: "#f7ecd8",
  },
  territoryTileOccupiedMeta: {
    color: "#f0d9b8",
  },
  territoryTileCleared: {
    backgroundColor: "#8aa06e",
    borderColor: "#677c52",
  },
  territoryTileClearedLabel: {
    color: "#f4f7ee",
  },
  territoryTileClearedMeta: {
    color: "#e1ead4",
  },
  territoryTileBlocked: {
    backgroundColor: "#bcae9a",
    borderColor: "#978675",
  },
  territoryTileBlockedLabel: {
    color: "#47382d",
  },
  territoryTileBlockedMeta: {
    color: "#655547",
  },
  recordCardModern: {
    backgroundColor: "#fff9ee",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e4d5b9",
    gap: 16,
  },
  recordSection: {
    gap: 10,
  },
  recordSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6d5738",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  recordPillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recordPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1e6cf",
    borderWidth: 1,
    borderColor: "#ddc69e",
  },
  recordPillLabel: {
    fontSize: 12,
    color: "#59462d",
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d8c9ae",
  },
  recordRowTitle: {
    fontSize: 14,
    color: "#453523",
    flex: 1,
    paddingRight: 12,
  },
  recordRowMeta: {
    fontSize: 12,
    color: "#8a7351",
  },
  revealCard: {
    backgroundColor: "#f3e5bf",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#cfb074",
    shadowColor: "#8f6a2a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  revealBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff5dd",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#dcc08d",
    marginBottom: 10,
  },
  revealBadgeLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#876538",
  },
  revealTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#392715",
    marginBottom: 6,
  },
  revealBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6a5638",
    maxWidth: 860,
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
    overflow: "hidden",
  },
  tileCardReveal: {
    borderColor: "#c49743",
    shadowColor: "#ad8430",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  tileRevealHalo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: "rgba(250, 233, 186, 0.6)",
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
