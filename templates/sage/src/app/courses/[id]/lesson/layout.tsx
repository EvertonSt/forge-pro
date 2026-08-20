import { courses } from '@/lib/data';

export function generateStaticParams() {
  return courses.map((course) => ({ id: course.id }));
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
