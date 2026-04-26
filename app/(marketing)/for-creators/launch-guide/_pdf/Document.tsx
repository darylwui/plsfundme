import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  Checkbox,
  StyleSheet,
} from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LAUNCH_SECTIONS, LAUNCH_TOTAL_ITEMS } from "../_data";

// Read the bread icon once at module load — it's a static asset, no need
// to hit disk per render. We pass it as a Buffer rather than a URL so the
// PDF generator doesn't try to fetch it over HTTP.
const breadIcon = readFileSync(
  join(process.cwd(), "public", "bread-icon.png"),
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://getthatbread.sg";
const CREATE_CAMPAIGN_URL = `${APP_URL}/projects/create`;

/**
 * Shopping-list themed launch checklist.
 *
 * Aesthetic notes:
 * - Warm cream page (the kitchen-pad "scrap of paper" feel).
 * - All-caps "aisle sign" section headers in brand orange, sandwiched
 *   between dashed dividers — the visual rhythm of a grocery list grouped
 *   by aisle: PRODUCE / DAIRY / BAKERY.
 * - Ruled item rows with interactive checkboxes — readers can tick them
 *   directly in Preview / Adobe / etc. and save the marked-up PDF.
 * - Single A4 page; no margin headroom for note-writing (the launch-guide
 *   web page is the place for working drafts).
 */
const palette = {
  ink: "#14110D",
  inkMuted: "#6B5A47",
  inkSubtle: "#9C8B78",
  crust: "#E07F14",
  crustDark: "#AC5811",
  paper: "#FAF6EE",
  divider: "#C8B8A0",
  rule: "#E8DDC8",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: palette.ink,
    backgroundColor: palette.paper,
  },
  // ── Tear line (decorative, top) ─────────────────────────────────
  tearLine: {
    borderTopWidth: 1,
    borderTopColor: palette.divider,
    borderTopStyle: "dashed",
    marginBottom: 8,
  },
  // ── Header ──────────────────────────────────────────────────────
  header: {
    marginBottom: 10,
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  headerTitle: {
    color: palette.ink,
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerIcon: {
    width: 16,
    height: 16,
    marginHorizontal: 4,
  },
  headerSub: {
    color: palette.inkMuted,
    fontSize: 8.5,
    fontStyle: "italic",
  },
  // ── Section ("aisle sign") ──────────────────────────────────────
  section: {
    marginBottom: 4,
  },
  sectionHeaderWrap: {
    marginTop: 7,
    marginBottom: 5,
    alignItems: "center",
  },
  sectionDivider: {
    width: "100%",
    borderTopWidth: 0.6,
    borderTopColor: palette.divider,
    borderTopStyle: "dashed",
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: palette.crust,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    backgroundColor: palette.paper,
    paddingHorizontal: 10,
    marginTop: -6,
  },
  // ── Item row ────────────────────────────────────────────────────
  item: {
    flexDirection: "row",
    paddingVertical: 3.5,
    paddingHorizontal: 2,
    borderBottomWidth: 0.4,
    borderBottomColor: palette.rule,
    alignItems: "flex-start",
  },
  checkboxBox: {
    width: 12,
    height: 12,
    marginRight: 9,
    marginTop: 1,
  },
  checkbox: {
    width: 12,
    height: 12,
    // Tells the PDF reader to draw the check glyph in brand orange.
    // Standard PDF form-field foreground color — most readers honor it
    // (Adobe, Chrome, Firefox); Apple Preview is hit-or-miss.
    color: palette.crust,
  },
  itemBody: {
    flex: 1,
  },
  itemLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: palette.ink,
    marginBottom: 1,
    lineHeight: 1.2,
  },
  // Asterisk after a label = required field. Brand orange so it pops, but
  // small enough not to compete with the label itself.
  requiredMark: {
    color: palette.crust,
    fontFamily: "Helvetica-Bold",
  },
  // ── Info row (no checkbox, muted) ───────────────────────────────
  // Used for the "After you submit" section — these aren't tasks the
  // creator does, so they don't get a checkbox. Indented to where the
  // label would normally sit, italic spec, slightly muted label.
  itemInfo: {
    flexDirection: "row",
    paddingVertical: 3.5,
    paddingHorizontal: 2,
    paddingLeft: 21, // matches checkbox column width so labels line up
    borderBottomWidth: 0.4,
    borderBottomColor: palette.rule,
  },
  itemInfoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: palette.inkMuted,
    marginBottom: 1,
    lineHeight: 1.2,
  },
  itemInfoSpec: {
    fontSize: 8.5,
    color: palette.inkMuted,
    fontStyle: "italic",
    lineHeight: 1.35,
  },
  // ── CTA link (above the footer) ─────────────────────────────────
  cta: {
    marginTop: 10,
    marginBottom: 6,
    textAlign: "center",
    fontSize: 9,
    color: palette.crustDark,
    fontFamily: "Helvetica-Bold",
    textDecoration: "none",
  },
  itemSpec: {
    fontSize: 8.5,
    color: palette.inkMuted,
    lineHeight: 1.35,
  },
  // ── Footer ("torn bottom") ──────────────────────────────────────
  footerWrap: {
    position: "absolute",
    bottom: 18,
    left: 40,
    right: 40,
  },
  // The legend explaining the * marker sits above the tear line, in italic
  // so it reads as a footnote rather than primary copy.
  footerLegend: {
    fontSize: 8,
    color: palette.inkMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 6,
  },
  footerLegendMark: {
    color: palette.crust,
    fontFamily: "Helvetica-Bold",
    fontStyle: "normal",
  },
  footerTear: {
    borderTopWidth: 1,
    borderTopColor: palette.divider,
    borderTopStyle: "dashed",
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: palette.inkSubtle,
  },
  footerBrand: {
    fontFamily: "Helvetica-Bold",
    color: palette.crust,
  },
});

