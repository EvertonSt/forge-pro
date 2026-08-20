export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="w-full max-w-xl rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">
          Forge Pro <span className="text-blue-600">App</span>
        </h1>
        <p className="mt-3 text-neutral-600">
          This is the stateful half of the marketplace — checkout, account
          dashboards, the vendor portal, and the AI endpoints live here.
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          In the scaffold, nothing is wired yet. Supabase auth + Stripe checkout
          land in Session 4; the AI Concierge in Session 5.
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          <li>
            <a href="/vendor" className="text-blue-600 hover:underline">
              Vendor portal — submit templates &amp; components for QA
            </a>
          </li>
          <li>
            <a href="/api/health" className="text-blue-600 hover:underline">
              /api/health — integration status
            </a>
          </li>
          <li>
            <a href="http://localhost:4321" className="text-blue-600 hover:underline">
              Storefront (Astro) — http://localhost:4321
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
