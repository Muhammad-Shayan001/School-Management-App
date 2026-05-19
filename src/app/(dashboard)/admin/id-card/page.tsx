'use client';

import { useEffect, useRef, useState } from 'react';
import { getFullProfile } from '@/app/_lib/actions/profile';
import { CreditCard, AlertCircle, Loader2, ImageIcon, FileText, RotateCcw } from 'lucide-react';
import QRCode from 'qrcode';

export default function AdminIdCardPage() {
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
          color: { dark: '#1a0a00', light: '#ffffff' }
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
      const dataUrl = await toPng(ref, {
        cacheBust: true,
        pixelRatio: 3,
        style: {
          transform: 'none',
          backfaceVisibility: 'visible',
          webkitBackfaceVisibility: 'visible',
        },
      });
      const link = document.createElement('a');
      link.download = `${profile?.full_name?.replace(/ /g, '_')}_PrincipalID_${isFlipped ? 'Back' : 'Front'}.png`;
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
      const frontUrl = await toPng(frontRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        style: {
          transform: 'none',
          backfaceVisibility: 'visible',
          webkitBackfaceVisibility: 'visible',
        },
      });
      const backUrl = await toPng(backRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        style: {
          transform: 'none',
          backfaceVisibility: 'visible',
          webkitBackfaceVisibility: 'visible',
        },
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [54, 85.6] });
      pdf.addImage(frontUrl, 'PNG', 0, 0, 54, 85.6);
      pdf.addPage([54, 85.6]);
      pdf.addImage(backUrl, 'PNG', 0, 0, 54, 85.6);
      pdf.save(`${profile?.full_name?.replace(/ /g, '_')}_PrincipalID.pdf`);
    } catch (err) { console.error(err); }
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
  const role = profile?.role === 'super_admin' ? 'Super Administrator' : 'Principal';

  const CARD_W = 340;
  const CARD_H = 540;

  const cardShell: React.CSSProperties = {
    width: `${CARD_W}px`, height: `${CARD_H}px`,
    borderRadius: '28px', overflow: 'hidden',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    position: 'absolute', inset: 0,
    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    boxShadow: '0 35px 90px rgba(30, 15, 0, 0.3), 0 0 0 1px rgba(180, 83, 9, 0.1)',
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-4xl mx-auto">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-amber-600" />
            Principal ID Card
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">Your official digital administrator identity card</p>
        </div>
        {!isIncomplete && (
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all border border-slate-200">
              <RotateCcw className="h-4 w-4" /> {isFlipped ? 'Show Front' : 'Show Back'}
            </button>
            <button onClick={downloadAsPng} disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 text-white font-bold text-sm hover:bg-amber-800 transition-all shadow-lg shadow-amber-700/25 disabled:opacity-60">
              <ImageIcon className="h-4 w-4" /> Download PNG
            </button>
            <button onClick={downloadAsPdf} disabled={isDownloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-amber-600 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-all shadow-md disabled:opacity-60">
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

            {/* ════════ FRONT SIDE — Admin (Amber / Dark) ════════ */}
            <div ref={frontRef} style={cardShell}>
              <div style={{ width: '100%', height: '100%', background: '#ffffff', display: 'flex', flexDirection: 'column', position: 'relative' }}>

                {/* Top Gradient Header */}
                <div style={{
                  height: '210px', flexShrink: 0,
                  background: 'linear-gradient(155deg, #1a0a00 0%, #451a03 25%, #78350f 55%, #b45309 100%)',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  paddingTop: '30px',
                }}>
                  <svg style={{ position: 'absolute', bottom: '-1px', left: 0, width: '100%' }} viewBox="0 0 340 70" fill="none">
                    <path d="M0 50C50 28 110 55 170 38C230 22 280 50 340 35V70H0Z" fill="rgba(255,255,255,0.03)" />
                    <path d="M0 56C60 32 120 58 190 44C260 28 300 52 340 42V70H0Z" fill="rgba(255,255,255,0.05)" />
                    <path d="M0 62C80 40 140 62 210 50C280 36 320 56 340 48V70H0Z" fill="#ffffff" />
                  </svg>

                  <div style={{ position: 'absolute', top: '-20px', right: '-15px', width: '125px', height: '125px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent)', filter: 'blur(25px)' }} />
                  <div style={{ position: 'absolute', top: '60px', left: '-18px', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.08), transparent)', filter: 'blur(18px)' }} />

                  {/* School Logo */}
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', marginBottom: '12px', zIndex: 2,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  }}>
                    {profile?.schools?.logo_url ? (
                      <img src={`${profile.schools.logo_url}?cb=${Date.now()}`} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <CreditCard style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.8)' }} />
                    )}
                  </div>

                  <h2 style={{
                    fontSize: '15px', fontWeight: 900, color: '#ffffff',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    textAlign: 'center', maxWidth: '250px',
                    lineHeight: 1.35, zIndex: 2, margin: 0,
                    textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                  }}>{schoolName}</h2>

                  <div style={{
                    marginTop: '10px', padding: '4px 16px',
                    background: 'rgba(251,191,36,0.12)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: '20px', border: '1px solid rgba(251,191,36,0.22)',
                    zIndex: 2,
                  }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em', color: '#fbbf24', textTransform: 'uppercase' }}>Administrator Identity</span>
                  </div>
                </div>

                {/* Profile Image */}
                <div style={{
                  display: 'flex', justifyContent: 'center',
                  marginTop: '-55px', position: 'relative', zIndex: 10,
                }}>
                  <div style={{
                    width: '130px', height: '130px', borderRadius: '50%',
                    border: '5px solid #ffffff', overflow: 'hidden',
                    boxShadow: '0 18px 45px rgba(30,15,0,0.25), 0 0 0 3px rgba(180,83,9,0.06)',
                    background: 'linear-gradient(135deg, #78350f, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {profile?.avatar_url ? (
                      <img src={`${profile.avatar_url}?cb=${Date.now()}`} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontSize: '42px', fontWeight: 900 }}>{initials}</span>
                    )}
                  </div>
                </div>

                {/* Name & Role */}
                <div style={{ textAlign: 'center', padding: '28px 28px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.025em', lineHeight: 1.15 }}>{profile?.full_name}</h3>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: '#b45309', letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>{role}</p>
                  <div style={{ width: '45px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, #92400e, #f59e0b, #fbbf24)', marginTop: '20px' }} />
                </div>

                <div style={{
                  marginTop: 'auto',
                  background: 'linear-gradient(90deg, #1a0a00, #451a03, #78350f, #b45309)',
                  padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    Valid {new Date().getFullYear()}–{new Date().getFullYear() + 1}
                  </span>
                  <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(251,191,36,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Powered by Skolic
                  </span>
                </div>
              </div>
            </div>

            {/* ════════ BACK SIDE — Admin ════════ */}
            <div ref={backRef} style={{ ...cardShell, transform: 'rotateY(180deg)' }}>
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(165deg, #1a0a00 0%, #451a03 30%, #78350f 60%, #b45309 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '24px'
              }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.035 }} viewBox="0 0 340 540">
                  <circle cx="55" cy="80" r="135" fill="white" />
                  <circle cx="295" cy="460" r="115" fill="white" />
                </svg>

                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', marginBottom: '14px', zIndex: 2,
                }}>
                  {profile?.schools?.logo_url ? (
                    <img src={`${profile.schools.logo_url}?cb=${Date.now()}`} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <CreditCard style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.7)' }} />
                  )}
                </div>

                <p style={{ fontSize: '15px', fontWeight: 900, color: 'rgba(255,255,255,0.95)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 24px', zIndex: 2, textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>{schoolName}</p>

                {/* Workable QR Code */}
                <div style={{
                  background: '#ffffff', padding: '20px', borderRadius: '24px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
                  zIndex: 2, margin: '10px 0'
                }}>
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '160px', height: '160px', background: '#fffbeb', borderRadius: '12px' }} />
                  )}
                </div>

                <p style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '24px 0 0', zIndex: 2, letterSpacing: '-0.02em' }}>{profile?.full_name}</p>
                <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(251,191,36,0.8)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '4px 0 0', zIndex: 2 }}>{role}</p>

                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.25)', padding: '12px 22px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>
                    Authorized Personnel — {schoolName}
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
