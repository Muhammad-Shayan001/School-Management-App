'use client';

import { useEffect, useState } from 'react';
import { getSchools, createSchool } from '@/app/_lib/actions/schools';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Modal } from '@/app/_components/ui/modal';
import { Badge } from '@/app/_components/ui/badge';
import { formatDate } from '@/app/_lib/utils/format';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { School, Plus, MapPin, Phone, Mail, Lock, User } from 'lucide-react';

interface SchoolWithAdmin {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  admin: { id: string; full_name: string; email: string; status: string } | null;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolWithAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchools() {
      const { data } = await getSchools();
      setSchools((data as SchoolWithAdmin[]) || []);
      setIsLoading(false);
    }
    fetchSchools();
  }, []);

  async function handleCreateSchool(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createSchool(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setShowModal(false);
      // Refetch
      const { data } = await getSchools();
      setSchools((data as SchoolWithAdmin[]) || []);
    }
    setFormLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Schools
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage all registered schools
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/super-admin/schools/new'}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add New School
        </Button>
      </div>

      {/* Schools grid */}
      {isLoading ? (
        <PageSpinner label="Loading schools..." />
      ) : schools.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <School className="h-12 w-12 text-text-tertiary mx-auto mb-3 opacity-50" />
          <p className="text-text-secondary font-medium">No schools yet</p>
          <p className="text-sm text-text-tertiary mt-1">
            Add your first school to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {schools.map((school: any) => (
            <div
              key={school.id}
              className="glass-card glass-card-hover p-6 space-y-5"
            >
              {/* School logo + name */}
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-bg-tertiary flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/50 shadow-sm">
                  {school.logo_url ? (
                    <img src={school.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <School className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary truncate">
                      {school.name}
                    </h3>
                    {school.is_active ? (
                      <Badge variant="success" className="text-[9px] uppercase tracking-wider">Active</Badge>
                    ) : (
                      <Badge variant="default" className="text-[9px] uppercase tracking-wider">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-xs font-black text-accent uppercase tracking-widest mt-1">
                    CODE: {school.code || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <div className="h-7 w-7 rounded-lg bg-bg-tertiary flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                  </div>
                  <span className="truncate">{school.city}, {school.country}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                   <div className="h-7 w-7 rounded-lg bg-bg-tertiary flex items-center justify-center">
                    <Phone className="h-3.5 w-3.5 text-text-tertiary" />
                  </div>
                  <span>{school.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                   <div className="h-7 w-7 rounded-lg bg-bg-tertiary flex items-center justify-center">
                    <Mail className="h-3.5 w-3.5 text-text-tertiary" />
                  </div>
                  <span className="truncate">{school.email}</span>
                </div>
              </div>

              {/* Governance */}
              <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider">
                    Governance
                  </p>
                  <p className="text-xs font-bold text-text-primary mt-1">
                    {school.principal_name || 'No Principal Assigned'}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50">
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
