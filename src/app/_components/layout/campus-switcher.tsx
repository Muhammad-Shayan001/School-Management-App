'use client';

import { useEffect, useRef, useState } from 'react';
import { useCampusStore } from '@/app/_lib/store/campus-store';
import { getAdminCampuses, setActiveCampusContext } from '@/app/_lib/actions/campuses';
import { cn } from '@/app/_lib/utils/cn';
import { Building2, ChevronDown, Check, Plus, MapPin, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CampusInfo } from '@/app/_lib/store/campus-store';

interface CampusSwitcherProps {
  collapsed?: boolean;
  variant?: 'sidebar' | 'navbar';
  userRole?: string;
  userSchoolId?: string | null;
}

/**
 * Campus Switcher — allows admins to switch between their campuses.
 * Renders as a dropdown in sidebar or navbar.
 * Only visible for admin/super_admin roles with multiple campuses.
 */
export function CampusSwitcher({ collapsed = false, variant = 'sidebar', userRole, userSchoolId }: CampusSwitcherProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const {
    activeCampus,
    campuses,
    isMultiCampus,
    setCampuses,
    switchCampus,
  } = useCampusStore();

  // Load campuses on mount
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      setIsLoading(false);
      return;
    }

    async function loadCampuses() {
      try {
        const { data } = await getAdminCampuses();
        if (data && data.length > 0) {
          const mapped: CampusInfo[] = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            logo_url: s.logo_url,
            theme_color: s.theme_color || '#6366f1',
            campus_type: s.campus_type,
            campus_code: s.campus_code,
            is_active: s.is_active !== false,
          }));
          setCampuses(mapped);
        } else if (userSchoolId) {
          // Fallback: use the user's school_id as single campus
          setCampuses([{
            id: userSchoolId,
            name: 'Main Campus',
            logo_url: null,
            theme_color: '#6366f1',
            campus_type: 'main',
            campus_code: null,
            is_active: true,
          }]);
        }
      } catch (err) {
        console.error('Failed to load campuses:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCampuses();
  }, [userRole, userSchoolId, setCampuses]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render for non-admin roles or single campus
  if (userRole !== 'admin' && userRole !== 'super_admin') return null;
  if (isLoading) {
    return (
      <div className={cn(
        'mx-3 mb-3 px-3 py-2.5 rounded-2xl bg-bg-tertiary/30 animate-pulse',
        collapsed && 'mx-2 px-2'
      )}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-bg-tertiary" />
          {!collapsed && <div className="h-4 w-24 rounded bg-bg-tertiary" />}
        </div>
      </div>
    );
  }

  if (campuses.length === 0) return null;

  async function handleSwitch(campusId: string) {
    switchCampus(campusId);
    setIsOpen(false);
    // Update backend context
    await setActiveCampusContext(campusId);
    // Refresh the page to reload data with new campus context
    router.refresh();
  }

  // Compact view for sidebar collapsed state
  if (collapsed && variant === 'sidebar') {
    return (
      <div className="mx-3 mb-3" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/15 flex items-center justify-center hover:from-accent/20 hover:to-accent/10 transition-all duration-300 group relative"
          title={activeCampus?.name || 'Switch Campus'}
        >
          <Building2 className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
          {isMultiCampus && (
            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-accent text-white text-[7px] font-black flex items-center justify-center shadow-lg">
              {campuses.length}
            </div>
          )}
        </button>

        {isOpen && (
          <div className="absolute left-[72px] top-auto mt-[-40px] z-[100] w-64 bg-white/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="p-3 border-b border-border/30">
              <p className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em]">Switch Campus</p>
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5">
              {campuses.map(campus => (
                <button
                  key={campus.id}
                  onClick={() => handleSwitch(campus.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                    campus.id === activeCampus?.id
                      ? 'bg-accent/10 text-accent'
                      : 'hover:bg-bg-tertiary/50 text-text-secondary'
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20 overflow-hidden"
                    style={{ backgroundColor: campus.theme_color || '#6366f1' }}
                  >
                    {campus.logo_url && !imageErrors[campus.id] ? (
                      <img 
                        src={campus.logo_url} 
                        alt="" 
                        className="h-full w-full object-cover" 
                        onError={() => handleImageError(campus.id)}
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{campus.name}</p>
                    {campus.campus_type && (
                      <p className="text-[9px] text-text-tertiary uppercase tracking-wider">{campus.campus_type}</p>
                    )}
                  </div>
                  {campus.id === activeCampus?.id && (
                    <Check className="h-4 w-4 text-accent flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className="mx-4 mb-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-2xl border transition-all duration-300 group',
            isOpen
              ? 'bg-accent/10 border-accent/20 shadow-lg shadow-accent/5'
              : 'bg-white/60 border-border/30 hover:border-accent/20 hover:bg-white/80 shadow-sm'
          )}
        >
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20 overflow-hidden shadow-md transition-transform group-hover:scale-105"
            style={{ backgroundColor: activeCampus?.theme_color || '#6366f1' }}
          >
            {activeCampus?.logo_url && !imageErrors[activeCampus.id] ? (
              <img 
                src={activeCampus.logo_url} 
                alt="" 
                className="h-full w-full object-cover" 
                onError={() => handleImageError(activeCampus.id)}
              />
            ) : (
              <Building2 className="h-4.5 w-4.5 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[11px] font-black text-text-primary truncate leading-tight">
              {activeCampus?.name || 'Select Campus'}
            </p>
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">
              {isMultiCampus ? `${campuses.length} campuses` : 'Primary Campus'}
            </p>
          </div>
          {isMultiCampus && (
            <ChevronDown className={cn(
              'h-4 w-4 text-text-tertiary flex-shrink-0 transition-transform duration-300',
              isOpen && 'rotate-180'
            )} />
          )}
        </button>

        {/* Dropdown */}
        {isOpen && isMultiCampus && (
          <div className="absolute left-0 right-0 top-full mt-2 z-[100] bg-white/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-border/30 flex items-center justify-between">
              <p className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em]">Your Campuses</p>
              <div className="h-5 px-2 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-[9px] font-black text-accent">{campuses.length}</span>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5">
              {campuses.map(campus => (
                <button
                  key={campus.id}
                  onClick={() => handleSwitch(campus.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                    campus.id === activeCampus?.id
                      ? 'bg-accent/10 border border-accent/15'
                      : 'hover:bg-bg-tertiary/50 border border-transparent'
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20 overflow-hidden shadow-sm"
                    style={{ backgroundColor: campus.theme_color || '#6366f1' }}
                  >
                    {campus.logo_url ? (
                      <img src={campus.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-xs font-bold truncate',
                      campus.id === activeCampus?.id ? 'text-accent' : 'text-text-primary'
                    )}>
                      {campus.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {campus.campus_type && (
                        <span className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider bg-bg-tertiary/50 px-1.5 py-0.5 rounded">
                          {campus.campus_type}
                        </span>
                      )}
                      {!campus.is_active && (
                        <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  {campus.id === activeCampus?.id && (
                    <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {/* Add Campus Link */}
            <div className="p-2 border-t border-border/30">
              <a
                href="/admin/campuses"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-accent hover:bg-accent/5 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Manage Campuses
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Navbar variant (compact)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => isMultiCampus && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all duration-300',
          isOpen
            ? 'bg-accent/10 border-accent/20'
            : 'bg-white/50 border-border/30 hover:border-accent/20',
          !isMultiCampus && 'cursor-default'
        )}
      >
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-white/20"
          style={{ backgroundColor: activeCampus?.theme_color || '#6366f1' }}
        >
          {activeCampus?.logo_url && !imageErrors[activeCampus.id] ? (
            <img 
              src={activeCampus.logo_url} 
              alt="" 
              className="h-full w-full object-cover" 
              onError={() => handleImageError(activeCampus.id)}
            />
          ) : (
            <Building2 className="h-3.5 w-3.5 text-white" />
          )}
        </div>
        <span className="text-[11px] font-black text-text-primary uppercase tracking-wider truncate max-w-[140px]">
          {activeCampus?.name || 'Campus'}
        </span>
        {isMultiCampus && (
          <ChevronDown className={cn(
            'h-3.5 w-3.5 text-text-tertiary transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        )}
      </button>

      {isOpen && isMultiCampus && (
        <div className="absolute right-0 top-full mt-2 z-[100] w-64 bg-white/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-border/30">
            <p className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em]">Switch Campus</p>
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {campuses.map(campus => (
              <button
                key={campus.id}
                onClick={() => handleSwitch(campus.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                  campus.id === activeCampus?.id
                    ? 'bg-accent/10'
                    : 'hover:bg-bg-tertiary/50'
                )}
              >
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm"
                  style={{ backgroundColor: campus.theme_color || '#6366f1' }}
                >
                  {campus.logo_url && !imageErrors[campus.id] ? (
                    <img 
                      src={campus.logo_url} 
                      alt="" 
                      className="h-full w-full object-cover" 
                      onError={() => handleImageError(campus.id)}
                    />
                  ) : (
                    <Building2 className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{campus.name}</p>
                </div>
                {campus.id === activeCampus?.id && (
                  <Check className="h-4 w-4 text-accent" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
