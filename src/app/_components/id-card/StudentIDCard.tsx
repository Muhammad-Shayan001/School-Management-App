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
}

export default function StudentIDCard({ student }: { student: StudentData }) {
  const cardRef = useRef<HTMLDivElement>(null);

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
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 text-center">
          <h1 className="text-xl font-bold tracking-tight">{student.schoolName}</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-80 mt-0.5">Student Identification Card</p>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center relative">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 opacity-50" />
          
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
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-lg shadow-md">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold text-text-primary">
              {student.name}
            </h2>
            <div className="mt-1 inline-block px-3 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
              Roll No: {student.rollNo}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-y-2.5 w-full text-sm">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-text-tertiary font-medium">Class & Section</span>
              <span className="text-text-primary font-semibold">{student.class} - {student.section}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-text-tertiary font-medium">Parent/Guardian</span>
              <span className="text-text-primary font-semibold">{student.parentName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-text-tertiary font-medium">Emergency Contact</span>
              <span className="text-text-primary font-semibold">{student.phone}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100">
              <QRCode value={student.id} size={90} level="H" />
            </div>
            <span className="text-[10px] text-text-tertiary font-medium">Scan for Attendance</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-bg-tertiary text-center text-[10px] p-3 text-text-tertiary border-t border-border/30">
          <p className="font-medium">Valid Session: 2025-2026</p>
          <p className="mt-0.5 opacity-60">This card is property of {student.schoolName}</p>
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
