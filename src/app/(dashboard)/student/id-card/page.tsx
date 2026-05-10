'use client';

import { useEffect, useRef, useState } from 'react';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { Download, CreditCard, AlertCircle, Loader2, ImageIcon, FileText } from 'lucide-react';
import QRCode from 'qrcode';

export default function StudentIdCardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFullProfile().then(({ data }) => {
      setProfile(data);
      if (data?.id) {
        QRCode.toDataURL(data.id, {
          width: 200, margin: 1,
          color: { dark: '#1a1a2e', light: '#ffffff' }
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
    link.download = `${profile?.full_name?.replace(/ /g, '_')}_StudentID.png`;
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
    pdf.save(`${profile?.full_name?.replace(/ /g, '_')}_StudentID.pdf`);
    setIsDownloading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const isIncomplete = !profile?.student?.roll_number || !profile?.full_name;
  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const schoolName = profile?.schools?.name || 'Your School';

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-emerald-500" />
            Student ID Card
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">Your official digital identity card</p>
        </div>
        {!isIncomplete && (
          <div className="flex gap-3">
            <button onClick={downloadAsPng} disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-60">
              <ImageIcon className="h-4 w-4" /> Download PNG
            </button>
            <button onClick={downloadAsPdf} disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-emerald-500 text-emerald-600 font-bold text-sm hover:bg-emerald-50 transition-all shadow-md disabled:opacity-60">
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
            <p className="text-sm text-text-secondary mt-1">Please complete your profile (including Roll Number) to generate your ID card.</p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          {/* ID CARD */}
          <div ref={cardRef}
            style={{ width: '380px', fontFamily: "'Inter', sans-serif", borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>

            {/* Header — Emerald gradient for students */}
            <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)', padding: '24px 24px 40px', position: 'relative' }}>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', bottom: -10, left: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Official Identity Card</p>
                  <p style={{ color: '#fff', fontSize: '18px', fontWeight: 900, marginTop: '4px', lineHeight: 1.2 }}>{schoolName}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '10px', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.3)' }}>
                  <p style={{ color: '#fff', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em' }}>STUDENT</p>
                </div>
              </div>
            </div>

            {/* Avatar */}
            <div style={{ background: '#ffffff', display: 'flex', justifyContent: 'center' }}>
              <div style={{ marginTop: '-36px', width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #fff', overflow: 'hidden', boxShadow: '0 8px 25px rgba(5,150,105,0.3)', background: 'linear-gradient(135deg, #059669, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: '26px', fontWeight: 900 }}>{initials}</span>
                }
              </div>
            </div>

            {/* Body */}
            <div style={{ background: '#ffffff', padding: '12px 24px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>{profile?.full_name}</p>
                <p style={{ fontSize: '11px', color: '#059669', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>
                  {profile?.student?.classes?.name} {profile?.student?.classes?.section ? `— Section ${profile.student.classes.section}` : ''}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Roll Number', value: profile?.student?.roll_number || '—' },
                  { label: 'CNIC / B-Form', value: profile?.student?.cnic || '—' },
                  { label: 'Parent Name', value: profile?.student?.parent_name || '—' },
                  { label: 'Phone', value: profile?.student?.phone || profile?.phone || '—' },
                ].map((item) => (
                  <div key={item.label} style={{ background: '#f0fdf4', borderRadius: '10px', padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                    <p style={{ fontSize: '9px', color: '#059669', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700, marginTop: '3px', wordBreak: 'break-all' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* QR + Footer */}
            <div style={{ background: 'linear-gradient(to bottom, #f0fdf4, #dcfce7)', padding: '16px 24px', borderTop: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 12px rgba(5,150,105,0.15)', flexShrink: 0 }}>
                {qrUrl
                  ? <img src={qrUrl} alt="QR" style={{ width: '64px', height: '64px' }} />
                  : <div style={{ width: '64px', height: '64px', background: '#e2e8f0', borderRadius: '8px' }} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '9px', color: '#059669', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scan for Attendance</p>
                <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginTop: '4px' }}>{schoolName}</p>
                <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                  Session {new Date().getFullYear()}–{new Date().getFullYear() + 1}
                </p>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ background: 'linear-gradient(90deg, #059669, #10b981)', padding: '8px 24px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                If found, please return to {schoolName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
