'use client';

import { useEffect, useState } from 'react';
import { 
  getAdminCampuses, 
  createCampus, 
  updateCampus, 
  deleteCampus, 
  getCampusStats,
  setActiveCampusContext
} from '@/app/_lib/actions/campuses';
import { useCampusStore } from '@/app/_lib/store/campus-store';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Settings2, 
  Trash2, 
  ExternalLink,
  Users,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Search,
  ChevronRight,
  MoreVertical,
  Loader2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';

interface CampusCardProps {
  campus: any;
  onEdit: (campus: any) => void;
  onDelete: (id: string) => void;
  onSwitch: (id: string) => void;
  isActive: boolean;
}

function CampusCard({ campus, onEdit, onDelete, onSwitch, isActive }: CampusCardProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const { totalStudents, totalTeachers, totalClasses } = await getCampusStats(campus.id);
      setStats({ totalStudents, totalTeachers, totalClasses });
      setIsLoadingStats(false);
    }
    loadStats();
  }, [campus.id]);

  return (
    <div className={cn(
      "group relative bg-white/70 backdrop-blur-md rounded-3xl border transition-all duration-500 overflow-hidden",
      isActive 
        ? "border-accent/40 shadow-2xl shadow-accent/10 ring-1 ring-accent/20" 
        : "border-border/30 hover:border-accent/20 hover:shadow-xl hover:shadow-black/5"
    )}>
      {/* Dynamic Theme Banner */}
      <div 
        className="h-24 w-full relative overflow-hidden"
        style={{ backgroundColor: campus.theme_color || '#6366f1' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {campus.banner_url && (
          <img src={campus.banner_url} alt="" className="w-full h-full object-cover opacity-60" />
        )}
        
        {/* Active Badge */}
        {isActive && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-accent/20">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            <span className="text-[10px] font-black text-accent uppercase tracking-wider">Active Context</span>
          </div>
        )}
      </div>

      {/* Campus Logo Overlay */}
      <div className="absolute top-12 left-6">
        <div className="h-20 w-20 rounded-2xl bg-white p-1.5 shadow-xl border border-border/20 group-hover:scale-105 transition-transform duration-500">
          <div 
            className="h-full w-full rounded-xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: (campus.theme_color || '#6366f1') + '10' }}
          >
            {campus.logo_url ? (
              <img src={campus.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-10 w-10" style={{ color: campus.theme_color || '#6366f1' }} />
            )}
          </div>
        </div>
      </div>

      <div className="pt-10 px-6 pb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-text-primary truncate tracking-tight">{campus.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.15em] bg-bg-tertiary px-2 py-0.5 rounded">
                {campus.campus_type || 'Main Campus'}
              </span>
              {campus.campus_code && (
                <span className="text-[9px] font-black text-accent uppercase tracking-[0.15em] bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                  {campus.campus_code}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={() => onEdit(campus)}
              className="p-2 rounded-xl text-text-tertiary hover:text-accent hover:bg-accent/5 transition-all"
              title="Edit Campus"
            >
              <Settings2 className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={() => onDelete(campus.id)}
              className="p-2 rounded-xl text-text-tertiary hover:text-danger hover:bg-danger/5 transition-all"
              title="Delete Campus"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-6">
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="h-8 w-8 rounded-lg bg-bg-tertiary/50 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-xs font-medium truncate opacity-80">{campus.address || 'No address provided'}</p>
          </div>
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="h-8 w-8 rounded-lg bg-bg-tertiary/50 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 opacity-70" />
            </div>
            <p className="text-xs font-medium opacity-80">Principal: <span className="text-text-primary font-bold">{campus.principal_name || 'Not assigned'}</span></p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-bg-tertiary/30 border border-border/20 mb-6">
          <div className="text-center">
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Students</p>
            {isLoadingStats ? (
              <div className="h-4 w-8 bg-bg-tertiary animate-pulse mx-auto rounded" />
            ) : (
              <p className="text-sm font-black text-text-primary">{stats?.totalStudents}</p>
            )}
          </div>
          <div className="text-center border-x border-border/30">
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Teachers</p>
            {isLoadingStats ? (
              <div className="h-4 w-8 bg-bg-tertiary animate-pulse mx-auto rounded" />
            ) : (
              <p className="text-sm font-black text-text-teachers">{stats?.totalTeachers}</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Classes</p>
            {isLoadingStats ? (
              <div className="h-4 w-8 bg-bg-tertiary animate-pulse mx-auto rounded" />
            ) : (
              <p className="text-sm font-black text-text-primary">{stats?.totalClasses}</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSwitch(campus.id)}
          disabled={isActive}
          className={cn(
            "w-full h-11 rounded-xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-all duration-300 active:scale-[0.98]",
            isActive
              ? "bg-emerald-500/10 text-emerald-600 cursor-default"
              : "bg-accent text-white shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5"
          )}
        >
          {isActive ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Currently Managing
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              Switch to Campus
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function CampusesPage() {
  const router = useRouter();
  const { activeCampus, setCampuses, switchCampus } = useCampusStore();
  
  const [campuses, setLocalCampuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    campus_code: '',
    address: '',
    phone: '',
    email: '',
    principal_name: '',
    campus_type: 'branch',
    campus_timing: '',
    description: '',
    theme_color: '#6366f1',
    logo_url: '',
    banner_url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const { data } = await getAdminCampuses();
    if (data) {
      setLocalCampuses(data);
      // Update store as well
      const mapped = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        logo_url: s.logo_url,
        theme_color: s.theme_color || '#6366f1',
        campus_type: s.campus_type,
        campus_code: s.campus_code,
        is_active: s.is_active !== false,
      }));
      setCampuses(mapped);
    }
    setIsLoading(false);
  }

  function handleOpenCreate() {
    setEditingCampus(null);
    setFormData({
      name: '',
      campus_code: '',
      address: '',
      phone: '',
      email: '',
      principal_name: '',
      campus_type: 'branch',
      campus_timing: '',
      description: '',
      theme_color: '#6366f1',
      logo_url: '',
      banner_url: ''
    });
    setIsModalOpen(true);
  }

  function handleEdit(campus: any) {
    setEditingCampus(campus);
    setFormData({
      name: campus.name || '',
      campus_code: campus.campus_code || '',
      address: campus.address || '',
      phone: campus.phone || '',
      email: campus.email || '',
      principal_name: campus.principal_name || '',
      campus_type: campus.campus_type || 'branch',
      campus_timing: campus.campus_timing || '',
      description: campus.description || '',
      theme_color: campus.theme_color || '#6366f1',
      logo_url: campus.logo_url || '',
      banner_url: campus.banner_url || ''
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Frontend handleSubmit triggered', formData);
    setIsSubmitting(true);
    
    const loadingToast = toast.loading(editingCampus ? 'Updating campus...' : 'Creating new campus...');

    try {
      let result;
      if (editingCampus) {
        console.log('Updating campus:', editingCampus.id);
        result = await updateCampus(editingCampus.id, formData);
      } else {
        console.log('Creating new campus');
        result = await createCampus(formData);
      }
      
      console.log('Action result:', result);
      
      if (result?.error) {
        console.error('Action failed with error:', result.error);
        toast.error(result.error, { id: loadingToast });
      } else {
        console.log('Action successful');
        toast.success(editingCampus ? 'Campus updated successfully' : 'Campus created successfully', { id: loadingToast });
        setIsModalOpen(false);
        loadData();
      }
    } catch (err) {
      console.error('Unexpected error in handleSubmit:', err);
      toast.error('An unexpected error occurred', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSwitch(campusId: string) {
    const loadingToast = toast.loading('Switching campus...');
    try {
      await setActiveCampusContext(campusId);
      switchCampus(campusId);
      toast.success('Switched successfully', { id: loadingToast });
      router.refresh();
    } catch (err) {
      toast.error('Failed to switch campus', { id: loadingToast });
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this campus? All associated data will be lost.')) {
      const loadingToast = toast.loading('Deleting campus...');
      try {
        const result = await deleteCampus(id);
        if (result?.error) {
          toast.error(result.error, { id: loadingToast });
        } else {
          toast.success('Campus deleted successfully', { id: loadingToast });
          loadData();
        }
      } catch (err) {
        toast.error('Failed to delete campus', { id: loadingToast });
      }
    }
  }

  const filteredCampuses = campuses.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.campus_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-primary tracking-tight">Campus Management</h1>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] mt-0.5">Scale and organize your campus</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-bg-tertiary/50 p-1 rounded-2xl border border-border/30">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-white shadow-md text-accent" : "text-text-tertiary hover:text-text-primary")}
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-white shadow-md text-accent" : "text-text-tertiary hover:text-text-primary")}
            >
              <List className="h-4.5 w-4.5" />
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-accent text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/30 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="h-4.5 w-4.5" />
            Add New Campus
          </button>
        </div>
      </div>

      {/* Filters/Search */}
      <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Search campuses by name, code or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/60 backdrop-blur-md border border-border/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:bg-white transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-bg-tertiary/30 border border-border/30">
          <Clock className="h-4 w-4 text-text-tertiary" />
          <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Total: {campuses.length} Campuses</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
          <p className="text-xs font-black text-text-tertiary uppercase tracking-widest">Loading campus data...</p>
        </div>
      ) : campuses.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-md border border-dashed border-border/50 rounded-[40px] p-20 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-3xl bg-bg-tertiary flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-text-tertiary opacity-40" />
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-2">No Campuses Found</h2>
          <p className="text-sm font-bold text-text-tertiary max-w-sm mb-8">
            You haven't added any campuses yet. Start by creating your first branch campus to expand your institution.
          </p>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-accent text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/30 transition-all"
          >
            <Plus className="h-5 w-5" />
            Create First Campus
          </button>
        </div>
      ) : (
        <div className={cn(
          "grid gap-6 animate-in fade-in duration-700",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredCampuses.map(campus => (
            <CampusCard 
              key={campus.id} 
              campus={campus} 
              isActive={activeCampus?.id === campus.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSwitch={handleSwitch}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-border/30 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-text-primary">{editingCampus ? 'Edit Campus' : 'Add New Campus'}</h2>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-wider mt-1">Establish a new campus under your administration.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-10 w-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger/10 transition-all"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Campus Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all"
                      placeholder="e.g. City Branch"
                    />
                  </div>

                  {/* Code */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Campus Code</label>
                    <input
                      required
                      value={formData.campus_code}
                      onChange={(e) => setFormData({...formData, campus_code: e.target.value})}
                      className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all"
                      placeholder="e.g. CITY-01"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Campus Type</label>
                    <select
                      value={formData.campus_type}
                      onChange={(e) => setFormData({...formData, campus_type: e.target.value})}
                      className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all appearance-none"
                    >
                      <option value="main">Main Campus</option>
                      <option value="branch">Branch</option>
                      <option value="primary">Primary Section</option>
                      <option value="secondary">Secondary Section</option>
                    </select>
                  </div>

                  {/* Principal */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Principal Name</label>
                    <input
                      value={formData.principal_name}
                      onChange={(e) => setFormData({...formData, principal_name: e.target.value})}
                      className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Address</label>
                    <input
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Branding */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Theme Color</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={formData.theme_color}
                        onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                        className="h-12 w-20 rounded-xl bg-transparent border-none cursor-pointer"
                      />
                      <input
                        value={formData.theme_color}
                        onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                        className="flex-1 bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest ml-1">Logo URL</label>
                    <input
                      value={formData.logo_url}
                      onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                      className="w-full bg-bg-tertiary/50 border border-border/30 rounded-2xl py-3 px-4 text-sm font-bold text-text-primary focus:outline-none focus:border-accent/40 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl bg-bg-tertiary text-text-secondary font-black text-[11px] uppercase tracking-widest hover:bg-bg-tertiary/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] h-14 rounded-2xl bg-accent text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-accent/20 hover:shadow-2xl hover:shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingCampus ? 'Update Campus' : 'Create Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
