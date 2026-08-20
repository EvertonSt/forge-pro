import { SubmissionSchema, type Submission } from '@forge-pro/shared-types';

/**
 * PostgREST returns snake_case columns; the shared DTO is camelCase. This
 * aliased select maps the row to the DTO shape in one query, and the row is
 * then validated with SubmissionSchema so the app never touches raw columns.
 */
export const SUBMISSION_SELECT = `
  id,
  itemType:item_type,
  vendorId:vendor_id,
  status,
  title,
  description,
  framework,
  stack,
  category,
  componentType:component_type,
  priceCents:price_cents,
  currency,
  screenshots,
  previewUrl:preview_url,
  verificationToken:verification_token,
  zipUrl:zip_url,
  artifactSha256:artifact_sha256,
  submittedVersion:submitted_version,
  itemSanityId:item_sanity_id,
  currentQaReportId:current_qa_report_id,
  withdrawnAt:withdrawn_at,
  publishedAt:published_at,
  createdAt:created_at
`;

export function parseSubmission(row: unknown): Submission {
  return SubmissionSchema.parse(row);
}
