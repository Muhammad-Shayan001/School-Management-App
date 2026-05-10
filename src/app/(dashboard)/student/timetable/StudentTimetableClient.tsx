'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, User } from 'lucide-react';
import { getStudentTimetable } from '@/app/_lib/actions/timetable';
import { PageSpinner } from '@/app/_components/ui/spinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentTimetableClient() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTimetable() {
      setIsLoading(true);
      const { data, error } = await getStudentTimetable();
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

  if (error) {
    return (
      <div className="glass-card p-12 text-center">
        <Calendar className="h-12 w-12 text-danger mx-auto mb-3 opacity-50" />
        <p className="text-text-primary font-medium">{error}</p>
        <p className="text-sm text-text-tertiary mt-1">Please contact your administrator if this is a mistake.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Timetable</h1>
        <p className="mt-1 text-sm text-text-secondary">Your weekly class schedule</p>
      </div>

      <div className="glass-card overflow-hidden">
        {timetable.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary font-medium">No timetable entries found for your class.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background-secondary text-text-secondary font-medium border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-4">Day</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Teacher</th>
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
                        <BookOpen className="h-4 w-4 mr-2 text-accent" />
                        {entry.subject?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-text-tertiary" />
                        {entry.teacher?.full_name || '-'}
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
