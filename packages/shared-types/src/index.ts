import { z } from 'zod';

/**
 * @forge-pro/shared-types — single source of truth for every type that crosses
 * an app/package boundary. Catalog display data lives in Sanity; transactional
 * data lives in Supabase. These Zod schemas are the contract between the two.
 */

export * from './qa.js';

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export const MoneySchema = z.object({
  /** Price in minor units (cents). */
  amount: z.number().int().nonnegative(),
  currency: z.string().length(3).default('USD'),
});
export type Money = z.infer<typeof MoneySchema>;

export const CatalogItemKindSchema = z.enum(['template', 'component']);
export type CatalogItemKind = z.infer<typeof CatalogItemKindSchema>;

// ---------------------------------------------------------------------------
// QA badge — the public quality signal (Phase 1: always 'pending')
// ---------------------------------------------------------------------------

export const QaScoreSchema = z.object({
  performance: z.number().min(0).max(100).nullable(),
  seo: z.number().min(0).max(100).nullable(),
  accessibility: z.number().min(0).max(100).nullable(),
  bestPractices: z.number().min(0).max(100).nullable(),
});
export type QaScore = z.infer<typeof QaScoreSchema>;

export const QaStatusSchema = z.enum(['pending', 'verified', 'rejected', 'not_applicable']);
export type QaStatus = z.infer<typeof QaStatusSchema>;

export const QaBadgeSchema = z.object({
  status: QaStatusSchema.default('pending'),
  compositeScore: z.number().min(0).max(100).nullable().default(null),
  scores: QaScoreSchema.default({
    performance: null,
    seo: null,
    accessibility: null,
    bestPractices: null,
  }),
  lastRunAt: z.string().datetime().nullable().default(null),
  reportUrl: z.string().url().nullable().default(null),
});
export type QaBadge = z.infer<typeof QaBadgeSchema>;

// ---------------------------------------------------------------------------
// Catalog items (mirrors the Sanity document model)
// ---------------------------------------------------------------------------

export const CatalogItemVersionSchema = z.object({
  version: z.string(),
  notes: z.string().optional(),
  releasedAt: z.string().datetime().optional(),
});
export type CatalogItemVersion = z.infer<typeof CatalogItemVersionSchema>;

export const CatalogItemBaseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string(),
  previewUrl: z.string().url(),
  price: MoneySchema,
  categories: z.array(z.string()),
  qaBadge: QaBadgeSchema,
  published: z.boolean().default(true),
});

export const TemplateSchema = CatalogItemBaseSchema.extend({
  kind: z.literal('template'),
  framework: z.string(),
  stack: z.array(z.string()),
  versions: z.array(CatalogItemVersionSchema).default([]),
});
export type Template = z.infer<typeof TemplateSchema>;

export const ComponentSchema = CatalogItemBaseSchema.extend({
  kind: z.literal('component'),
  framework: z.string(),
  stack: z.array(z.string()),
  componentType: z.string(),
});
export type Component = z.infer<typeof ComponentSchema>;

export const CatalogItemSchema = z.discriminatedUnion('kind', [TemplateSchema, ComponentSchema]);
export type CatalogItem = z.infer<typeof CatalogItemSchema>;

// ---------------------------------------------------------------------------
// Transactions (Supabase-backed DTOs)
// ---------------------------------------------------------------------------

export const OrderStatusSchema = z.enum(['pending', 'paid', 'refunded']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemSchema = z.object({
  id: z.string(),
  /** 'template' | 'component' */
  itemType: CatalogItemKindSchema,
  /** Sanity document _id of the purchased item — the stable key, never re-keyed. */
  sanityId: z.string(),
  slug: z.string(),
  title: z.string(),
  /** Purchased-version snapshot — downloads and license scope resolve to this. */
  version: z.string(),
  /** Snapshot at purchase time — never re-read from the live catalog. */
  price: MoneySchema,
  /** Vendor + revenue share snapshotted at purchase for P2 payout math. */
  vendorId: z.string(),
  revenueSharePct: z.number().int().min(0).max(100).default(0),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: OrderStatusSchema,
  items: z.array(OrderItemSchema),
  total: MoneySchema,
  createdAt: z.string().datetime(),
});
export type Order = z.infer<typeof OrderSchema>;

export const LicenseStatusSchema = z.enum(['active', 'revoked', 'expired']);
export type LicenseStatus = z.infer<typeof LicenseStatusSchema>;

export const LicenseSchema = z.object({
  id: z.string(),
  /** Public key, e.g. `forge_<uuid>` — what a buyer registers to a domain. */
  key: z.string(),
  userId: z.string(),
  itemType: CatalogItemKindSchema,
  sanityId: z.string(),
  status: LicenseStatusSchema,
  maxRegistrations: z.number().int().positive().default(1),
  revokedAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
});
export type License = z.infer<typeof LicenseSchema>;

// ---------------------------------------------------------------------------
// Entitlements — the single access-control path (v0.2 model review)
// ---------------------------------------------------------------------------

export const EntitlementSourceSchema = z.enum(['purchase', 'subscription']);
export type EntitlementSource = z.infer<typeof EntitlementSourceSchema>;

export const EntitlementStatusSchema = z.enum(['active', 'expired', 'revoked']);
export type EntitlementStatus = z.infer<typeof EntitlementStatusSchema>;

export const EntitlementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  itemType: CatalogItemKindSchema,
  sanityId: z.string(),
  source: EntitlementSourceSchema,
  /** Set for source=purchase; links to the registerable license key. */
  licenseId: z.string().nullable(),
  /** Set for source=subscription. */
  subscriptionId: z.string().nullable(),
  status: EntitlementStatusSchema,
  grantedAt: z.string().datetime(),
  /** Null = perpetual (one-time purchase). */
  expiresAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;

export const QaVerdictSchema = z.enum(['passed', 'rejected', 'error']);
export type QaVerdict = z.infer<typeof QaVerdictSchema>;

export const QaReportSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  verdict: QaVerdictSchema,
  compositeScore: z.number().min(0).max(100).nullable(),
  scores: QaScoreSchema,
  /** Percent of pixels changed vs. the previous baseline (null on first run). */
  visualDiffPct: z.number().min(0).max(100).nullable(),
  linkScan: z.object({
    broken: z.array(z.string()),
    total: z.number().int().nonnegative(),
  }),
  /** Threshold configuration as it existed when this run executed. */
  thresholdSnapshot: z.record(z.string(), z.number()),
  /** First passing run for an item becomes the visual-regression baseline. */
  isBaseline: z.boolean().default(false),
  /** When isBaseline, the item this baseline belongs to. */
  baselineOf: z.string().nullable().default(null),
  reportUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
});
export type QaReport = z.infer<typeof QaReportSchema>;

