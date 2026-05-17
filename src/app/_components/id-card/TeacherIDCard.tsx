'use client';

import { useRef } from 'react';
import Image from "next/image";
import QRCode from "react-qr-code";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileImage, FileText, Briefcase } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';

interface TeacherData {
  id: string; // Database UID for QR code
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
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadAsImage = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `teacher-id-${teacher.teacherId}.png`;
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
      pdf.save(`teacher-id-${teacher.teacherId}.pdf`);
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div
        ref={cardRef}
        id="teacher-id-card"
        className="w-[350px] rounded-2xl shadow-2xl overflow-hidden bg-white border border-border/50 animate-fade-in"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-2xl flex items-center justify-center border-2 border-white/50 overflow-hidden transform rotate-3">
              <img src="/images/Skolic app icon.svg" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-tight">{teacher.schoolName}</h1>
              <div className="mt-1 inline-block px-3 py-0.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-white">Faculty Identification</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center relative">
          {/* Decorative element */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-50 rounded-br-full -z-10 opacity-50" />
          
          {/* Profile Image */}
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
              <Image
                src={teacher.image || "/default-avatar.png"}
                alt="teacher"
                width={112}
                height={112}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-lg shadow-md">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold text-text-primary">
              {teacher.name}
            </h2>
            <div className="mt-1 inline-block px-3 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
              Staff ID: {teacher.teacherId}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-y-2.5 w-full text-sm">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-text-tertiary font-medium">Subjects</span>
              <span className="text-text-primary font-semibold truncate max-w-[200px]">{teacher.subjects}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-text-tertiary font-medium">Role</span>
              <span className="text-text-primary font-semibold">
                {teacher.isClassTeacher ? "Class Teacher" : "Faculty Member"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-text-tertiary font-medium">Contact</span>
              <span className="text-text-primary font-semibold">{teacher.phone}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-text-tertiary font-medium">Email</span>
              <span className="text-text-primary font-semibold truncate max-w-[200px]">{teacher.email}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100">
              <QRCode value={teacher.id} size={90} level="H" />
            </div>
            <span className="text-[10px] text-text-tertiary font-medium">Scan for Staff Attendance</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-bg-tertiary text-center p-5 border-t border-border/30 relative">
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-text-primary">Staff Session 2025-2026</p>
            <div className="flex items-center gap-2 opacity-40 grayscale transition-all">
               <img src="/images/Skolic app icon.svg" className="h-4 w-4" alt="Skolic" />
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