function Header() {
  return (
    <View style={styles.header}>
      {/* The bread icon stands in for the 🍞 emoji — Helvetica can't render
          emoji glyphs, so we inline the same bread-icon.png used in the
          email header. */}
      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitle}>get that</Text>
        <Image src={breadIcon} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>creator launch checklist</Text>
      </View>
      <Text style={styles.headerSub}>
        {LAUNCH_TOTAL_ITEMS} items across {LAUNCH_SECTIONS.length} sections —
        tick them off as you go.
      </Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  // The title sits centered on top of the dashed divider — same trick a
  // grocery list uses to label aisles. The negative top margin pulls the
  // title up so it visually overlaps the line.
  return (
    <View style={styles.sectionHeaderWrap}>
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footerWrap} fixed>
      <Text style={styles.footerLegend}>
        <Text style={styles.footerLegendMark}>*</Text> Required to publish your
        campaign — everything else is optional but recommended.
      </Text>
      <View style={styles.footerTear} />
      <View style={styles.footerRow}>
        <Text style={styles.footerBrand}>getthatbread.sg</Text>
        <Text>save the file to keep your ticks</Text>
      </View>
    </View>
  );
}

export function LaunchGuidePdf() {
  return (
    <Document
      title="get that bread — Creator launch checklist"
      author="get that bread"
      subject="Pre-launch checklist for crowdfunding creators"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.tearLine} />
        <Header />

        {LAUNCH_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            <SectionHeader title={section.title} />
            {section.items.map((item) =>
              section.informational ? (
                // Info-only row — no checkbox, muted label, italic spec.
                // Signals "for reference, nothing to do here."
                <View key={item.id} style={styles.itemInfo}>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemInfoLabel}>{item.label}</Text>
                    <Text style={styles.itemInfoSpec}>{item.spec}</Text>
                  </View>
                </View>
              ) : (
                <View key={item.id} style={styles.item}>
                  <View style={styles.checkboxBox}>
                    <Checkbox
                      name={`gtb_${item.id}`}
                      style={styles.checkbox}
                      borderColor={palette.inkMuted}
                      xMark={false}
                    />
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemLabel}>
                      {item.label}
                      {item.required && (
                        <Text style={styles.requiredMark}> *</Text>
                      )}
                    </Text>
                    <Text style={styles.itemSpec}>{item.spec}</Text>
                  </View>
                </View>
              ),
            )}
          </View>
        ))}

        {/* CTA link to the live create-campaign form. The href is absolute
            so it works when the PDF is opened outside the browser. */}
        <Link src={CREATE_CAMPAIGN_URL} style={styles.cta}>
          ready when you are — start your campaign »
        </Link>

        <Footer />
      </Page>
    </Document>
  );
}
