'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Users } from 'lucide-react';
import { getTeacherTimetable } from '@/app/_lib/actions/timetable';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { Button } from '@/app/_components/ui/button';

import Link from 'next/link';

export default function TeacherTimetableClient({ isClassTeacher }: { isClassTeacher?: boolean }) {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTimetable() {
      setIsLoading(true);
      const { data, error } = await getTeacherTimetable();
      if (error) {
        setError(error);
      } else if (data) {
        setTimetable(data);
      }
      setIsLoading(false);
    }
    loadTimetable();
  }, []);

  if (isLoading) return <PageSpinner label="Loading your schedule..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Timetable</h1>
          <p className="mt-1 text-sm text-text-secondary">Your personal teaching schedule</p>
        </div>
        {isClassTeacher && (
          <Link href="/teacher/timetable/builder">
            <Button className="btn-primary">
              Build Class Timetable
            </Button>
          </Link>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        {timetable.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary font-medium">No teaching assignments found for your account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background-secondary text-text-secondary font-medium border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4">Day</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Subject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {timetable.map((entry) => (
                  <tr key={entry.id} className="hover:bg-background-secondary/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{entry.day_of_week}</td>
                    <td className="px-6 py-4">{entry.period_number}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-text-secondary">
                        <Clock className="h-4 w-4 mr-2" />
                        {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-accent" />
                        {entry.class?.name} {entry.class?.section || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-text-tertiary" />
                        {entry.subject?.name || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
