'use client';

import { useEffect, useState } from 'react';
import { getUsers, createManualAdmin } from '@/app/_lib/actions/users';
import { getSchools } from '@/app/_lib/actions/schools';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Modal } from '@/app/_components/ui/modal';
import { Select } from '@/app/_components/ui/select';
import { Badge } from '@/app/_components/ui/badge';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { cn } from '@/app/_lib/utils/cn';
import { UserPlus, Shield, Mail, Phone, School, Search, Info, Lock } from 'lucide-react';
import { CredentialSuccessModal } from '@/app/_components/dashboard/credential-success-modal';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [successCredentials, setSuccessCredentials] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: adminList }, { data: schoolList }] = await Promise.all([
          getUsers({ role: 'admin' }),
          getSchools()
        ]);
        setAdmins(adminList || []);
        setSchools(schoolList || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleCreateAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const result = await createManualAdmin(data);

      if (result.error) {
        setError(result.error);
        setFormLoading(false);
      } else {
        setSuccessCredentials(result.credentials);
        setShowSuccessModal(true);
        setShowModal(false);
        setFormLoading(false);
        // Refetch
        const { data: adminList } = await getUsers({ role: 'admin' });
        setAdmins(adminList || []);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setFormLoading(false);
    }
  }

  const filteredAdmins = admins.filter(admin => 
    admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 shadow-xl shadow-black/[0.02]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight uppercase italic">
              Administrator <span className="text-accent">Governance</span>
            </h1>
            <p className="mt-1 text-sm font-bold text-text-tertiary flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              Manage and assign principals to institutions
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-accent transition-colors" />
                <input 
                  placeholder="Search administrators..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 h-12 w-[300px] bg-white/50 border border-white/40 rounded-2xl focus:bg-white transition-all shadow-sm text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20"
                />
             </div>
             <Button
              onClick={() => setShowModal(true)}
              leftIcon={<UserPlus className="h-5 w-5" />}
              className="h-12 px-6 rounded-2xl font-black uppercase text-[11px] tracking-widest bg-accent shadow-lg shadow-accent/20"
            >
              Appoint Admin
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Total Admins</p>
          <p className="text-3xl font-black text-text-primary mt-1">{admins.length}</p>
        </div>
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Active Schools</p>
          <p className="text-3xl font-black text-emerald-500 mt-1">{schools.length}</p>
        </div>
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-sm">
          <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Approved</p>
          <p className="text-3xl font-black text-accent mt-1">{admins.filter(a => a.status === 'approved').length}</p>
        </div>
      </div>

      {/* Admins Grid */}
      {isLoading ? (
        <PageSpinner label="Fetching Governance Data..." />
      ) : filteredAdmins.length === 0 ? (
        <div className="glass-card p-20 text-center rounded-[3rem] border-dashed border-2 border-border/40">
          <div className="h-20 w-20 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
             <Shield className="h-10 w-10 text-text-tertiary" />
          </div>
          <p className="text-xl font-black text-text-primary uppercase tracking-widest">No Administrators Found</p>
          <p className="text-sm font-bold text-text-tertiary mt-2">
            Start by adding a new administrator and assigning them to a school.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdmins.map((admin) => (
            <div
              key={admin.id}
              className="glass-card glass-card-hover p-6 rounded-[2.5rem] flex flex-col justify-between group bg-white/60"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/10 shadow-inner">
                    <Shield className="h-7 w-7 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black text-text-primary truncate uppercase tracking-tight">
                      {admin.full_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <Badge variant={admin.status === 'approved' ? 'success' : 'warning'} className="text-[9px] uppercase font-black px-2">
                         {admin.status}
                       </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                    <Mail className="h-3.5 w-3.5 text-text-tertiary" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-text-secondary">
                    <Phone className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>{admin.phone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-accent">
                    <School className="h-3.5 w-3.5 text-accent" />
                    <span className="truncate uppercase tracking-wider font-black">
                      {schools.find(s => s.id === admin.school_id)?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-border/40 flex items-center justify-between">
                 <p className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em]">Principal Access</p>
                 <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl group-hover:bg-accent group-hover:text-white transition-all">
                    <Info className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Admin Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Appoint New Principal"
        description="Establish new administrative authority for an institution."
        size="lg"
        className="rounded-[3rem] shadow-3xl"
      >
        <div className="p-2 md:p-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-danger-subtle border border-danger/20 text-xs font-black text-danger uppercase tracking-widest flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-danger animate-pulse" />
               {error}
            </div>
          )}
          <form onSubmit={handleCreateAdmin} className="space-y-6">
            <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10 space-y-4">
               <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Personal Information</p>
               <Input
                 name="full_name"
                 label="Full Name"
                 placeholder="e.g. Dr. John Doe"
                 required
                 leftIcon={<UserPlus className="h-4 w-4" />}
               />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input
                   name="email"
                   label="Email Address"
                   type="email"
                   placeholder="admin@school.com"
                   required
                   leftIcon={<Mail className="h-4 w-4" />}
                 />
                 <Input
                   name="phone"
                   label="Phone Number"
                   placeholder="+92 3XX XXXXXXX"
                   leftIcon={<Phone className="h-4 w-4" />}
                 />
               </div>
            </div>

            <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 space-y-4">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Login Credentials</p>
               <Input
                 name="password"
                 label="Password"
                 type="password"
                 placeholder="Enter a strong password"
                 required
                 minLength={6}
                 leftIcon={<Lock className="h-4 w-4" />}
                 hint="Minimum 6 characters. This will be the admin's login password."
               />
            </div>

            <div className="p-6 bg-bg-tertiary/50 rounded-3xl border border-border/50 space-y-4">
               <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Institutional Rights</p>
               <Select
                 name="school_id"
                 label="Assign School"
                 required
                 options={schools.map(s => ({ value: s.id, label: s.name }))}
                 placeholder="Select School"
               />
               <Input
                 name="cnic"
                 label="National Identity / CNIC"
                 placeholder="XXXXX-XXXXXXX-X"
                 leftIcon={<Shield className="h-4 w-4" />}
               />
            </div>

            <div className="flex gap-4 pt-4 border-t border-border/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest"
              >
                Discard
              </Button>
              <Button type="submit" className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest bg-accent" isLoading={formLoading}>
                Appoint Admin
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <CredentialSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        credentials={successCredentials}
      />
    </div>
  );
}
