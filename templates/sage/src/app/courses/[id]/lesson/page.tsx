'use client';
import { useState, use } from 'react';
import Link from 'next/link';
import { getCourseById, getCourseLessons } from '@/lib/data';

export default function LessonPlayer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = getCourseById(id);
  const lessons = getCourseLessons(id);
  const [currentIdx, setCurrentIdx] = useState(Math.max(0, lessons.findIndex(l => !l.completed)));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [note, setNote] = useState('');

  if (!course || lessons.length === 0) {
    return (
      <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', padding: 'var(--space-2xl)', textAlign: 'center' }}>
        <h1>Course Not Found</h1>
        <Link href="/courses" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>Browse Courses</Link>
      </div>
    );
  }

  const current = lessons[currentIdx];
  const completedCount = lessons.filter(l => l.completed).length;
  const progress = Math.round((completedCount / lessons.length) * 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: sidebarOpen ? '1fr 320px' : '1fr', minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Main content */}
      <div style={{ padding: 'var(--space-xl)', maxWidth: 900 }}>
        {/* Video placeholder */}
        <div style={{ aspectRatio: '16/9', background: '#0f172a', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-lg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>▶</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Video Player Placeholder</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
            <span>Progress</span>
            <span>{completedCount}/{lessons.length} lessons ({progress}%)</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 3 }} />
          </div>
        </div>

        {/* Lesson info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-xs)' }}>{current.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{course.instructor} · {current.duration}</p>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-outline btn-sm" aria-label="Toggle sidebar">
            {sidebarOpen ? 'Hide' : 'Show'} Sidebar
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-2xl)' }}>
          <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="btn btn-outline btn-sm" style={{ opacity: currentIdx === 0 ? 0.5 : 1 }}>← Previous</button>
          <button onClick={() => { if (currentIdx < lessons.length - 1) setCurrentIdx(currentIdx + 1); }} disabled={currentIdx === lessons.length - 1} className="btn btn-primary btn-sm" style={{ opacity: currentIdx === lessons.length - 1 ? 0.5 : 1 }}>Next →</button>
        </div>

        {/* Notes */}
        <section>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>Your Notes</h2>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Take notes for this lesson..." style={{ width: '100%', minHeight: 120, padding: 'var(--space-md)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', resize: 'vertical' }} />
        </section>
      </div>

      {/* Sidebar - Lesson List */}
      {sidebarOpen && (
        <aside style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-sidebar)', padding: 'var(--space-lg)', overflowY: 'auto', maxHeight: 'calc(100vh - 3.5rem)', position: 'sticky', top: '3.5rem' }} className="lesson-sidebar">
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <Link href={`/courses/${id}`} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>← {course.title}</Link>
          </div>
          <h3 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>Course Content</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {lessons.map((lesson, i) => (
              <button key={lesson.id} onClick={() => setCurrentIdx(i)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm)', background: i === currentIdx ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'var(--text)', fontSize: '0.85rem' }}>
                <span style={{ color: lesson.completed ? 'var(--success)' : 'var(--text-secondary)', flexShrink: 0 }}>{lesson.completed ? '✅' : i === currentIdx ? '▶' : '○'}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', flexShrink: 0 }}>{lesson.duration}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <style>{`
        @media (max-width: 900px) {
          .lesson-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
