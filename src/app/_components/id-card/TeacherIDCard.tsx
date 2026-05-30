'use client';

import { useRef, useState } from 'react';
import Image from "next/image";
import QRCode from "react-qr-code";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { FileImage, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { triggerDownload, triggerPdfDownload, interceptWebViewDownload } from '@/app/_lib/utils/webview-download';

interface TeacherData {
  id: string;
  name: string;
  teacherId: string;
  email: string;
  phone: string;
  subjects: string;
  isClassTeacher: boolean;
  image?: string;
  schoolName: string;
}

export default function TeacherIDCard({ teacher }: { teacher: TeacherData }) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const CARD_W = 320;
  const CARD_H = 508;

  const downloadAsImage = async () => {
    if (interceptWebViewDownload()) return;
    const ref = isFlipped ? backRef.current : frontRef.current;
    if (!ref) return;
    try {
      const dataUrl = await toPng(ref, {
        cacheBust: true,
        pixelRatio: 3,
        style: {
          transform: 'none',
          backfaceVisibility: 'visible',
          webkitBackfaceVisibility: 'visible',
        },
      });
      const fileName = `staff-id-${teacher.teacherId || 'card'}-${isFlipped ? 'back' : 'front'}.png`;
      await triggerDownload(dataUrl, fileName, 'image/png');
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const downloadAsPDF = async () => {
    if (interceptWebViewDownload()) return;
    if (!frontRef.current || !backRef.current) return;
    try {
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
      await triggerPdfDownload(pdf, `staff-id-${teacher.teacherId || 'card'}.pdf`);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const initials = teacher.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const cardShell: React.CSSProperties = {
    width: `${CARD_W}px`, height: `${CARD_H}px`,
    borderRadius: '28px', overflow: 'hidden',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    position: 'absolute', inset: 0,
    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    boxShadow: '0 35px 90px rgba(2, 44, 34, 0.3), 0 0 0 1px rgba(4, 120, 87, 0.1)',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full py-4 animate-in fade-in zoom-in-95 duration-700">

      {/* Card with Flip */}
      <div style={{ perspective: '1400px' }}>
        <div style={{
          width: `${CARD_W}px`, height: `${CARD_H}px`,
          position: 'relative', transformStyle: 'preserve-3d',
          transition: 'transform 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

          {/* ══ FRONT SIDE ══ */}
          <div ref={frontRef} id="teacher-id-card-front" style={cardShell}>
            <div style={{ width: '100%', height: '100%', background: '#ffffff', display: 'flex', flexDirection: 'column', position: 'relative' }}>

              {/* Top Gradient */}
              <div style={{
                height: '210px', flexShrink: 0,
                background: 'linear-gradient(155deg, #0a0f0d 0%, #022c22 25%, #064e3b 55%, #047857 100%)',
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingTop: '28px',
              }}>
                <svg style={{ position: 'absolute', bottom: '-1px', left: 0, width: '100%' }} viewBox="0 0 320 60" fill="none">
                  <path d="M0 42C45 20 90 48 140 32C190 16 250 46 320 30V60H0Z" fill="rgba(255,255,255,0.03)" />
                  <path d="M0 50C55 28 110 52 170 38C230 24 275 48 320 38V60H0Z" fill="#ffffff" />
                </svg>
                <div style={{ position: 'absolute', top: '-18px', right: '-12px', width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent)', filter: 'blur(22px)' }} />
                <div style={{ position: 'absolute', top: '55px', left: '-18px', width: '75px', height: '75px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.08), transparent)', filter: 'blur(16px)' }} />
                {/* Gold accent lines */}
                <div style={{ position: 'absolute', top: '10px', right: '12px', width: '50px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.35))', borderRadius: '1px' }} />
                <div style={{ position: 'absolute', top: '17px', right: '12px', width: '28px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.2))', borderRadius: '1px' }} />

                {/* School Logo */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', marginBottom: '10px', zIndex: 2,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                }}>
                  <img src="/images/Skolic app icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                </div>

                <h2 style={{
                  fontSize: '14px', fontWeight: 900, color: '#ffffff',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  textAlign: 'center', maxWidth: '250px',
                  lineHeight: 1.3, zIndex: 2, margin: 0,
                  textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                }}>{teacher.schoolName || 'Institution Name'}</h2>

                <div style={{
                  marginTop: '8px', padding: '4px 16px',
                  background: 'rgba(212,168,67,0.1)', backdropFilter: 'blur(8px)',
                  borderRadius: '20px', border: '1px solid rgba(212,168,67,0.2)',
                  zIndex: 2,
                }}>
                  <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.28em', color: '#d4a843', textTransform: 'uppercase' }}>Faculty Identity Card</span>
                </div>
              </div>

              {/* Profile Image */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-55px', position: 'relative', zIndex: 10 }}>
                <div style={{
                  width: '124px', height: '124px', borderRadius: '50%',
                  border: '5px solid #ffffff', overflow: 'hidden',
                  boxShadow: '0 18px 45px rgba(2,44,34,0.25), 0 0 0 3px rgba(4,120,87,0.06)',
                  background: 'linear-gradient(135deg, #064e3b, #10b981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {teacher.image ? (
                    <Image src={teacher.image} alt="Teacher Photo" width={120} height={120} className="object-cover w-full h-full" priority />
                  ) : (
                    <span style={{ color: '#fff', fontSize: '42px', fontWeight: 900 }}>{initials}</span>
                  )}
                </div>
              </div>

              {/* Name & Minimalist Role */}
              <div style={{ textAlign: 'center', padding: '24px 28px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.025em', lineHeight: 1.15 }}>{teacher.name}</h3>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#047857', letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>
                  {teacher.isClassTeacher ? 'Class Teacher' : 'Faculty'}
                </p>
                <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, #b8860b, #d4a843, #f0c75e)', marginTop: '16px' }} />
              </div>

              {/* Bottom Bar */}
              <div style={{
                marginTop: 'auto',
                background: 'linear-gradient(90deg, #0a0f0d, #022c22, #064e3b, #047857)',
                padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Valid 2025–26
                </span>
                <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(212,168,67,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Powered by Skolic
                </span>
              </div>
            </div>
          </div>

          {/* ══ BACK SIDE ══ */}
          <div ref={backRef} id="teacher-id-card-back" style={{ ...cardShell, transform: 'rotateY(180deg)' }}>
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(165deg, #0a0f0d 0%, #022c22 30%, #064e3b 60%, #047857 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '24px'
            }}>
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.035 }} viewBox="0 0 320 508">
                <circle cx="50" cy="70" r="125" fill="white" />
                <circle cx="280" cy="430" r="105" fill="white" />
              </svg>

              <div style={{
                width: '46px', height: '46px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', marginBottom: '12px', zIndex: 2,
              }}>
                <img src="/images/Skolic app icon.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
              </div>

              <p style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,0.95)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 24px', zIndex: 2, textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
                {teacher.schoolName || 'Institution Name'}
              </p>

              {/* Workable Attendance QR Code */}
              <div style={{
                background: '#ffffff', padding: '20px', borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)', zIndex: 2, margin: '10px 0'
              }}>
                <QRCode value={teacher.id || "pending"} size={160} level="H" />
              </div>

              <p style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '24px 0 0', zIndex: 2, letterSpacing: '-0.02em' }}>{teacher.name}</p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(212,168,67,0.8)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '4px 0 0', zIndex: 2 }}>Attendance Scanner</p>

              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.25)', padding: '12px 22px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>
                  If found, return to {teacher.schoolName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[320px]">
        <Button
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full h-11 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shadow-sm font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          <RotateCcw className="h-4 w-4" /> {isFlipped ? 'Show Front' : 'Show Back'}
        </Button>
        <Button
          onClick={downloadAsImage}
          className="w-full h-11 rounded-2xl bg-white text-text-primary border border-border hover:bg-bg-tertiary shadow-sm font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          <FileImage className="h-4 w-4 text-emerald-600" /> Download Image
        </Button>
        <Button
          onClick={downloadAsPDF}
          className="w-full h-11 rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-xl shadow-emerald-700/20 font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          <FileText className="h-4 w-4" /> Export PDF
        </Button>
      </div>
    </div>
  );
}
