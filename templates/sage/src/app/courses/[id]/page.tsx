'use client';
import { useState, use } from 'react';
import Link from 'next/link';
import { getCourseById, getCourseLessons } from '@/lib/data';

export default function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = getCourseById(id);
  const [openSection, setOpenSection] = useState<string | null>('Introduction');
  const [enrolled, setEnrolled] = useState(false);

  if (!course) {
    return (
      <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', padding: 'var(--space-2xl)', textAlign: 'center' }}>
        <h1>Course Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-md) 0' }}>This course doesn&apos;t exist.</p>
        <Link href="/courses" className="btn btn-primary">Browse Courses</Link>
      </div>
    );
  }

  const lessons = getCourseLessons(id);
  const sections = [...new Set(lessons.map(l => l.section))];
  const completedCount = lessons.filter(l => l.completed).length;

  const reviews = [
    { name: 'Alex Johnson', rating: 5, text: 'Incredible course. The instructor explains complex concepts in a way that just clicks.' },
    { name: 'Maria Santos', rating: 5, text: 'Hands-down the best investment in my learning this year. Worth every penny.' },
    { name: 'David Kim', rating: 4, text: 'Great content and structure. Would love even more real-world projects.' },
  ];

  return (
    <div style={{ maxWidth: 'var(--max-w)', marginInline: 'auto', paddingInline: 'clamp(1rem, 3vw, 2rem)', paddingBlock: 'var(--space-xl)' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <Link href="/courses" style={{ color: 'var(--text-secondary)' }}>Courses</Link>
        <span style={{ margin: '0 var(--space-sm)' }}>/</span>
        <span>{course.title}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-2xl)', alignItems: 'start' }} className="course-layout">
        <div>
          <img src={course.image} alt="" width={1200} height={675} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-xl)' }} />

          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <span className={`tag tag-level-${course.level.toLowerCase()}`}>{course.level}</span>
            <span className="tag" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>{course.category}</span>
          </div>

          <h1 style={{ marginBottom: 'var(--space-md)' }}>{course.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 'var(--space-xl)' }}>{course.description}</p>

          {/* Curriculum */}
          <section style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-lg)' }}>Curriculum</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {sections.map(section => {
                const sectionLessons = lessons.filter(l => l.section === section);
                const sectionCompleted = sectionLessons.filter(l => l.completed).length;
                const isOpen = openSection === section;
                return (
                  <div key={section} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <button onClick={() => setOpenSection(isOpen ? null : section)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md) var(--space-lg)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 600, textAlign: 'left' }}>
                      <span>{section}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {sectionCompleted}/{sectionLessons.length} · <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        {sectionLessons.map((lesson, i) => (
                          <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-lg)', borderBottom: i < sectionLessons.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              <span style={{ color: lesson.completed ? 'var(--success)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {lesson.completed ? '✅' : '○'}
                              </span>
                              <span style={{ color: lesson.completed ? 'var(--text-secondary)' : 'var(--text)', fontSize: '0.9rem' }}>{lesson.title}</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Instructor */}
          <section style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-lg)' }}>Instructor</h2>
            <div className="card" style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem', flexShrink: 0 }}>{course.instructor.charAt(0)}</div>
              <div>
                <h3 style={{ marginBottom: 'var(--space-xs)' }}>{course.instructor}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Senior engineer and educator with 10+ years of experience. Previously at Google and Stripe. Passionate about making complex topics accessible.</p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 style={{ marginBottom: 'var(--space-lg)' }}>Student Reviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {reviews.map((review, i) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                    <strong>{review.name}</strong>
                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(review.rating)}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{review.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar - Pricing Card */}
        <div className="card" style={{ position: 'sticky', top: '5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 'var(--space-md)' }}>${course.price}</div>
          {enrolled ? (
            <Link href={`/courses/${id}/lesson`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Continue Learning</Link>
          ) : (
            <button onClick={() => setEnrolled(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Enroll Now</button>
          )}
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 'var(--space-sm)' }}>30-day money-back guarantee</p>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Lessons</span><strong>{course.lessons}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Duration</span><strong>{course.duration}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Level</span><strong>{course.level}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Rating</span><strong>⭐ {course.rating}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Enrolled</span><strong>{course.enrolled.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .course-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
