'use client';

import { useEffect, useState } from 'react';
import { useCampusStore, CampusInfo as Campus } from '@/app/_lib/store/campus-store';
import { ChevronDown, MapPin } from 'lucide-react';
import { createClient } from '@/app/_lib/supabase/client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CampusSwitcher() {
  const { campuses, activeCampus: selectedCampus, setCampuses, setActiveCampus: setSelectedCampus } = useCampusStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadCampuses() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, school_id')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin' && profile.role !== 'super_admin') {
        return; // Only principals/admins can switch campuses freely in this UI
      }

      const { data } = await supabase
        .from('campuses')
        .select('id, name, code, logo_url, theme_color')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .order('name');

      if (data && data.length > 0) {
        setCampuses(data);
        if (!selectedCampus || !data.find(c => c.id === selectedCampus.id)) {
          setSelectedCampus(data[0]);
        }
      }
    }
    loadCampuses();
  }, []);

  if (campuses.length <= 1) return null; // Don't show if 0 or 1 campus

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg border border-white/10"
      >
        <MapPin className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm truncate max-w-[150px]">
          {selectedCampus?.name || 'Select Campus'}
        </span>
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Switch Campus
          </div>
          {campuses.map((campus) => (
            <button
              key={campus.id}
              onClick={() => {
                setSelectedCampus(campus);
                setIsOpen(false);
                router.refresh(); // Refresh current page to apply new campus filter
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                selectedCampus?.id === campus.id ? 'bg-primary/5 dark:bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {campus.logo_url ? (
                  <Image src={campus.logo_url} alt={campus.name} width={24} height={24} className="object-cover" />
                ) : (
                  <MapPin className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <div className="flex-1 truncate">
                <div className="text-sm font-medium">{campus.name}</div>
                {campus.campus_code && <div className="text-xs opacity-70">{campus.campus_code}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
