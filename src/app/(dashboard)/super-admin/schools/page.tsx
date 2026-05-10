'use client';

import { useEffect, useState } from 'react';
import { getSchools, createSchool } from '@/app/_lib/actions/schools';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Modal } from '@/app/_components/ui/modal';
import { Badge } from '@/app/_components/ui/badge';
import { formatDate } from '@/app/_lib/utils/format';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { School, Plus, MapPin, Phone, Mail } from 'lucide-react';

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
          onClick={() => setShowModal(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add School
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {schools.map((school) => (
            <div
              key={school.id}
              className="glass-card glass-card-hover p-5 space-y-4"
            >
              {/* School icon + name */}
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-accent-subtle flex items-center justify-center flex-shrink-0">
                  <School className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary truncate">
                    {school.name}
                  </h3>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    Added {formatDate(school.created_at)}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {school.address && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                    <span className="truncate">{school.address}</span>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                    <span>{school.phone}</span>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary" />
                    <span className="truncate">{school.email}</span>
                  </div>
                )}
              </div>

              {/* Admin info */}
              {school.admin && (
                <div className="pt-3 border-t border-glass-border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
                      Principal
                    </p>
                    <p className="text-xs font-medium text-text-primary mt-0.5">
                      {school.admin.full_name}
                    </p>
                  </div>
                  <Badge
                    variant={school.admin.status === 'approved' ? 'success' : 'warning'}
                    dot
                  >
                    {school.admin.status}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add School Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New School"
        description="Enter the school details below."
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger-subtle border border-danger/20 text-sm text-danger">
            {error}
          </div>
        )}
        <form onSubmit={handleCreateSchool} className="space-y-4">
          <Input
            name="name"
            label="School Name"
            placeholder="Springfield High School"
            required
            leftIcon={<School className="h-4 w-4" />}
          />
          <Input
            name="address"
            label="Address"
            placeholder="123 Main Street, City"
            leftIcon={<MapPin className="h-4 w-4" />}
          />
          <Input
            name="phone"
            label="Phone"
            placeholder="+1 (555) 000-0000"
            leftIcon={<Phone className="h-4 w-4" />}
          />
          <Input
            name="email"
            label="Email"
            type="email"
            placeholder="admin@school.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={formLoading}>
              Create School
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
