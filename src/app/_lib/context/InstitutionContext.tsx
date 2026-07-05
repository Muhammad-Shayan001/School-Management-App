'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/app/_lib/store/auth-store';

export type InstitutionType = 'school' | 'college' | 'university' | 'academy';

interface Terminology {
  unit: string;
  unitPlural: string;
  selectUnit: string;
  addUnit: string;
  unitManagement: string;
  unitResult: string;
  myUnits: string;
}

interface InstitutionContextType {
  institutionType: InstitutionType;
  setInstitutionType: (type: InstitutionType) => void;
  t: (key: keyof Terminology) => string;
  isLoading: boolean;
}

const defaultTerminology: Record<InstitutionType, Terminology> = {
  school: {
    unit: 'Class',
    unitPlural: 'Classes',
    selectUnit: 'Select Class',
    addUnit: 'Add Class',
    unitManagement: 'Class Management',
    unitResult: 'Class Result',
    myUnits: 'My Classes',
  },
  college: {
    unit: 'Program',
    unitPlural: 'Programs',
    selectUnit: 'Select Program',
    addUnit: 'Add Program',
    unitManagement: 'Program Management',
    unitResult: 'Program Result',
    myUnits: 'My Programs',
  },
  university: {
    unit: 'Semester',
    unitPlural: 'Semesters',
    selectUnit: 'Select Semester',
    addUnit: 'Add Semester',
    unitManagement: 'Semester Management',
    unitResult: 'Semester Result',
    myUnits: 'My Semesters',
  },
  academy: {
    unit: 'Course',
    unitPlural: 'Courses',
    selectUnit: 'Select Course',
    addUnit: 'Add Course',
    unitManagement: 'Course Management',
    unitResult: 'Course Completion Result',
    myUnits: 'My Courses',
  }
};

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export function InstitutionProvider({ children }: { children: React.ReactNode }) {
  const [institutionType, setInstitutionType] = useState<InstitutionType>('school');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    // If user has school_id in user metadata, we can fetch it.
    // Or we rely on layout to fetch and pass it down, but keeping it generic for now.
    // We will initialize it from local storage or API based on profile.
    const fetchInstitutionType = async () => {
      try {
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        // Try fetching from localStorage first for instant load
        const cachedType = localStorage.getItem('institution_type') as InstitutionType;
        if (cachedType) {
          setInstitutionType(cachedType);
        }

        // Always re-validate with backend
        const response = await fetch('/api/schools/current');
        if (response.ok) {
          const data = await response.json();
          if (data?.institution_type) {
            setInstitutionType(data.institution_type);
            localStorage.setItem('institution_type', data.institution_type);
          }
        }
      } catch (err) {
        console.error('Failed to load institution type', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstitutionType();
  }, [user]);

  const t = (key: keyof Terminology) => {
    return defaultTerminology[institutionType][key] || key;
  };

  return (
    <InstitutionContext.Provider value={{ institutionType, setInstitutionType, t, isLoading }}>
      {children}
    </InstitutionContext.Provider>
  );
}

export function useTerminology() {
  const context = useContext(InstitutionContext);
  if (context === undefined) {
    throw new Error('useTerminology must be used within an InstitutionProvider');
  }
  return context;
}
