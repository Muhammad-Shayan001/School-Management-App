'use client';

import { useEffect, useRef, useState } from 'react';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { CreditCard, AlertCircle, Loader2, ImageIcon, FileText, RotateCcw } from 'lucide-react';
import QRCode from 'qrcode';

export default function StudentIdCardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFullProfile().then(({ data }) => {
      setProfile(data);
      if (data?.id) {
        QRCode.toDataURL(data.id, {
          width: 300, margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' }
        }).then(setQrUrl);
      }
      setIsLoading(false);
    });
  }, []);

  const downloadAsPng = async () => {
    const ref = isFlipped ? backRef.current : frontRef.current;
    if (!ref) return;
    setIsDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(ref, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `${profile?.full_name?.replace(/ /g, '_')}_StudentID_${isFlipped ? 'Back' : 'Front'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); }
    setIsDownloading(false);
  };

  const downloadAsPdf = async () => {
    if (!frontRef.current || !backRef.current) return;
    setIsDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const frontUrl = await toPng(frontRef.current, { cacheBust: true, pixelRatio: 3 });
      const backUrl = await toPng(backRef.current, { cacheBust: true, pixelRatio: 3 });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [54, 85.6] });
      pdf.addImage(frontUrl, 'PNG', 0, 0, 54, 85.6);
      pdf.addPage([54, 85.6]);
      pdf.addImage(backUrl, 'PNG', 0, 0, 54, 85.6);
      pdf.save(`${profile?.full_name?.replace(/ /g, '_')}_StudentID.pdf`);
    } catch (err) { console.error(err); }
    setIsDownloading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const isIncomplete = !profile?.full_name;
  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const schoolName = profile?.schools?.name || 'Your School';

  /* ─── Shared card shell dimensions ─── */
  const CARD_W = 340;
  const CARD_H = 540;

  const cardShell: React.CSSProperties = {
    width: `${CARD_W}px`, height: `${CARD_H}px`,
    borderRadius: '28px', overflow: 'hidden',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    position: 'absolute', inset: 0,
    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    boxShadow: '0 35px 90px rgba(10, 22, 50, 0.28), 0 0 0 1px rgba(30, 64, 175, 0.08)',
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-4xl mx-auto">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-blue-500" />
            Student ID Card
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">Your official digital identity card</p>
        </div>
        {!isIncomplete && (
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all border border-slate-200">
              <RotateCcw className="h-4 w-4" /> {isFlipped ? 'Show Front' : 'Show Back'}
            </button>
            <button onClick={downloadAsPng} disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60">
              <ImageIcon className="h-4 w-4" /> Download PNG
            </button>
            <button onClick={downloadAsPdf} disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-blue-500 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all shadow-md disabled:opacity-60">
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
        <div className="flex justify-center" style={{ perspective: '1400px' }}>
          <div style={{
            width: `${CARD_W}px`, height: `${CARD_H}px`,
            position: 'relative', transformStyle: 'preserve-3d',
            transition: 'transform 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>

            {/* ════════════════════════════════════════════════
                 FRONT SIDE — Student (Deep Navy / Royal Blue)
                ════════════════════════════════════════════════ */}
            <div ref={frontRef} style={cardShell}>
              <div style={{ width: '100%', height: '100%', background: '#ffffff', display: 'flex', flexDirection: 'column', position: 'relative' }}>

                {/* ── Top Gradient Header ── */}
                <div style={{
                  height: '210px', flexShrink: 0,
                  background: 'linear-gradient(155deg, #070e1f 0%, #0f1d3d 30%, #1e3a6e 60%, #2563eb 100%)',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  paddingTop: '30px',
                }}>
                  {/* Abstract curved wave at bottom */}
                  <svg style={{ position: 'absolute', bottom: '-1px', left: 0, width: '100%' }} viewBox="0 0 340 70" fill="none">
                    <path d="M0 45C40 20 80 55 140 35C200 15 260 50 340 30V70H0Z" fill="rgba(255,255,255,0.04)" />
                    <path d="M0 55C50 30 100 60 170 40C240 20 290 50 340 38V70H0Z" fill="rgba(255,255,255,0.06)" />
                    <path d="M0 60C70 35 130 65 200 45C270 25 310 55 340 45V70H0Z" fill="#ffffff" />
                  </svg>

                  {/* Decorative floating shapes */}
                  <div style={{ position: 'absolute', top: '-25px', right: '-20px', width: '130px', height: '130px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent)', filter: 'blur(25px)' }} />
                  <div style={{ position: 'absolute', top: '55px', left: '-25px', width: '90px', height: '90px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.12), transparent)', filter: 'blur(20px)' }} />

                  {/* School Logo */}
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', marginBottom: '12px', zIndex: 2,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  }}>
                    {profile?.schools?.logo_url ? (
                      <img src={profile.schools.logo_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <CreditCard style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.8)' }} />
                    )}
                  </div>

                  {/* School Name */}
                  <h2 style={{
                    fontSize: '15px', fontWeight: 900, color: '#ffffff',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    textAlign: 'center', maxWidth: '250px',
                    lineHeight: 1.35, zIndex: 2, margin: 0,
                    textShadow: '0 2px 10px rgba(0,0,0,0.35)',
                  }}>{schoolName}</h2>

                  <div style={{
                    marginTop: '10px', padding: '4px 16px',
                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)',
                    zIndex: 2,
                  }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>Student Identity Card</span>
                  </div>
                </div>

                {/* ── Profile Image — Overlapping ── */}
                <div style={{
                  display: 'flex', justifyContent: 'center',
                  marginTop: '-55px', position: 'relative', zIndex: 10,
                }}>
                  <div style={{
                    width: '130px', height: '130px', borderRadius: '50%',
                    border: '5px solid #ffffff',
                    overflow: 'hidden',
                    boxShadow: '0 18px 45px rgba(10, 22, 50, 0.22), 0 0 0 3px rgba(37, 99, 235, 0.08)',
                    background: 'linear-gradient(135deg, #1e3a6e, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {profile?.avatar_url ? (
                      <img src={`${profile.avatar_url}?cb=${Date.now()}`} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontSize: '42px', fontWeight: 900, letterSpacing: '-0.03em' }}>{initials}</span>
                    )}
                  </div>
                </div>

                {/* ── Name & Role ── */}
                <div style={{ textAlign: 'center', padding: '28px 28px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{
                    fontSize: '28px', fontWeight: 900, color: '#0f172a',
                    margin: '0 0 8px', letterSpacing: '-0.025em', lineHeight: 1.15,
                  }}>{profile?.full_name}</h3>
                  <p style={{
                    fontSize: '13px', fontWeight: 800, color: '#2563eb',
                    letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0,
                  }}>Student</p>
                  <div style={{ width: '45px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, #1e40af, #60a5fa)', marginTop: '20px' }} />
                </div>

                {/* ── Bottom Bar ── */}
                <div style={{
                  marginTop: 'auto',
                  background: 'linear-gradient(90deg, #070e1f, #1e3a6e, #2563eb)',
                  padding: '12px 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Valid {new Date().getFullYear()}–{new Date().getFullYear() + 1}
                  </span>
                  <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Powered by Skolic
                  </span>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                 BACK SIDE — Student
                ════════════════════════════════════════════════ */}
            <div ref={backRef} style={{ ...cardShell, transform: 'rotateY(180deg)' }}>
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(165deg, #070e1f 0%, #0f1d3d 35%, #1e3a6e 65%, #2563eb 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '24px'
              }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.04 }} viewBox="0 0 340 540">
                  <circle cx="45" cy="70" r="130" fill="white" />
                  <circle cx="310" cy="470" r="110" fill="white" />
                </svg>

                {/* Small school logo */}
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', marginBottom: '14px', zIndex: 2,
                }}>
                  {profile?.schools?.logo_url ? (
                    <img src={profile.schools.logo_url} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <CreditCard style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.7)' }} />
                  )}
                </div>

                <p style={{ fontSize: '15px', fontWeight: 900, color: 'rgba(255,255,255,0.95)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 24px', zIndex: 2, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{schoolName}</p>

                {/* Workable QR Code */}
                <div style={{
                  background: '#ffffff', padding: '20px', borderRadius: '24px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
                  zIndex: 2, margin: '10px 0'
                }}>
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '160px', height: '160px', background: '#f1f5f9', borderRadius: '12px' }} />
                  )}
                </div>

                <p style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '24px 0 0', zIndex: 2, letterSpacing: '-0.02em' }}>{profile?.full_name}</p>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(147,197,253,0.8)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '4px 0 0', zIndex: 2 }}>Attendance Scanner</p>

                {/* Bottom strip */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.25)', padding: '12px 22px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>
                    If found, return to {schoolName}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
