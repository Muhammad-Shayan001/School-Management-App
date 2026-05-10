'use client';

import { useEffect, useRef, useState } from 'react';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { CreditCard, AlertCircle, Loader2, ImageIcon, FileText } from 'lucide-react';
import QRCode from 'qrcode';

export default function AdminIdCardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFullProfile().then(({ data }) => {
      setProfile(data);
      if (data?.id) {
        QRCode.toDataURL(`PRINCIPAL_${data.id}`, {
          width: 200, margin: 1,
          color: { dark: '#7c2d12', light: '#ffffff' }
        }).then(setQrUrl);
      }
      setIsLoading(false);
    });
  }, []);

  const downloadAsPng = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
    const link = document.createElement('a');
    link.download = `${profile?.full_name?.replace(/ /g, '_')}_PrincipalID.png`;
    link.href = dataUrl;
    link.click();
    setIsDownloading(false);
  };

  const downloadAsPdf = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    const { toPng } = await import('html-to-image');
    const { jsPDF } = await import('jspdf');
    const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85.6, 54] });
    pdf.addImage(dataUrl, 'PNG', 0, 0, 85.6, 54);
    pdf.save(`${profile?.full_name?.replace(/ /g, '_')}_PrincipalID.pdf`);
    setIsDownloading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isIncomplete = !profile?.full_name;
  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const schoolName = profile?.schools?.name || 'Your School';
  const cnic = profile?.admin?.cnic || '—';
  const phone = profile?.admin?.phone || profile?.phone || '—';
  const role = profile?.role === 'super_admin' ? 'Super Administrator' : 'Principal / Administrator';

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-amber-500" />
            Principal ID Card
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">Your official digital administrator identity card</p>
        </div>
        {!isIncomplete && (
          <div className="flex gap-3">
            <button onClick={downloadAsPng} disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-60">
              <ImageIcon className="h-4 w-4" /> Download PNG
            </button>
            <button onClick={downloadAsPdf} disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-amber-500 text-amber-600 font-bold text-sm hover:bg-amber-50 transition-all shadow-md disabled:opacity-60">
              <FileText className="h-4 w-4" /> Download PDF
            </button>
          </div>
        )}
      </div>

      {isIncomplete ? (
        <div className="glass-card p-8 flex items-center gap-4 border-l-4 border-amber-400 bg-amber-50/50">
          <AlertCircle className="h-8 w-8 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-black text-text-primary">Profile Incomplete</p>
            <p className="text-sm text-text-secondary mt-1">Please complete your profile to generate your ID card.</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-10">
          {/* ID CARD */}
          <div ref={cardRef}
            className="select-none"
            style={{ 
              width: '350px', 
              minHeight: '520px',
              fontFamily: "'Inter', system-ui, sans-serif", 
              borderRadius: '24px', 
              overflow: 'hidden', 
              boxShadow: '0 30px 70px rgba(0,0,0,0.3)', 
              background: '#fff',
              position: 'relative',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>

            {/* Top Pattern Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)', 
              height: '140px', 
              padding: '24px', 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#fff'
            }}>
              <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(20px)' }} />
              <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', filter: 'blur(15px)' }} />
              
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.02em', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{schoolName.toUpperCase()}</h2>
                <div style={{ display: 'inline-block', marginTop: '8px', padding: '4px 12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)' }}>
                  <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', margin: 0 }}>ADMINISTRATOR IDENTITY</p>
                </div>
              </div>
            </div>

            {/* Profile Image Section */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10, marginTop: '-50px' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                border: '5px solid #fff', 
                overflow: 'hidden', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #d97706, #78350f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: '36px', fontWeight: 900 }}>{initials}</span>
                    </div>
                }
              </div>
            </div>

            {/* Info Section */}
            <div style={{ padding: '20px 28px 24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{profile?.full_name}</h3>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#d97706', margin: '0 0 24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {role}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {[
                  { label: 'School Admin', value: schoolName },
                  { label: 'CNIC', value: cnic },
                  { label: 'Official Phone', value: phone },
                  { label: 'Email', value: profile?.email || '—' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section with QR */}
            <div style={{ 
              background: '#f8fafc', 
              padding: '20px 28px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Access Level</p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Full Administrative Access</p>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#d97706' }}>Secure Identity</p>
                </div>
              </div>
              
              <div style={{ 
                background: '#fff', 
                padding: '6px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid #f1f5f9'
              }}>
                {qrUrl ? (
                  <img src={qrUrl} alt="QR" style={{ width: '70px', height: '70px' }} />
                ) : (
                  <div style={{ width: '70px', height: '70px', background: '#f1f5f9', borderRadius: '8px' }} />
                )}
              </div>
            </div>

            {/* Footer Stripe */}
            <div style={{ 
              background: '#d97706', 
              padding: '10px', 
              textAlign: 'center'
            }}>
              <p style={{ color: '#fff', fontSize: '9px', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>
                AUTHORIZED PERSONNEL — {schoolName.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
