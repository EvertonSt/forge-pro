'use client';
import Link from 'next/link';
import { courses } from '@/lib/data';

export default function Instructor() {
  const instructorCourses = courses.slice(0, 2);
  const stats = { students: 31370, courses: 2, reviews: 6048, rating: 4.85 };

  return (
    <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'clamp(1rem, 3vw, 2rem)', paddingBlock: 'var(--space-2xl)' }}>
      {/* Profile Header */}
      <div className="card" style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '3rem', fontFamily: 'var(--font-serif)', flexShrink: 0 }}>S</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: 'var(--space-xs)' }}>Sarah Chen</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', maxWidth: '50ch' }}>Senior engineer and educator with 10+ years of experience building scalable web applications. Previously at Google and Stripe.</p>
          <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
            <div><strong style={{ fontSize: '1.25rem' }}>{stats.students.toLocaleString()}</strong><br /><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Students</span></div>
            <div><strong style={{ fontSize: '1.25rem' }}>{stats.courses}</strong><br /><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Courses</span></div>
            <div><strong style={{ fontSize: '1.25rem' }}>⭐ {stats.rating}</strong><br /><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Average Rating</span></div>
            <div><strong style={{ fontSize: '1.25rem' }}>{stats.reviews.toLocaleString()}</strong><br /><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Reviews</span></div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <section style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>About</h2>
        <div style={{ maxWidth: 680 }}>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-md)' }}>
            I&apos;ve spent the last decade building web applications at some of the world&apos;s most demanding engineering organizations. Along the way, I discovered that my real passion is teaching—helping others skip the hard-won lessons I learned the expensive way.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-md)' }}>
            My courses focus on practical, production-ready skills. No fluff, no filler—just the patterns and practices that actually matter when you&apos;re building real systems.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            When I&apos;m not teaching, you&apos;ll find me contributing to open source, speaking at conferences, or experimenting with the latest web technologies.
          </p>
        </div>
      </section>

      {/* Courses */}
      <section>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Courses by Sarah</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))', gap: 'var(--space-lg)' }}>
          {instructorCourses.map(course => (
            <Link key={course.id} href={`/courses/${course.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-lg)' }}>
              <img src={course.image} alt="" loading="lazy" width={400} height={225} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
              <div>
                <span className={`tag tag-level-${course.level.toLowerCase()}`} style={{ marginBottom: 'var(--space-sm)' }}>{course.level}</span>
                <h3 style={{ fontSize: '1.05rem', margin: 'var(--space-sm) 0' }}>{course.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>
                <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>⭐ {course.rating} · {course.reviews.toLocaleString()} reviews · {course.enrolled.toLocaleString()} students</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
