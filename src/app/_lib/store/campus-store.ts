'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CampusInfo {
  id: string;
  name: string;
  logo_url: string | null;
  theme_color: string;
  campus_type?: string;
  campus_code?: string | null;
  is_active?: boolean;
}

interface CampusState {
  campuses: CampusInfo[];
  activeCampus: CampusInfo | null;
  isMultiCampus: boolean;
  setCampuses: (campuses: CampusInfo[]) => void;
  setActiveCampus: (campus: CampusInfo | null) => void;
  switchCampus: (campusId: string) => void;
}

export const useCampusStore = create<CampusState>()(
  persist(
    (set, get) => ({
      campuses: [],
      activeCampus: null,
      isMultiCampus: false,
      setCampuses: (campuses) => {
        const currentActive = get().activeCampus;
        const freshActive = currentActive ? campuses.find(c => c.id === currentActive.id) : null;
        
        set({ 
          campuses, 
          isMultiCampus: campuses.length > 1,
          activeCampus: freshActive || (campuses.length > 0 ? campuses[0] : null)
        });
      },
      setActiveCampus: (campus) => {
        set({ activeCampus: campus });
        if (typeof window !== 'undefined' && campus?.theme_color) {
          document.documentElement.style.setProperty('--accent', campus.theme_color);
        }
      },
      switchCampus: (campusId) => {
        const campus = get().campuses.find(c => c.id === campusId);
        if (campus) {
          get().setActiveCampus(campus);
        }
      },
    }),
    {
      name: 'campus-storage',
    }
  )
);
