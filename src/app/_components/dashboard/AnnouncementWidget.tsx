'use client';

import { useState, useEffect } from 'react';
import { getRelevantAnnouncements } from '@/app/_lib/actions/announcements';
import { Badge } from '@/app/_components/ui/badge';
import { Card } from '@/app/_components/ui/card';
import { Megaphone, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/app/_lib/utils/cn';
import { formatDate } from '@/app/_lib/utils/format';

export function AnnouncementWidget({ limit = 3, role = 'student' }: { limit?: number; role?: string }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRelevantAnnouncements().then(res => {
      setAnnouncements(res.data?.slice(0, limit) || []);
      setIsLoading(false);
    });
  }, [limit]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-bg-tertiary animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-12 w-12 rounded-full bg-bg-tertiary flex items-center justify-center mb-4 opacity-50">
          <Megaphone className="h-6 w-6 text-text-tertiary" />
        </div>
        <p className="text-sm font-bold text-text-secondary">No recent updates</p>
        <p className="text-[10px] text-text-tertiary mt-1">Check back later for school news</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((ann) => (
        <Link 
          key={ann.id} 
          href={`/${role}/announcements`}
          className="block group"
        >
          <div className="flex gap-4 p-4 rounded-2xl bg-bg-tertiary hover:bg-white hover:shadow-lg hover:shadow-accent/5 border border-transparent hover:border-accent/10 transition-all duration-300">
            <div className={cn(
              "w-1 rounded-full",
              ann.priority === 'urgent' ? "bg-red-500" : 
              ann.priority === 'important' ? "bg-amber-500" : "bg-accent"
            )} />
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                 <h4 className="text-xs font-black text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                   {ann.title}
                 </h4>
                 {ann.priority === 'urgent' && <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />}
              </div>
              <p className="text-[10px] text-text-secondary font-medium line-clamp-1 opacity-70">
                {ann.content}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Clock className="h-2.5 w-2.5 text-text-tertiary" />
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-tighter">
                  {formatDate(ann.created_at)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      ))}
      
      <Link 
        href={`/${role}/announcements`}
        className="block text-center py-2 text-[10px] font-black text-accent uppercase tracking-widest hover:underline decoration-2"
      >
        View All Notices
      </Link>
    </div>
  );
}
