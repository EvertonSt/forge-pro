'use client';
import { useState } from 'react';
import Link from 'next/link';
import { courses } from '@/lib/data';

export default function Courses() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<string>('popular');

  const categories = [...new Set(courses.map(c => c.category))];

  let filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchLevel = level === 'all' || c.level.toLowerCase() === level;
    const matchCategory = category === 'all' || c.category === category;
    return matchSearch && matchLevel && matchCategory;
  });

  if (sort === 'popular') filtered.sort((a, b) => b.enrolled - a.enrolled);
  else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === 'newest') filtered.sort((a, b) => b.reviews - a.reviews);
  else if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);

  return (
    <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'clamp(1rem, 3vw, 2rem)', paddingBlock: 'var(--space-xl)' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ marginBottom: 'var(--space-xs)' }}>Course Catalog</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore our curated collection of expert-led courses.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <input type="search" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search courses" style={{ flex: '1 1 200px', padding: '0.6rem 1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
        <select value={level} onChange={e => setLevel(e.target.value)} aria-label="Filter by level" style={{ padding: '0.6rem 1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}>
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category" style={{ padding: '0.6rem 1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}>
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort by" style={{ padding: '0.6rem 1rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }}>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low → High</option>
        </select>
      </div>

      {/* Results */}
      <div style={{ marginBottom: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {filtered.length} course{filtered.length !== 1 ? 's' : ''} found
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 'var(--space-lg)' }}>
        {filtered.map(course => (
          <Link key={course.id} href={`/courses/${course.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column' }}>
            <img src={course.image} alt="" loading="lazy" width={600} height={340} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: 'var(--space-md)' }} />
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <span className={`tag tag-level-${course.level.toLowerCase()}`}>{course.level}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{course.category}</span>
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>{course.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>
            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>⭐ {course.rating} ({course.reviews.toLocaleString()})</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'var(--space-sm)' }}>{course.lessons} lessons · {course.duration}</span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>${course.price}</span>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No courses match your filters. Try adjusting your search.</p>
        </div>
      )}
    </div>
  );
}
