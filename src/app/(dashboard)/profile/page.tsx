import { getFullProfile } from '@/app/_lib/actions/profile';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import Link from 'next/link';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Edit3, 
  Mail,
  Shield,
  Briefcase,
  Award,
  IdCard,
  School,
  Clock,
  UserCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  Hash,
  Activity,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';

export default async function ProfilePage() {
  const { data: profile, error } = await getFullProfile();

  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="h-20 w-20 rounded-3xl bg-danger/10 flex items-center justify-center text-danger rotate-12">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-black text-text-primary">Profile Sync Failed</h2>
      <p className="text-text-secondary text-center max-w-md">{error}</p>
      <Link href="/profile">
        <Button variant="outline" className="rounded-2xl px-8 h-12">Try Again</Button>
      </Link>
    </div>
  );

  if (!profile) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
       <div className="h-20 w-20 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mb-4">
        <User className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-black text-text-primary">No Profile Found</h2>
      <p className="text-text-secondary max-w-xs">Your profile hasn't been initialized yet. Please complete the setup.</p>
      <Link href="/profile/setup">
        <Button className="rounded-2xl px-10 h-14 btn-primary mt-4 font-black">Initialize Profile</Button>
      </Link>
    </div>
  );

  const role = profile.role;
  const isApproved = profile.status === 'approved';

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Dynamic Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-text-primary tracking-tight">Personal Identity</h1>
              <p className="text-text-secondary font-medium uppercase tracking-widest text-[10px]">Verified Institutional Profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] border shadow-sm",
              isApproved ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
            )}>
              {isApproved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              {profile.status || 'Under Review'}
            </div>
            <div className="px-4 py-1.5 rounded-2xl bg-bg-tertiary text-text-tertiary border border-border/50 text-[11px] font-black uppercase tracking-[0.1em]">
              {role?.replace('_', ' ')}
            </div>
          </div>
        </div>
        
        <Link href="/profile/setup">
          <Button 
            className="btn-primary gap-3 h-14 px-8 rounded-2xl shadow-2xl shadow-accent/20 font-black group transition-all hover:scale-105"
          >
            <Edit3 className="h-5 w-5 transition-transform group-hover:rotate-12" />
            Update Records
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Profile Card Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="card-standard p-0 overflow-hidden border-none shadow-2xl shadow-black/5 bg-gradient-to-b from-bg-primary to-bg-tertiary/20">
            <div className="h-32 bg-accent/10 relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent scale-150" />
            </div>
            <div className="px-8 pb-10 flex flex-col items-center -mt-16">
              <div className="relative group">
                <div className="w-44 h-44 rounded-[3rem] overflow-hidden border-[6px] border-bg-primary shadow-2xl transition-all duration-500 group-hover:shadow-accent/20">
                  <img 
                    src={(() => {
                      if (!profile.avatar_url || profile.avatar_url.trim() === '') {
                        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=random&size=256`;
                      }
                      let url = profile.avatar_url;
                      if (!url.startsWith('http')) {
                         const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
                         url = `${supabaseUrl}/storage/v1/object/public/profiles/${profile.avatar_url}`;
                      }
                      return `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
                    })()} 
                    alt={profile.full_name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute bottom-2 right-2 h-10 w-10 rounded-2xl bg-accent text-white flex items-center justify-center shadow-xl ring-4 ring-bg-primary">
                  {role === 'student' ? <GraduationCap className="h-5 w-5" /> : 
                   role === 'teacher' ? <Briefcase className="h-5 w-5" /> : 
                   <Shield className="h-5 w-5" />}
                </div>
              </div>
              
              <div className="text-center mt-6">
                <h2 className="text-2xl font-black text-text-primary tracking-tight leading-none">{profile.full_name}</h2>
                <p className="text-text-tertiary font-bold text-xs mt-2 truncate max-w-full">{profile.email}</p>
              </div>

              <div className="w-full mt-10 space-y-5 pt-10 border-t border-border/50">
                <IconRow icon={Mail} label="Official Email" value={profile.email} />
                <IconRow icon={Phone} label="Primary Contact" value={profile.phone || 'Pending Setup'} />
                <IconRow icon={MapPin} label="Local Residence" value={profile.role === 'admin' ? profile.admin?.address : (profile.role === 'teacher' ? profile.teacher?.address : profile.student?.address)} />
              </div>
            </div>
          </Card>

          {/* Digital ID Card Display Box */}
          <Card className="card-standard bg-white border-border/50 shadow-2xl relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
             <div className="relative z-10 space-y-6">
               <div className="flex items-center justify-between">
                 <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-sm">
                   <School className="h-6 w-6 text-accent" />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">Digital Badge</p>
                    <p className="text-xs text-accent font-bold"># {profile.id?.substring(0, 8).toUpperCase()}</p>
                 </div>
               </div>
               
               <div>
                 <h3 className="font-black text-text-primary text-lg tracking-tight leading-tight">{profile.schools?.name || 'Academic Institution'}</h3>
                 <p className="text-[10px] text-text-secondary leading-relaxed font-bold mt-1 uppercase tracking-[0.2em] flex items-center gap-2">
                   <CheckCircle2 className="h-3 w-3 text-success" />
                   Institutional ID Verified
                 </p>
               </div>

               <div className="pt-4 border-t border-border/50">
                 <p className="text-[11px] text-text-tertiary leading-relaxed font-medium">
                   This digital identity card is a valid institutional document for all campus activities including Attendance and Examinations.
                 </p>
               </div>
             </div>
             
             {/* Security Hologram Effect */}
             <div className="absolute bottom-4 right-4 opacity-[0.03] pointer-events-none">
                <Fingerprint className="h-20 w-20 text-black" />
             </div>
          </Card>
        </div>

        {/* Profile Content Area - Core Information Box */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="card-standard p-10 border-border/50 shadow-2xl shadow-black/5 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent/5 flex items-center justify-center text-accent border border-accent/10 shadow-inner">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text-primary tracking-tight">Institutional Records</h3>
                  <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em]">Verified Data Registry</p>
                </div>
              </div>
            </div>

            {/* Role-Specific Detailed Information */}
            <div className="space-y-12">
              {(role === 'admin' || role === 'super_admin') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <GridInfo label="Full Legal Name" value={profile.full_name} icon={User} />
                  <GridInfo label="CNIC Number" value={profile.admin?.cnic} icon={IdCard} />
                  <GridInfo label="Assigned Institution" value={profile.schools?.name} icon={School} />
                  <GridInfo label="Institutional Phone" value={profile.schools?.phone || profile.phone} icon={Phone} />
                  <GridInfo label="Physical Residence" value={profile.admin?.address} icon={MapPin} />
                  <GridInfo label="Campus Address" value={profile.schools?.address} icon={MapPin} className="md:col-span-2" />
                </div>
              )}

              {role === 'teacher' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <GridInfo label="Faculty Name" value={profile.full_name} icon={User} />
                    <GridInfo label="Government CNIC" value={profile.teacher?.cnic} icon={IdCard} />
                    <GridInfo label="Faculty ID Code" value={profile.teacher?.teacher_id} icon={Shield} />
                    <GridInfo label="Class Charge" value={profile.teacher?.is_class_teacher ? (profile.teacher.classes?.name || 'Assigned Class') : 'General Faculty'} icon={Users} />
                    <GridInfo label="Academic Qualification" value={profile.teacher?.qualification} icon={GraduationCap} />
                    <GridInfo label="Professional Exp" value={profile.teacher?.experience ? `${profile.teacher.experience} Years` : undefined} icon={Clock} />
                    <GridInfo label="Official Contact" value={profile.phone} icon={Phone} />
                    <GridInfo label="Personal Residence" value={profile.teacher?.address} icon={MapPin} />
                  </div>
                  
                  <div className="pt-10 border-t border-border/50">
                    <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-accent" /> Active Teaching Assignments
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profile.assignments && profile.assignments.length > 0 ? (
                        profile.assignments.map((a: any) => (
                          <div key={a.id} className="p-4 rounded-xl border border-border/30 bg-bg-tertiary/20 flex flex-col gap-1">
                            <span className="text-sm font-black text-text-primary">{a.subjects?.name}</span>
                            <span className="text-xs font-medium text-text-secondary">Class: {a.classes?.name} {a.classes?.section ? `- ${a.classes.section}` : ''}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl border border-border/30 bg-bg-tertiary/20 flex flex-col gap-1 text-text-tertiary">
                          <span className="text-sm italic">No subjects assigned yet.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {role === 'student' && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <GridInfo label="Full Student Name" value={profile.full_name} icon={User} />
                    <GridInfo label="B-Form / CNIC" value={profile.student?.cnic} icon={IdCard} />
                    <GridInfo label="Campus Roll Number" value={profile.student?.roll_number} icon={Hash} />
                    <GridInfo label="Academic Class" value={profile.student?.classes ? `${profile.student.classes.name} - ${profile.student.section || 'A'}` : undefined} icon={BookOpen} />
                    <GridInfo label="Date of Birth" value={profile.student?.dob} icon={Calendar} />
                    <GridInfo label="Official Gender" value={profile.student?.gender} icon={User} className="capitalize" />
                    <GridInfo label="Student Email" value={profile.student?.student_email} icon={Mail} />
                    <GridInfo label="Admission Date" value={profile.student?.admission_date} icon={Clock} />
                  </div>
                  
                  <div className="pt-10 border-t border-border/50">
                    <h4 className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.25em] mb-10 flex items-center gap-3">
                      <Shield className="h-4 w-4 text-accent" /> Parental / Guardian Registry
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <GridInfo label="Guardian Name" value={profile.student?.parent_name} icon={UserCheck} />
                      <GridInfo label="Guardian CNIC" value={profile.student?.parent_cnic} icon={IdCard} />
                      <GridInfo label="Guardian Contact" value={profile.student?.parent_phone} icon={Phone} />
                      <GridInfo label="Residence Address" value={profile.student?.address} icon={MapPin} className="md:col-span-2" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Friendly message if data is totally missing */}
            {(!profile.student && !profile.teacher && !profile.admin) && (
              <div className="py-20 flex flex-col items-center text-center space-y-4">
                 <div className="h-16 w-16 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-300">
                    <AlertCircle className="h-8 w-8" />
                 </div>
                 <div className="max-w-xs">
                    <p className="text-sm font-bold text-text-primary">Registry Incomplete</p>
                    <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
                       Institutional records for your account have not been finalized. Please update your records to verify your identity.
                    </p>
                 </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function IconRow({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) {
  return (
    <div className="flex items-center gap-4 text-left group">
      <div className="h-11 w-11 rounded-2xl bg-bg-primary flex items-center justify-center text-text-tertiary group-hover:bg-accent/10 group-hover:text-accent transition-all duration-300 shadow-sm border border-border/20">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.15em] leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-text-primary truncate">{value || 'Pending Setup'}</p>
      </div>
    </div>
  );
}

function GridInfo({ label, value, icon: Icon, className }: { label: string, value?: string, icon: any, className?: string }) {
  return (
    <div className={cn("group transition-all duration-300", className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-lg bg-accent/5 flex items-center justify-center text-accent/60 group-hover:scale-110 transition-transform">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-base font-bold text-text-primary pl-8 border-l-2 border-transparent group-hover:border-accent/30 transition-all leading-tight">
        {value || <span className="text-text-tertiary/30 font-medium italic text-xs tracking-wide uppercase">Record Pending...</span>}
      </p>
    </div>
  );
}
