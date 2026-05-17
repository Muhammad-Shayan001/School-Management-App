'use client';

import { useRef } from 'react';
import Image from "next/image";
import QRCode from "react-qr-code";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileImage, FileText } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';

interface StudentData {
  id: string; // Database UID for QR code
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
  const cardRef = useRef<HTMLDivElement>(null);
  const themeColor = student.themeColor || '#2563eb'; // Default blue-600

  const downloadAsImage = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `student-id-${student.rollNo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  const downloadAsPDF = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      
      pdf.addImage(dataUrl, 'PNG', 10, 10, 80, (80 * imgProps.height) / imgProps.width);
      pdf.save(`student-id-${student.rollNo}.pdf`);
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div
        ref={cardRef}
        id="student-id-card"
        className="w-[350px] rounded-2xl shadow-2xl overflow-hidden bg-white border border-border/50 animate-fade-in"
      >
        {/* Header */}
        <div 
          className="text-white p-5 text-center relative overflow-hidden"
          style={{ backgroundColor: themeColor }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-2xl flex items-center justify-center border-2 border-white/50 overflow-hidden transform -rotate-3">
              <img 
                src={student.schoolLogo || "/images/Skolic app icon.svg"} 
                alt="Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
            <h1 className="text-2xl font-black tracking-tighter leading-tight">{student.schoolName}</h1>
            <div className="px-3 py-0.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
              <p className="text-[9px] uppercase font-black tracking-[0.2em] text-white">Student Passport</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center relative">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 opacity-10" style={{ backgroundColor: themeColor }} />
          
          {/* Profile Image */}
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
              <Image
                src={student.image || "/default-avatar.png"}
                alt="student"
                width={112}
                height={112}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div 
              className="absolute -bottom-2 -right-2 text-white p-1.5 rounded-lg shadow-md"
              style={{ backgroundColor: themeColor }}
            >
              <BookOpen className="h-4 w-4" />
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 text-center">
            <h2 className="text-xl font-black text-text-primary tracking-tight">
              {student.name}
            </h2>
            <div 
              className="mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
              style={{ 
                backgroundColor: themeColor + '15', 
                color: themeColor,
                borderColor: themeColor + '30'
              }}
            >
              Roll No: {student.rollNo}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-y-1 w-full text-sm">
            {[
              { label: 'Class & Section', value: `${student.class} - ${student.section}` },
              { label: 'Parent/Guardian', value: student.parentName },
              { label: 'Emergency Contact', value: student.phone },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{item.label}</span>
                <span className="text-xs font-black text-text-primary">{item.value || '—'}</span>
              </div>
            ))}
          </div>

          {/* QR Code */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100">
              <QRCode value={student.id} size={90} level="H" />
            </div>
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest opacity-60">Scan for Attendance</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-bg-tertiary text-center p-5 border-t border-border/30 relative">
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-text-primary">Session 2025-2026</p>
            <div className="flex items-center gap-2 opacity-40 grayscale group-hover:grayscale-0 transition-all">
               <img src="/images/Skolic app icon.png" className="h-4 w-4" alt="Skolic" />
               <span className="text-[8px] font-black uppercase tracking-widest">Powered by Skolic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-wrap justify-center gap-3 w-full max-w-[350px]">
        <Button 
          variant="secondary" 
          onClick={downloadAsImage}
          className="flex-1"
          leftIcon={<FileImage className="h-4 w-4" />}
        >
          PNG
        </Button>
        <Button 
          variant="secondary" 
          onClick={downloadAsPDF}
          className="flex-1"
          leftIcon={<FileText className="h-4 w-4" />}
        >
          PDF
        </Button>
      </div>
    </div>
  );
}

// Re-using same Lucide icon
function BookOpen({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
