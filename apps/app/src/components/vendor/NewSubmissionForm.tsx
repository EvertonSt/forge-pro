'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { CatalogItemKindSchema, SemverSchema } from '@forge-pro/shared-types';

type ItemType = 'template' | 'component';
type Step = 1 | 2 | 3;

interface Draft {
  id: string;
  verificationToken: string;
  demo?: boolean;
}

interface ZipInfo {
  name: string;
  sizeBytes: number;
  clientSha256: string | null;
}

interface VerifyState {
  state: 'idle' | 'checking' | 'ok' | 'fail';
  message: string;
}

const STEP_LABELS = ['Catalog details', 'Preview & ownership', 'Artifact & version'] as const;

const step1Schema = z
  .object({
    itemType: CatalogItemKindSchema,
    title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title must be under 120 characters'),
    description: z
      .string()
      .min(40, 'Description must be at least 40 characters')
      .max(2000, 'Description must be under 2000 characters'),
    framework: z.string().min(1, 'Framework is required'),
    stack: z.array(z.string()).max(8, 'Maximum 8 tags'),
    category: z.string().min(1, 'Category is required'),
    componentType: z.string().nullable(),
    price: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price')
      .refine((v) => Number(v) >= 0.01 && Number(v) <= 500, 'Price must be between $0.01 and $500'),
  })
  .superRefine((data, ctx) => {
    if (data.itemType === 'component' && !data.componentType?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['componentType'], message: 'Component type is required for components' });
    }
  });

const step2Schema = z.object({
  previewUrl: z
    .string()
    .url('Enter a valid URL')
    .refine(
      (v) => {
        try {
          const url = new URL(v);
          return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        } catch {
          return false;
        }
      },
      { message: 'Preview URL must use https (http is allowed for localhost)' },
    ),
});

const step3Schema = z.object({ version: SemverSchema });

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <span className="vp-field-error">{message}</span>;
}

