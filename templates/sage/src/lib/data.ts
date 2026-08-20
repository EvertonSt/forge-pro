export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  rating: number;
  reviews: number;
  lessons: number;
  duration: string;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  image: string;
  enrolled: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  section: string;
}

export const courses: Course[] = [
  {
    id: 'react-mastery',
    title: 'React Mastery: From Fundamentals to Advanced Patterns',
    description: 'Master React from scratch. Learn hooks, context, performance optimization, and modern patterns used by top companies.',
    instructor: 'Sarah Chen',
    rating: 4.9,
    reviews: 2847,
    lessons: 48,
    duration: '24h 30m',
    price: 89,
    level: 'Intermediate',
    category: 'Web Development',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=340&fit=crop',
    enrolled: 12450,
  },
  {
    id: 'python-data',
    title: 'Python for Data Science & Machine Learning',
    description: 'Complete guide to Python programming for data analysis, visualization, and machine learning with hands-on projects.',
    instructor: 'Dr. James Wright',
    rating: 4.8,
    reviews: 3201,
    lessons: 62,
    duration: '32h 15m',
    price: 99,
    level: 'Beginner',
    category: 'Data Science',
    image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=340&fit=crop',
    enrolled: 18920,
  },
  {
    id: 'system-design',
    title: 'System Design Interview Preparation',
    description: 'Ace your system design interviews. Learn to architect scalable systems used by millions.',
    instructor: 'Mike Torres',
    rating: 4.7,
    reviews: 1523,
    lessons: 36,
    duration: '18h 45m',
    price: 79,
    level: 'Advanced',
    category: 'Computer Science',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=340&fit=crop',
    enrolled: 8340,
  },
  {
    id: 'ui-design',
    title: 'UI/UX Design: From Wireframe to Prototype',
    description: 'Learn professional UI/UX design. Master Figma, design systems, and user research methods.',
    instructor: 'Emma Davis',
    rating: 4.9,
    reviews: 2156,
    lessons: 44,
    duration: '22h 00m',
    price: 89,
    level: 'Beginner',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=340&fit=crop',
    enrolled: 14200,
  },
  {
    id: 'fullstack-nextjs',
    title: 'Full-Stack Development with Next.js 15',
    description: 'Build production-ready applications with Next.js, React Server Components, and modern deployment.',
    instructor: 'Sarah Chen',
    rating: 4.8,
    reviews: 1876,
    lessons: 52,
    duration: '28h 00m',
    price: 99,
    level: 'Intermediate',
    category: 'Web Development',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=340&fit=crop',
    enrolled: 9870,
  },
  {
    id: 'devops-cloud',
    title: 'Cloud & DevOps: AWS, Docker, and CI/CD',
    description: 'Master cloud infrastructure and DevOps practices. Deploy, scale, and monitor production systems.',
    instructor: 'Dr. James Wright',
    rating: 4.6,
    reviews: 982,
    lessons: 40,
    duration: '20h 30m',
    price: 79,
    level: 'Advanced',
    category: 'DevOps',
    image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&h=340&fit=crop',
    enrolled: 5640,
  },
];

export const enrolledCourses = [
  { courseId: 'react-mastery', progress: 72, completedLessons: 35 },
  { courseId: 'python-data', progress: 45, completedLessons: 28 },
  { courseId: 'system-design', progress: 15, completedLessons: 5 },
];

export function getCourseById(id: string): Course | undefined {
  return courses.find(c => c.id === id);
}

export function getCourseLessons(courseId: string): Lesson[] {
  const course = getCourseById(courseId);
  if (!course) return [];
  const sections = ['Introduction', 'Core Concepts', 'Advanced Topics', 'Real-World Projects'];
  const lessonsPerSection = Math.ceil(course.lessons / sections.length);
  const lessons: Lesson[] = [];
  let count = 0;
  sections.forEach((section, si) => {
    for (let i = 0; i < lessonsPerSection && count < course.lessons; i++) {
      count++;
      lessons.push({
        id: `${courseId}-l${count}`,
        title: `${section} — Lesson ${i + 1}`,
        duration: `${15 + Math.floor(Math.random() * 30)}m`,
        completed: count <= (enrolledCourses.find(e => e.courseId === courseId)?.completedLessons || 0),
        section,
      });
    }
  });
  return lessons;
}
