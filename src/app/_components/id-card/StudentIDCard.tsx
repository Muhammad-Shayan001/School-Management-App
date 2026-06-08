'use client';

import { useRef, useState } from 'react';
import Image from "next/image";
import QRCode from "react-qr-code";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { FileImage, FileText, BadgeCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { triggerDownload, triggerPdfDownload, interceptWebViewDownload } from '@/app/_lib/utils/webview-download';

interface StudentData {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  parentName: string;
  phone: string;
  image?: string;
  schoolName: string;
  themeColor?: string;
  schoolLogo?: string | null;
}

export default function StudentIDCard({ student }: { student: StudentData }) {
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
      const fileName = `student-id-${student.rollNo || 'card'}-${isFlipped ? 'back' : 'front'}.png`;
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
      await triggerPdfDownload(pdf, `student-id-${student.rollNo || 'card'}.pdf`);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const initials = student.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const cardShell: React.CSSProperties = {
    width: `${CARD_W}px`, height: `${CARD_H}px`,
    borderRadius: '28px', overflow: 'hidden',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    position: 'absolute', inset: 0,
    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    boxShadow: '0 35px 90px rgba(10, 22, 50, 0.28), 0 0 0 1px rgba(30, 64, 175, 0.08)',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full py-4 animate-in fade-in zoom-in-95 duration-700">

      {/* Card Container with Flip */}
      <div style={{ perspective: '1400px' }}>
        <div style={{
          width: `${CARD_W}px`, height: `${CARD_H}px`,
          position: 'relative', transformStyle: 'preserve-3d',
          transition: 'transform 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

          {/* ══ FRONT SIDE ══ */}
          <div ref={frontRef} id="student-id-card-front" style={cardShell}>
            <div style={{ width: '100%', height: '100%', background: '#ffffff', display: 'flex', flexDirection: 'column', position: 'relative' }}>

              {/* Top Gradient */}
              <div style={{
                height: '210px', flexShrink: 0,
                background: 'linear-gradient(155deg, #070e1f 0%, #0f1d3d 30%, #1e3a6e 60%, #2563eb 100%)',
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingTop: '28px',
              }}>
                <svg style={{ position: 'absolute', bottom: '-1px', left: 0, width: '100%' }} viewBox="0 0 320 60" fill="none">
                  <path d="M0 40C40 18 80 48 130 30C180 12 240 45 320 28V60H0Z" fill="rgba(255,255,255,0.04)" />
                  <path d="M0 48C50 26 100 52 160 36C220 20 270 48 320 36V60H0Z" fill="#ffffff" />
                </svg>
                <div style={{ position: 'absolute', top: '-20px', right: '-15px', width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent)', filter: 'blur(22px)' }} />
                <div style={{ position: 'absolute', top: '50px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.1), transparent)', filter: 'blur(18px)' }} />

                {/* School Logo */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', marginBottom: '10px', zIndex: 2,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                }}>
                  {student.schoolLogo ? (
                    <img src={student.schoolLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src="/images/Skolic app icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                  )}
                </div>

                <h2 style={{
                  fontSize: '14px', fontWeight: 900, color: '#ffffff',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  textAlign: 'center', maxWidth: '250px',
                  lineHeight: 1.3, zIndex: 2, margin: 0,
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>{student.schoolName || 'Institution Name'}</h2>

                <div style={{
                  marginTop: '8px', padding: '4px 16px',
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                  borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)',
                  zIndex: 2,
                }}>
                  <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>Student Identity Card</span>
                </div>
              </div>

              {/* Profile Image */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-55px', position: 'relative', zIndex: 10 }}>
                <div style={{
                  width: '124px', height: '124px', borderRadius: '50%',
                  border: '5px solid #ffffff', overflow: 'hidden',
                  boxShadow: '0 18px 45px rgba(10,22,50,0.25), 0 0 0 3px rgba(37,99,235,0.08)',
                  background: 'linear-gradient(135deg, #1e3a6e, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {student.image ? (
                    <Image src={student.image} alt="Student Photo" width={120} height={120} className="object-cover w-full h-full" priority />
                  ) : (
                    <span style={{ color: '#fff', fontSize: '42px', fontWeight: 900 }}>{initials}</span>
                  )}
                </div>
              </div>

              {/* Name & Minimalist Role */}
              <div style={{ textAlign: 'center', padding: '24px 28px 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.025em', lineHeight: 1.15 }}>{student.name}</h3>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>Student</p>
                <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg, #1e40af, #60a5fa)', marginTop: '16px' }} />
              </div>

              {/* Bottom Bar */}
              <div style={{
                marginTop: 'auto',
                background: 'linear-gradient(90deg, #070e1f, #1e3a6e, #2563eb)',
                padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Valid 2025–26
                </span>
                <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Powered by Skolic
                </span>
              </div>
            </div>
          </div>

          {/* ══ BACK SIDE ══ */}
          <div ref={backRef} id="student-id-card-back" style={{ ...cardShell, transform: 'rotateY(180deg)' }}>
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(165deg, #070e1f 0%, #0f1d3d 35%, #1e3a6e 65%, #2563eb 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '24px'
            }}>
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.04 }} viewBox="0 0 320 508">
                <circle cx="40" cy="60" r="120" fill="white" />
                <circle cx="290" cy="440" r="100" fill="white" />
              </svg>

              <div style={{
                width: '46px', height: '46px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', marginBottom: '12px', zIndex: 2,
              }}>
                {student.schoolLogo ? (
                  <img src={student.schoolLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src="/images/Skolic app icon.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                )}
              </div>

              <p style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,0.95)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 24px', zIndex: 2, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {student.schoolName || 'Institution Name'}
              </p>

              {/* Workable Attendance QR Code */}
              <div style={{
                background: '#ffffff', padding: '20px', borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)', zIndex: 2, margin: '10px 0'
              }}>
                <QRCode value={student.id || "pending"} size={160} level="H" />
              </div>

              <p style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '24px 0 0', zIndex: 2, letterSpacing: '-0.02em' }}>{student.name}</p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(147,197,253,0.8)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '4px 0 0', zIndex: 2 }}>Attendance Scanner</p>

              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.25)', padding: '12px 22px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '7.5px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>
                  If found, return to {student.schoolName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[320px]">
        <Button
          variant="secondary"
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full h-11 rounded-2xl shadow-sm font-bold text-[10px] uppercase tracking-widest gap-2 bg-slate-100 hover:bg-slate-200"
        >
          <RotateCcw className="h-4 w-4" /> {isFlipped ? 'Show Front' : 'Show Back'}
        </Button>
        <Button
          variant="secondary"
          onClick={downloadAsImage}
          className="w-full h-11 rounded-2xl shadow-sm font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          <FileImage className="h-4 w-4 text-blue-600" /> Download Image
        </Button>
        <Button
          variant="secondary"
          onClick={downloadAsPDF}
          className="w-full h-11 rounded-2xl shadow-sm font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          <FileText className="h-4 w-4 text-blue-600" /> Export PDF
        </Button>
      </div>
    </div>
  );
}