export const SubmissionStatusSchema = z.enum([
  'draft',
  'submitted',
  'qa_passed',
  'qa_rejected',
  'published',
  'withdrawn',
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

/** Semantic version, e.g. `1.2.3` (docs/vendor-portal.md §5). */
export const SemverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, 'must be x.y.z');

/**
 * A submission row (docs/vendor-portal.md §3, §11 — v0.3).
 *
 * Mirrors the DB row, so pre-submit fields are nullable: a draft is created
 * with only id/vendorId/itemType/status, then upload, ownership proof, and
 * submit fill the rest. The complete shape is enforced by
 * SubmitSubmissionSchema at the submit boundary.
 */
export const SubmissionSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  itemType: CatalogItemKindSchema,
  status: SubmissionStatusSchema,
  // Identity + catalog metadata (captured at submit, consumed at publish).
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  framework: z.string().nullable().default(null),
  stack: z.array(z.string()).default([]),
  /** Category slug (references the Sanity category document). */
  category: z.string().nullable().default(null),
  /** Required when itemType = component. */
  componentType: z.string().nullable().default(null),
  priceCents: z.number().int().nonnegative().nullable().default(null),
  currency: z.string().length(3).nullable().default(null),
  /** Storage paths of uploaded screenshots. */
  screenshots: z.array(z.string()).default([]),
  // Preview URL + ownership proof.
  previewUrl: z.string().url().nullable().default(null),
  /** Set once the vendor proves control of the preview URL (§6). */
  verificationToken: z.string().nullable().default(null),
  // Artifact.
  zipUrl: z.string().url().nullable().default(null),
  artifactSha256: z.string().nullable().default(null),
  submittedVersion: z.string().nullable().default(null),
  // Lifecycle.
  /** Sanity _id of the item; set at publish, and also the version-update link. */
  itemSanityId: z.string().nullable().default(null),
  /** The report backing the current status (also mirrored in Sanity's qaBadge). */
  currentQaReportId: z.string().nullable().default(null),
  withdrawnAt: z.string().datetime().nullable().default(null),
  publishedAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

/**
 * Complete-submission validator — the app enforces this on submit
 * (docs/vendor-portal.md §5). The server additionally checks ownership proof
 * (verificationToken set) and artifact presence (artifactSha256 set), which
 * are server-side state rather than client payload.
 */
export const SubmitSubmissionSchema = z.object({
  itemType: CatalogItemKindSchema,
  title: z.string().min(3).max(120),
  description: z.string().min(40).max(2000),
  previewUrl: z.string().url(),
  framework: z.string().min(1),
  stack: z.array(z.string()).max(8).default([]),
  category: z.string().min(1),
  componentType: z.string().nullable().default(null),
  priceCents: z.number().int().positive().max(50_000),
  currency: z.string().length(3).default('USD'),
  screenshots: z.array(z.string()).max(6).default([]),
  submittedVersion: SemverSchema,
});
export type SubmitSubmission = z.infer<typeof SubmitSubmissionSchema>;

export const AIConversationSchema = z.object({
  id: z.string(),
  /** Nullable — anonymous concierge chats are allowed (rate-capped). */
  userId: z.string().nullable(),
  /** Server-issued opaque token (httpOnly cookie) that scopes anonymous chats. */
  sessionToken: z.string().nullable().default(null),
  title: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type AIConversation = z.infer<typeof AIConversationSchema>;

export const AIMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  /** Model used for this message — recorded for cost tracking. */
  model: z.string().nullable().default(null),
  tokenUsage: z.record(z.string(), z.number()).nullable(),
  createdAt: z.string().datetime(),
});
export type AIMessage = z.infer<typeof AIMessageSchema>;
