'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { checkOffDay } from '@/app/_lib/actions/holidays';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { CheckCircle2, XCircle, QrCode, Loader2, Camera, CameraOff, User, Palmtree } from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';

interface ScanResult {
  success: boolean;
  message: string;
  userName?: string;
}

export default function AttendanceScanner() {
  const { user } = useAuthStore();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isOffDay, setIsOffDay] = useState<{ isOff: boolean, reason?: string } | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Check if today is an off-day (Sunday or Holiday)
    const today = new Date().toISOString().split('T')[0];
    if (user?.school_id) {
       // We check as 'student' by default for the general scanner, 
       // but holidays usually apply to everyone or roles specifically.
       // For scanner, if it's off for everyone, we block.
       checkOffDay(today, 'student', user.school_id).then(res => {
         if (res.isOff) setIsOffDay(res);
       });
    }
  }, [user]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setIsScannerActive(false);
  }, []);

  useEffect(() => {
    if (!isScannerActive || isOffDay?.isOff) return;

    const timer = setTimeout(() => {
      if (document.getElementById('qr-reader') && !scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 15, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          false
        );
        scannerRef.current.render(onScanSuccess, () => {});
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isScannerActive, isOffDay]);

  async function onScanSuccess(decodedText: string) {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const { markAttendanceByUid } = await import('@/app/_lib/actions/attendance_lookup');
      const result = await markAttendanceByUid(decodedText.trim());

      const scanRes: ScanResult = {
        success: result.success,
        message: result.message,
      };

      setScanResult(scanRes);

      if (result.success) {
        setScanCount(c => c + 1);
        setRecentScans(prev => [scanRes, ...prev].slice(0, 5));
        setTimeout(() => { setScanResult(null); isProcessingRef.current = false; }, 3000);
      } else {
        setTimeout(() => { setScanResult(null); isProcessingRef.current = false; }, 4000);
      }
    } catch {
      setScanResult({ success: false, message: 'Connection error. Try again.' });
      setTimeout(() => { setScanResult(null); isProcessingRef.current = false; }, 3000);
    } finally {
      setIsProcessing(false);
    }
  }

  if (isOffDay?.isOff) {
    return (
      <div className="p-8 text-center bg-emerald-50 rounded-3xl border-2 border-emerald-100 animate-in zoom-in duration-500">
         <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
           <Palmtree className="h-8 w-8 text-emerald-600" />
         </div>
         <h3 className="text-xl font-black text-emerald-800 tracking-tight">Today is an Off-Day</h3>
         <p className="text-sm font-bold text-emerald-600/80 mt-1 uppercase tracking-widest">{isOffDay.reason}</p>
         <div className="mt-6 py-2 px-4 bg-white/50 rounded-xl text-xs font-black text-emerald-700">
           Attendance scanning is disabled
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Scanner area */}
      {!isScannerActive ? (
        <div
          onClick={() => setIsScannerActive(true)}
          className="relative w-full aspect-square max-w-xs mx-auto rounded-2xl border-2 border-dashed border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10 flex flex-col items-center justify-center gap-4 p-8 text-center cursor-pointer hover:border-accent/60 hover:from-accent/10 hover:to-accent/20 transition-all duration-300 group"
        >
          <div className="p-5 rounded-full bg-accent/15 text-accent group-hover:scale-110 transition-transform duration-300">
            <Camera className="h-10 w-10" />
          </div>
          <div>
            <p className="font-black text-text-primary text-sm">Click to Start Scanner</p>
            <p className="text-xs text-text-tertiary mt-1">Point camera at ID card QR code</p>
          </div>
          {scanCount > 0 && (
            <div className="absolute top-3 right-3 bg-accent text-white text-xs font-black px-2 py-1 rounded-full">
              {scanCount} scanned
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full max-w-xs mx-auto">
          <div className="overflow-hidden rounded-2xl border-2 border-accent shadow-xl shadow-accent/20 bg-black">
            <div id="qr-reader" className="w-full" />
          </div>
          <button
            onClick={stopScanner}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors text-sm font-bold"
          >
            <CameraOff className="h-4 w-4" /> Stop Scanner
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-3 bg-accent/10 rounded-xl border border-accent/20 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-sm font-bold text-accent">Processing scan...</span>
        </div>
      )}

      {/* Scan Result Feedback */}
      {scanResult && (
        <div className={cn(
          'flex items-center gap-3 p-4 rounded-xl border animate-in slide-in-from-bottom-3 duration-300',
          scanResult.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        )}>
          {scanResult.success
            ? <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          }
          <span className="text-sm font-bold">{scanResult.message}</span>
        </div>
      )}
    </div>
  );
}
