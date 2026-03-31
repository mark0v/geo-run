import { StyleSheet, Text, View } from "react-native";
import type { SettlementSnapshot } from "../../lib/api/contracts";

interface SettlementHomeScreenProps {
  snapshot: SettlementSnapshot;
}

export function SettlementHomeScreen({ snapshot }: SettlementHomeScreenProps) {
  const visibleTiles = snapshot.tiles.filter((tile) => tile.state !== "hidden");

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
    </View>
  );
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
