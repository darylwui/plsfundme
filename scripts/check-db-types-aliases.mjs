#!/usr/bin/env node
/**
 * Guards against the named enum aliases being dropped from
 * `types/database.types.ts` when the file is regenerated via
 * `supabase gen types`.
 *
 * Why this exists:
 * The Supabase CLI only emits the nested `Database["public"]["Enums"][...]`
 * shape. The rest of the codebase imports named top-level aliases
 * (`PaymentMethodType`, `ProjectStatus`, etc.) — if a regen wipes them,
 * Vercel's build fails with cryptic "no exported member" errors.
 *
 * This check runs in `prebuild` so the failure happens locally (or on
 * Vercel) with an actionable message, not five minutes into a deploy.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const FILE = resolve(process.cwd(), "types/database.types.ts");

// Must stay in sync with the aliases block at the top of the generated file.
// If you add a new enum to the DB schema, add its alias here AND in the
// generated file.
const REQUIRED_ALIASES = [
  "UserRole",
  "PmStatus",
  "ProjectStatus",
  "PledgeStatus",
  "PaymentMethodType",
  "FulfillmentStatus",
  "KycStatus",
  "PayoutMode",
  "PayoutStatus",
];

if (!existsSync(FILE)) {
  console.error(`[check-db-types-aliases] File not found: ${FILE}`);
  process.exit(1);
}

const src = readFileSync(FILE, "utf8");
const missing = REQUIRED_ALIASES.filter((name) => {
  // Match `export type Foo = Database["public"]["Enums"]["..."]`
  const re = new RegExp(`export\\s+type\\s+${name}\\s*=`);
  return !re.test(src);
});

if (missing.length > 0) {
  console.error(
    "\n\x1b[31m[check-db-types-aliases] FAIL\x1b[0m\n" +
      "\n" +
      "types/database.types.ts is missing required named enum aliases:\n" +
      missing.map((n) => `  - ${n}`).join("\n") +
      "\n\n" +
      "This usually means the file was regenerated via `supabase gen types`\n" +
      "and the hand-maintained alias block at the top got wiped. Re-add it:\n" +
      "\n" +
      "  export type UserRole          = Database[\"public\"][\"Enums\"][\"user_role\"]\n" +
      "  export type PmStatus          = Database[\"public\"][\"Enums\"][\"pm_status\"]\n" +
      "  export type ProjectStatus     = Database[\"public\"][\"Enums\"][\"project_status\"]\n" +
      "  export type PledgeStatus      = Database[\"public\"][\"Enums\"][\"pledge_status\"]\n" +
      "  export type PaymentMethodType = Database[\"public\"][\"Enums\"][\"payment_method_type\"]\n" +
      "  export type FulfillmentStatus = Database[\"public\"][\"Enums\"][\"fulfillment_status\"]\n" +
      "  export type KycStatus         = Database[\"public\"][\"Enums\"][\"kyc_status\"]\n" +
      "  export type PayoutMode        = Database[\"public\"][\"Enums\"][\"payout_mode\"]\n" +
      "  export type PayoutStatus      = Database[\"public\"][\"Enums\"][\"payout_status\"]\n" +
      "\n" +
      "See commit ac0a00d for the canonical block.\n"
  );
  process.exit(1);
}

console.log(`[check-db-types-aliases] ok (${REQUIRED_ALIASES.length} aliases present)`);
