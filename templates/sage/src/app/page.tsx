'use client';
import Link from 'next/link';
import { courses, enrolledCourses, getCourseById } from '@/lib/data';

function ProgressRing({ progress, size = 60 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--accent)" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="700" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{progress}%</text>
    </svg>
  );
}

export default function Dashboard() {
  const enrolled = enrolledCourses.map(e => ({ ...e, course: getCourseById(e.courseId)! })).filter(e => e.course);
  const totalLessonsCompleted = enrolled.reduce((sum, e) => sum + e.completedLessons, 0);
  const totalHoursLearned = Math.round(totalLessonsCompleted * 0.4);
  const currentStreak = 12;

  return (
    <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'clamp(1rem, 3vw, 2rem)', paddingBlock: 'var(--space-xl)' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ marginBottom: 'var(--space-xs)' }}>Welcome back, Alex 👋</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Continue where you left off. You&apos;re making great progress!</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📚</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{enrolled.length}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Enrolled Courses</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius)', background: 'color-mix(in srgb, var(--success) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✅</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalLessonsCompleted}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Lessons Completed</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius)', background: 'color-mix(in srgb, var(--warning) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⏱️</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalHoursLearned}h</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Hours Learned</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius)', background: 'color-mix(in srgb, #f59e0b 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔥</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{currentStreak} days</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Learning Streak</div>
          </div>
        </div>
      </div>

      {/* Continue Learning */}
      <section style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2>Continue Learning</h2>
          <Link href="/courses" style={{ fontSize: '0.9rem' }}>Browse All →</Link>
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {enrolled.map(({ course, progress, completedLessons }) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-lg)', alignItems: 'center', textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }}>
              <div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  <span className={`tag tag-level-${course.level.toLowerCase()}`}>{course.level}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{course.category}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-xs)' }}>{course.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>{course.instructor} · {completedLessons}/{course.lessons} lessons</p>
                <div style={{ marginTop: 'var(--space-sm)', height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
              </div>
              <ProgressRing progress={progress} />
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended */}
      <section>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Recommended for You</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 'var(--space-md)' }}>
          {courses.filter(c => !enrolledCourses.find(e => e.courseId === c.id)).slice(0, 3).map(course => (
            <Link key={course.id} href={`/courses/${course.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
              <img src={course.image} alt="" loading="lazy" width={600} height={340} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: 'var(--space-md)' }} />
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <span className={`tag tag-level-${course.level.toLowerCase()}`}>{course.level}</span>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-xs)' }}>{course.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, marginBottom: 'var(--space-sm)' }}>{course.instructor}</p>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>${course.price}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>⭐ {course.rating} ({course.reviews.toLocaleString()})</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