export function NewSubmissionForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [itemType, setItemType] = useState<ItemType>('template');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('');
  const [stack, setStack] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState('');
  const [category, setCategory] = useState('');
  const [componentType, setComponentType] = useState('');
  const [price, setPrice] = useState('129');
  const [currency, setCurrency] = useState('USD');
  const [previewUrl, setPreviewUrl] = useState('');
  const [version, setVersion] = useState('1.0.0');

  const [verify, setVerify] = useState<VerifyState>({ state: 'idle', message: '' });
  const [zip, setZip] = useState<ZipInfo | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const priceCents = useMemo(() => Math.round(Number(price) * 100), [price]);

  function validateStep(schema: z.ZodType<unknown>, data: Record<string, unknown>): boolean {
    const result = schema.safeParse(data);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      if (key && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  }

  async function createDraft(): Promise<boolean> {
    if (draft) return true;
    setFormError(null);
    try {
      const res = await fetch('/api/vendor/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemType }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<Draft> & { error?: string };
      if (!res.ok || !body.id) {
        setFormError(body.error ?? 'Could not create the submission draft.');
        return false;
      }
      setDraft({ id: body.id, verificationToken: body.verificationToken ?? '', demo: body.demo });
      return true;
    } catch {
      setFormError('Could not create the submission draft.');
      return false;
    }
  }

  async function onStep1Continue() {
    const ok = validateStep(
      step1Schema,
      { itemType, title, description, framework, stack, category, componentType, price },
    );
    if (!ok) return;
    if (await createDraft()) setStep(2);
  }

  async function onVerify() {
    if (!validateStep(step2Schema, { previewUrl })) return;
    if (!draft) return;
    setVerify({ state: 'checking', message: 'Fetching your preview page and checking for the token…' });
    try {
      const res = await fetch(`/api/vendor/submissions/${draft.id}/verify-preview`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ previewUrl }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      setVerify({
        state: res.ok && body.ok ? 'ok' : 'fail',
        message: body.message ?? (res.ok ? 'Verified.' : 'Verification failed.'),
      });
    } catch {
      setVerify({ state: 'fail', message: 'Could not reach the verification service.' });
    }
  }

  function addStackTag() {
    const tag = stackInput.trim().replace(/,$/, '');
    if (!tag) return;
    if (stack.length >= 8) return;
    if (stack.includes(tag)) {
      setStackInput('');
      return;
    }
    setStack((s) => [...s, tag]);
    setStackInput('');
  }

  function onZipChange(file: File | undefined) {
    setZipError(null);
    setZip(null);
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setZipError('Zip must be under 50 MB.');
      return;
    }
    const head = file.slice(0, 4);
    head
      .arrayBuffer()
      .then((buf) => {
        const bytes = new Uint8Array(buf);
        const isZip =
          bytes.length >= 4 &&
          bytes[0] === 0x50 &&
          bytes[1] === 0x4b &&
          (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07);
        if (!isZip) {
          setZipError('Not a zip file — the first bytes must be PK.');
          return;
        }
        return crypto.subtle.digest('SHA-256', buf).then((digest) => {
          const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
          setZip({ name: file.name, sizeBytes: file.size, clientSha256: hex });
        });
      })
      .catch(() => {
        setZipError('Could not read the file.');
      });
  }

  function onScreenshotsChange(files: FileList | null) {
    const list = files ? Array.from(files) : [];
    if (screenshots.length + list.length > 6) {
      setErrors((e) => ({ ...e, screenshots: 'Maximum 6 screenshots.' }));
      return;
    }
    const tooBig = list.some((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      setErrors((e) => ({ ...e, screenshots: 'Each screenshot must be under 5 MB.' }));
      return;
    }
    setErrors((e) => ({ ...e, screenshots: '' }));
    setScreenshots((s) => [...s, ...list.map((f) => f.name)]);
  }

  async function onSubmit() {
    if (!validateStep(step3Schema, { version })) return;
    if (!draft) return;
    if (!zip) {
      setZipError('Select the template zip before submitting.');
      return;
    }
    if (verify.state !== 'ok') {
      setFormError('Verify your preview URL before submitting.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        itemType,
        title,
        description,
        previewUrl,
        framework,
        stack,
        category,
        componentType: itemType === 'component' ? componentType.trim() : null,
        priceCents,
        currency,
        screenshots: [],
        submittedVersion: version,
      };
      const res = await fetch(`/api/vendor/submissions/${draft.id}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          zip: { name: zip.name, sizeBytes: zip.sizeBytes, clientSha256: zip.clientSha256 },
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; issues?: Array<{ message: string }> };
      if (res.ok) {
        router.push(`/vendor/submissions/${draft.id}`);
        return;
      }
      const firstIssue = body.issues?.[0];
      if (firstIssue) {
        setFormError(firstIssue.message);
      } else {
        setFormError(body.error ?? 'Submit failed.');
      }
      setSubmitting(false);
    } catch {
      setFormError('Submit failed.');
      setSubmitting(false);
    }
  }

  function goTo(target: Step) {
    if (target < step) setStep(target);
  }

  const reviewRows: Array<[string, string]> = [
    ['Item type', itemType],
    ['Title', title],
    ['Framework', framework],
    ['Stack', stack.join(', ') || '—'],
    ['Category', category],
    ...(itemType === 'component' ? [['Component type', componentType] as [string, string]] : []),
    ['Price', `${price} ${currency}`],
    ['Preview URL', previewUrl],
    ['Version', version],
  ];

  return (
    <div>
      <div className="vp-stepper">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step;
          const state = n === step ? 'active' : n < step ? 'done' : '';
          return (
            <button
              key={label}
              type="button"
              className={`vp-step vp-step--${state}`}
              onClick={() => goTo(n)}
              disabled={n > step}
            >
              <span className="vp-step-num">{n < step ? '✓' : n}</span>
              {label}
            </button>
          );
        })}
      </div>

      {formError ? (
        <div className="vp-banner vp-banner--error" style={{ marginBottom: 'var(--fp-space-4)' }}>
          {formError}
        </div>
      ) : null}

      <div className="vp-card">
        <div className="vp-card-body">
          {step === 1 ? (
            <div className="vp-form">
              <div className="vp-field">
                <span className="vp-label">Item type</span>
                <div className="vp-seg">
                  {(['template', 'component'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`vp-seg-btn${itemType === t ? ' vp-seg-btn--active' : ''}`}
                      onClick={() => setItemType(t)}
                    >
                      {t === 'template' ? 'Template' : 'Component'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="vp-field">
                <label className="vp-label">
                  Title <span className="vp-label-req">*</span>
                </label>
                <input
                  className={`vp-input${errors.title ? ' vp-input--error' : ''}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Aurora Landing Page"
                />
                <FieldError message={errors.title} />
              </div>

              <div className="vp-field">
                <label className="vp-label">
                  Description <span className="vp-label-req">*</span>
                </label>
                <textarea
                  className={`vp-textarea${errors.description ? ' vp-input--error' : ''}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this template/component do? Who is it for? What makes it good?"
                />
                <div className={`vp-counter${description.length > 2000 ? ' vp-counter--over' : ''}`}>
                  {description.length}/2000 (min 40)
                </div>
                <FieldError message={errors.description} />
              </div>

              <div className="vp-field-row">
                <div className="vp-field">
                  <label className="vp-label">
                    Framework <span className="vp-label-req">*</span>
                  </label>
                  <input
                    className={`vp-input${errors.framework ? ' vp-input--error' : ''}`}
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    placeholder="Astro, Next.js, React…"
                    list="vp-frameworks"
                  />
                  <datalist id="vp-frameworks">
                    <option value="Astro" />
                    <option value="Next.js" />
                    <option value="React" />
                    <option value="Vue" />
                    <option value="Svelte" />
                    <option value="Plain HTML" />
                  </datalist>
                  <FieldError message={errors.framework} />
                </div>
                <div className="vp-field">
                  <label className="vp-label">
                    Category <span className="vp-label-req">*</span>
                  </label>
                  <input
                    className={`vp-input${errors.category ? ' vp-input--error' : ''}`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="landing-page, dashboard, forms…"
                  />
                  <FieldError message={errors.category} />
                </div>
              </div>

              <div className="vp-field">
                <span className="vp-label">Stack tags (max 8)</span>
                <div className="vp-tags">
                  {stack.map((tag) => (
                    <span key={tag} className="vp-tag-chip">
                      {tag}
                      <button
                        type="button"
                        className="vp-tag-x"
                        onClick={() => setStack((s) => s.filter((t) => t !== tag))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    className="vp-tag-input"
                    value={stackInput}
                    onChange={(e) => setStackInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addStackTag();
                      }
                    }}
                    onBlur={addStackTag}
                    placeholder="Tailwind, TypeScript…"
                  />
                </div>
                <FieldError message={errors.stack} />
              </div>

              {itemType === 'component' ? (
                <div className="vp-field">
                  <label className="vp-label">
                    Component type <span className="vp-label-req">*</span>
                  </label>
                  <input
                    className={`vp-input${errors.componentType ? ' vp-input--error' : ''}`}
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value)}
                    placeholder="single, kit, hooks…"
                  />
                  <FieldError message={errors.componentType} />
                </div>
              ) : null}

              <div className="vp-field-row">
                <div className="vp-field">
                  <label className="vp-label">
                    Price <span className="vp-label-req">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className={`vp-input${errors.price ? ' vp-input--error' : ''}`}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      inputMode="decimal"
                    />
                    <select className="vp-select" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 96 }}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                  <FieldError message={errors.price} />
                </div>
                <div className="vp-field">
                  <span className="vp-label">Screenshots (max 6)</span>
                  <label className="vp-file">
                    <span className="vp-muted">Choose screenshots…</span>
                    <input type="file" accept="image/*" multiple onChange={(e) => onScreenshotsChange(e.target.files)} />
                  </label>
                  {screenshots.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {screenshots.map((name) => (
                        <span key={name} className="vp-tag-chip">
                          {name}
                          <button
                            type="button"
                            className="vp-tag-x"
                            onClick={() => setScreenshots((s) => s.filter((n) => n !== name))}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <span className="vp-hint">Upload to storage is wired in Session 4 — files are validated and listed here now.</span>
                  <FieldError message={errors.screenshots} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="vp-btn vp-btn--primary" onClick={onStep1Continue}>
                  Continue — preview &amp; ownership
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="vp-form">
              <div className="vp-notice">
                <div>
                  <strong>Why this step?</strong> The QA gate spends real CI minutes on your preview URL, so you
                  must prove you control it. Add the meta tag below to your preview page, deploy, then verify.
                </div>
              </div>

              <div className="vp-field">
                <label className="vp-label">
                  Preview URL <span className="vp-label-req">*</span>
                </label>
                <input
                  className={`vp-input${errors.previewUrl ? ' vp-input--error' : ''}`}
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="https://your-deployed-preview.example.com"
                />
                <FieldError message={errors.previewUrl} />
              </div>

              <div className="vp-field">
                <span className="vp-label">Verification token</span>
                <div
                  className="vp-mono"
                  style={{
                    background: 'var(--fp-color-neutral-100)',
                    padding: '10px 12px',
                    borderRadius: 'var(--fp-radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>{draft?.verificationToken ?? 'creating draft…'}</span>
                  {draft ? (
                    <button
                      type="button"
                      className="vp-btn vp-btn--ghost vp-btn--sm"
                      onClick={() => navigator.clipboard?.writeText(draft.verificationToken)}
                    >
                      Copy
                    </button>
                  ) : null}
                </div>
                <code
                  className="vp-mono"
                  style={{ fontSize: '0.78rem', background: 'var(--fp-color-neutral-50)', padding: '8px 10px', borderRadius: 6 }}
                >
                  {`<meta name="forge-pro:verify" content="${draft?.verificationToken ?? '<token>'}" />`}
                </code>
                <span className="vp-hint">Paste this into the &lt;head&gt; of your preview page and deploy it.</span>
              </div>

              <div>
                <button
                  type="button"
                  className="vp-btn vp-btn--primary"
                  onClick={onVerify}
                  disabled={verify.state === 'checking' || !draft}
                >
                  {verify.state === 'checking' ? 'Checking…' : 'Verify ownership'}
                </button>
                {verify.message ? (
                  <div
                    className={`vp-banner ${verify.state === 'ok' ? 'vp-banner--success' : verify.state === 'fail' ? 'vp-banner--error' : 'vp-banner--warn'}`}
                    style={{ marginTop: 12, marginBottom: 0 }}
                  >
                    {verify.message}
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="vp-btn vp-btn--ghost" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="vp-btn vp-btn--primary"
                  onClick={() => {
                    if (validateStep(step2Schema, { previewUrl })) setStep(3);
                  }}
                >
                  Continue — artifact &amp; version
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="vp-form">
              <div className="vp-field">
                <span className="vp-label">
                  Template source (zip) <span className="vp-label-req">*</span>
                </span>
                <div className={`vp-file${zip ? ' vp-file--has' : ''}`}>
                  {zip ? (
                    <div className="vp-file-card">
                      <div>
                        <div className="vp-file-name">{zip.name}</div>
                        <div className="vp-hint" style={{ marginTop: 2 }}>
                          {(zip.sizeBytes / (1024 * 1024)).toFixed(2)} MB · sha256{' '}
                          <span className="vp-mono">{zip.clientSha256?.slice(0, 16)}…</span>
                        </div>
                      </div>
                      <button type="button" className="vp-btn vp-btn--ghost vp-btn--sm" onClick={() => setZip(null)}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>Click to choose a .zip — max 50 MB</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip,application/zip,application/octet-stream"
                        onChange={(e) => onZipChange(e.target.files?.[0])}
                      />
                    </>
                  )}
                </div>
                <FieldError message={zipError} />
                <span className="vp-hint">
                  The server recomputes the SHA-256 while streaming — the hash shown here is a client-side preview
                  only.
                </span>
              </div>

              <div className="vp-field">
                <label className="vp-label">
                  Version (semver) <span className="vp-label-req">*</span>
                </label>
                <input
                  className={`vp-input${errors.version ? ' vp-input--error' : ''}`}
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  style={{ width: 180 }}
                />
                <FieldError message={errors.version} />
              </div>

              <div className="vp-field">
                <span className="vp-label">Review</span>
                <dl className="vp-kv" style={{ gridTemplateColumns: '160px 1fr' }}>
                  {reviewRows.map(([label, value]) => (
                    <span key={label} style={{ display: 'contents' }}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </span>
                  ))}
                  <dt>Ownership</dt>
                  <dd>
                    {verify.state === 'ok' ? (
                      <span className="vp-chip vp-chip--success">verified</span>
                    ) : (
                      <span className="vp-chip vp-chip--danger">not verified</span>
                    )}
                  </dd>
                </dl>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="vp-btn vp-btn--ghost" onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  type="button"
                  className="vp-btn vp-btn--primary"
                  onClick={onSubmit}
                  disabled={submitting || !zip || verify.state !== 'ok'}
                >
                  {submitting ? 'Submitting…' : 'Submit for QA'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
