'use client';

import { useState, useRef } from 'react';
import { 
  CheckCircle2, Copy, Share2, Printer, 
  Mail, MessageSquare, ExternalLink, ShieldCheck,
  Download, QrCode
} from 'lucide-react';
import { Modal } from '@/app/_components/ui/modal';
import { Button } from '@/app/_components/ui/button';
import { toast } from 'sonner';
import QRCode from "react-qr-code";

interface CredentialSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    email: string;
    password: string;
    studentId?: string;
    teacherId?: string;
    rollNumber?: string;
  } | null;
}

export function CredentialSuccessModal({ isOpen, onClose, credentials }: CredentialSuccessModalProps) {
  if (!credentials) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const shareOnWhatsApp = () => {
    const text = `*School Management Login Credentials*\n\n` +
      `*Email:* ${credentials.email}\n` +
      `*Password:* ${credentials.password}\n` +
      `*Portal:* https://school-app.edu/login\n\n` +
      `Please log in and change your password immediately.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const printCredentials = () => {
    window.print();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Credentials Generated Successfully"
      size="lg"
      className="rounded-[3rem] border-none overflow-hidden"
    >
      <div className="space-y-10 py-6">
        <div className="flex flex-col items-center text-center space-y-6">
           <div className="h-24 w-24 rounded-[2rem] bg-success/10 flex items-center justify-center text-success animate-bounce">
              <ShieldCheck className="h-12 w-12" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase">Account Security Ready</h3>
              <p className="text-sm font-bold text-text-tertiary">Login credentials have been securely generated for the new user.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-bg-tertiary/40 p-10 rounded-[2.5rem] border border-border/50 relative overflow-hidden">
           <div className="absolute -top-10 -right-10 h-40 w-40 bg-accent/5 rounded-full blur-3xl" />
           
           <div className="space-y-8 relative z-10">
              <div className="group cursor-pointer" onClick={() => copyToClipboard(credentials.email, 'Email')}>
                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 flex items-center justify-between">
                    Username / Email <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </p>
                 <p className="text-lg font-black text-text-primary tracking-tight break-all">{credentials.email}</p>
              </div>

              <div className="group cursor-pointer" onClick={() => copyToClipboard(credentials.password, 'Password')}>
                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 flex items-center justify-between">
                    Access Password <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </p>
                 <p className="text-lg font-black text-accent tracking-[0.2em]">{credentials.password}</p>
              </div>

              <div className="pt-4 border-t border-border/40">
                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Login Portal</p>
                 <div className="flex items-center gap-2 text-xs font-black text-text-secondary">
                    <span>https://school-app.edu/login</span>
                    <ExternalLink className="h-3 w-3" />
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-center justify-center space-y-6 relative z-10 border-l border-border/40 pl-8">
              <div className="p-5 bg-white rounded-[2rem] shadow-2xl shadow-black/5 border border-border/30">
                 <QRCode 
                   value={JSON.stringify({ 
                     email: credentials.email, 
                     id: credentials.studentId || credentials.teacherId 
                   })} 
                   size={140} 
                 />
              </div>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Security Access QR</p>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <button onClick={shareOnWhatsApp} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all group">
              <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
           </button>
           <button onClick={() => copyToClipboard(`${credentials.email}\n${credentials.password}`, 'Full credentials')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-accent/10 text-accent hover:bg-accent/20 transition-all group">
              <Copy className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Copy Text</span>
           </button>
           <button onClick={() => window.open('/login', '_blank')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-success/10 text-success hover:bg-success/20 transition-all group">
              <ExternalLink className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Portal Link</span>
           </button>
           <button onClick={printCredentials} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-text-primary/5 text-text-primary hover:bg-text-primary/10 transition-all group">
              <Printer className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Print Slips</span>
           </button>
           <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-text-primary/5 text-text-primary hover:bg-text-primary/10 transition-all group">
              <Download className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">PDF Export</span>
           </button>
        </div>

        <div className="flex justify-center pt-4">
           <Button onClick={onClose} className="bg-accent text-white hover:bg-accent/90 h-14 px-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-accent/20">
              Close & Finalize
           </Button>
        </div>
      </div>
    </Modal>
  );
}
