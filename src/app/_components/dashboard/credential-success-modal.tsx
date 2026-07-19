'use client';


import { Copy, Printer, MessageSquare, ShieldCheck, Link } from 'lucide-react';
import { Modal } from '@/app/_components/ui/modal';
import { Button } from '@/app/_components/ui/button';
import { toast } from 'sonner';
import QRCode from "react-qr-code";

const PORTAL_BASE_URL = 'https://skolic-schools-management-system.netlify.app';

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

  // Build a shareable pre-filled login link with email and password in URL params
  const portalLink = `${PORTAL_BASE_URL}/login?email=${encodeURIComponent(credentials.email)}&password=${encodeURIComponent(credentials.password)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const shareOnWhatsApp = () => {
    const text = `*School Management Portal – Login Credentials*\n\n` +
      `*Name/Email:* ${credentials.email}\n` +
      `*Password:* ${credentials.password}\n` +
      `${credentials.rollNumber ? `*Roll Number:* ${credentials.rollNumber}\n` : ''}` +
      `${credentials.studentId ? `*Student ID:* ${credentials.studentId}\n` : ''}` +
      `\n*Click to Login Directly:*\n${portalLink}\n\n` +
      `_Credentials are pre-filled in the link. Please change your password after first login._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const printCredentials = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Student Login Credentials</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; background: #fff; color: #000; }
              h1 { font-size: 20px; margin-bottom: 4px; }
              .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
              .box { border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
              .label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 4px; }
              .value { font-size: 18px; font-weight: 900; margin-bottom: 16px; word-break: break-all; }
              .value.accent { color: #6366f1; letter-spacing: 0.1em; }
              .link { font-size: 11px; color: #6366f1; word-break: break-all; }
              .note { font-size: 11px; color: #ef4444; margin-top: 16px; padding: 10px; background: #fef2f2; border-radius: 8px; }
            </style>
          </head>
          <body>
            <h1>School Management Portal</h1>
            <p class="subtitle">Login credentials — Keep this safe and confidential</p>
            <div class="box">
              <div class="label">Email / Username</div>
              <div class="value">${credentials.email}</div>
              <div class="label">Password</div>
              <div class="value accent">${credentials.password}</div>
              ${credentials.rollNumber ? `<div class="label">Roll Number</div><div class="value">${credentials.rollNumber}</div>` : ''}
              ${credentials.studentId ? `<div class="label">Student ID</div><div class="value">${credentials.studentId}</div>` : ''}
            </div>
            <div class="box">
              <div class="label">Login Portal</div>
              <a class="link" href="${portalLink}">${portalLink}</a>
            </div>
            <div class="note">⚠️ Please change your password after first login.</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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
               <p className="text-sm font-bold text-text-tertiary">Login credentials have been securely generated. Share the link below with the student.</p>
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
                 <p className="text-xl font-black text-accent tracking-[0.2em] font-mono">{credentials.password}</p>
              </div>

              {credentials.rollNumber && (
                <div>
                  <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Roll Number</p>
                  <p className="text-base font-black text-text-primary">{credentials.rollNumber}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border/40">
                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">Pre-Filled Login Portal Link</p>
                 <div
                   className="flex items-center gap-2 text-xs font-bold text-accent cursor-pointer hover:underline group"
                   onClick={() => copyToClipboard(portalLink, 'Portal link with credentials')}
                   title="Click to copy"
                 >
                    <Link className="h-3 w-3 shrink-0" />
                    <span className="break-all line-clamp-2">{portalLink.substring(0, 60)}…</span>
                    <Copy className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
              </div>
           </div>

           <div className="flex flex-col items-center justify-center space-y-6 relative z-10 border-l border-border/40 pl-8">
              <div className="p-5 bg-white rounded-[2rem] shadow-2xl shadow-black/5 border border-border/30">
                 <QRCode 
                   value={portalLink} 
                   size={140} 
                 />
              </div>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em] text-center">Scan to Login Directly</p>
           </div>
        </div>

        {/* Share Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <button onClick={shareOnWhatsApp} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all group">
              <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span>
           </button>
           <button 
             onClick={() => copyToClipboard(portalLink, 'Portal link with credentials')} 
             className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-accent/10 text-accent hover:bg-accent/20 transition-all group"
           >
              <Link className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Copy Link</span>
           </button>
           <button 
             onClick={() => copyToClipboard(`Email: ${credentials.email}\nPassword: ${credentials.password}\nPortal: ${portalLink}`, 'Full credentials')} 
             className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-success/10 text-success hover:bg-success/20 transition-all group"
           >
              <Copy className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Copy All</span>
           </button>
           <button onClick={printCredentials} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] bg-text-primary/5 text-text-primary hover:bg-text-primary/10 transition-all group">
              <Printer className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Print Slip</span>
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
