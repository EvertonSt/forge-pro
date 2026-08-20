import type { Metadata } from 'next';
import { NewSubmissionForm } from '@/components/vendor/NewSubmissionForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Forge Pro — New submission' };

export default function NewSubmissionPage() {
  return (
    <div>
      <div className="vp-page-head">
        <div>
          <h1 className="vp-page-title">New submission</h1>
          <p className="vp-page-sub">
            Three steps: catalog details, prove your preview URL, then upload the artifact. The QA gate takes
            it from there.
          </p>
        </div>
      </div>
      <NewSubmissionForm />
    </div>
  );
}
