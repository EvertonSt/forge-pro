'use client';
import { useState } from 'react';
import { transactions } from '@/lib/data';

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('date-desc');
  const [page, setPage] = useState(0);
  const perPage = 8;

  const categories = [...new Set(transactions.map(t => t.category))];

  let filtered = transactions.filter(t => {
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || t.category === category;
    return matchSearch && matchCat;
  });

  if (sort === 'date-desc') filtered.sort((a, b) => b.date.localeCompare(a.date));
  else if (sort === 'date-asc') filtered.sort((a, b) => a.date.localeCompare(b.date));
  else if (sort === 'amount-desc') filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  else if (sort === 'amount-asc') filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Transactions</h1>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <input type="search" placeholder="Search transactions..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} aria-label="Search transactions" style={{ flex: '1 1 200px' }} />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(0); }} aria-label="Filter category">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort by">
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      <div style={{ marginBottom: 'var(--space-sm)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
          </thead>
          <tbody>
            {paged.map(t => (
              <tr key={t.id}>
                <td style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                <td style={{ fontWeight: 500 }}>{t.description}</td>
                <td><span className="badge" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>{t.category}</span></td>
                <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{t.account}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: t.amount < 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn btn-ghost btn-sm" style={{ opacity: page === 0 ? 0.5 : 1 }}>← Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn btn-ghost btn-sm" style={{ opacity: page >= totalPages - 1 ? 0.5 : 1 }}>Next →</button>
        </div>
      )}
    </div>
  );
}
