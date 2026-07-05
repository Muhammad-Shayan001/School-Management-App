'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { checkOffDay } from '@/app/_lib/actions/holidays';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import {
  CheckCircle2, XCircle, Loader2, Palmtree,
  Volume2, VolumeX, ShieldAlert, Cpu, History,
  MapPin, Keyboard, Camera, SwitchCamera, ScanLine, Clock
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';
import { getPakistanDateString, getPakistanTimeString } from '@/app/_lib/utils/format';

interface ScanLog {
  id: string;
  timestamp: string;
  scannedId: string;
  status: 'success' | 'failed' | 'duplicate' | 'pending' | 'already_marked';
  message: string;
  gate: string;
}

export default function AttendanceScanner() {
  const { user } = useAuthStore();
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedGate, setSelectedGate] = useState('Main Gate - Terminal A');
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isOffDay, setIsOffDay] = useState<{ isOff: boolean, reason?: string } | null>(null);

  const [lastScan, setLastScan] = useState<{ id: string; time: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'idle' | 'success' | 'error' | 'duplicate' | 'pending' | 'already_marked';
    text: string;
  }>({ type: 'idle', text: 'Waiting for ID card scan...' });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  // Focus on component mount only - with delayed timing and no scroll
  useEffect(() => {
    if (isOffDay?.isOff || isCameraOpen || !isMountedRef.current) return;

    // Focus once after component fully renders, without scrolling
    const focusTimer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 300);

    return () => clearTimeout(focusTimer);
  }, [isOffDay, isCameraOpen]);

  // Mark component as mounted
  useEffect(() => {
    isMountedRef.current = true;
    // Focus only on first mount
    const timer = setTimeout(() => {
      if (inputRef.current && isMountedRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Off-day checking on mount
  useEffect(() => {
    const today = getPakistanDateString();
    if (user?.school_id) {
      checkOffDay(today, 'student', user.school_id)
        .then(res => {
          if (res.isOff) setIsOffDay(res);
        })
        .catch(() => {
          setIsOffDay(null);
        });
    }
  }, [user]);

  // Audio synthesis chimes
  const playBeep = useCallback((type: 'success' | 'error') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === 'success') {
        // High-pitched double chirp
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.08); // C#6 note
        gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();

        osc1.stop(ctx.currentTime + 0.12);
        osc2.stop(ctx.currentTime + 0.25);
      } else {
        // Low buzzer warning sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (err) {
      console.warn('Browser AudioContext play failed:', err);
    }
  }, [isMuted]);

  const processScan = async (scannedId: string) => {
    if (!scannedId) return;

    setIsProcessing(true);
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);

    const now = Date.now();

    // 1. Duplicate scan prevention (3 second buffer per user ID)
    if (lastScan && lastScan.id === scannedId && now - lastScan.time < 3000) {
      playBeep('error');
      setStatusMessage({
        type: 'duplicate',
        text: `Duplicate scan blocked for ID: ${scannedId} (Wait 3s)`
      });

      const duplicateLog: ScanLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: getPakistanTimeString(new Date(), { hour: '2-digit', minute: '2-digit', hour12: true }),
        scannedId,
        status: 'duplicate',
        message: 'Duplicate scan blocked (3s debounce constraint)',
        gate: selectedGate
      };
      setLogs(prev => [duplicateLog, ...prev].slice(0, 50));
      setIsProcessing(false);

      statusTimeoutRef.current = setTimeout(() => {
        setStatusMessage({ type: 'idle', text: 'Waiting for ID card scan...' });
      }, 4000);
      return;
    }

    try {
      const { markAttendanceByUid } = await import('@/app/_lib/actions/attendance_lookup');
      const result = await markAttendanceByUid(scannedId);

      const timestamp = getPakistanTimeString(new Date(), { hour: '2-digit', minute: '2-digit', hour12: true });

      if (result.success) {
        if (result.status === 'pending') {
          playBeep('success'); // Same beep for now
          setStatusMessage({
            type: 'pending',
            text: result.message || 'Sent for approval.'
          });
          setLastScan({ id: scannedId, time: now });

          const pendingLog: ScanLog = {
            id: Math.random().toString(36).substring(7),
            timestamp,
            scannedId,
            status: 'pending',
            message: result.message || 'Sent for approval.',
            gate: selectedGate
          };
          setLogs(prev => [pendingLog, ...prev].slice(0, 50));
        } else if (result.status === 'already_marked') {
          playBeep('success');
          setStatusMessage({
            type: 'already_marked',
            text: result.message || 'Attendance already marked for today.'
          });
          setLastScan({ id: scannedId, time: now });

          const alreadyMarkedLog: ScanLog = {
            id: Math.random().toString(36).substring(7),
            timestamp,
            scannedId,
            status: 'already_marked',
            message: result.message || 'Attendance already marked for today.',
            gate: selectedGate
          };
          setLogs(prev => [alreadyMarkedLog, ...prev].slice(0, 50));
        } else {
          playBeep('success');
          setStatusMessage({
            type: 'success',
            text: result.message || 'Attendance request sent!'
          });
          setLastScan({ id: scannedId, time: now });

          const successLog: ScanLog = {
            id: Math.random().toString(36).substring(7),
            timestamp,
            scannedId,
            status: 'success',
            message: result.message || 'Attendance request sent successfully.',
            gate: selectedGate
          };
          setLogs(prev => [successLog, ...prev].slice(0, 50));
          
          // Show popup toast
          const { toast } = await import('sonner');
          toast.success('Attendance Marked Successfully', {
             description: `Your attendance has been marked successfully.\nDate: ${getPakistanDateString()}\nTime: ${timestamp}`.split('\n').map((l, i) => <div key={i}>{l}</div>),
             duration: 5000,
          });
        }
      } else {
        playBeep('error');
        setStatusMessage({
          type: 'error',
          text: result.message || 'Verification failed.'
        });

        const failedLog: ScanLog = {
          id: Math.random().toString(36).substring(7),
          timestamp,
          scannedId,
          status: 'failed',
          message: result.message || 'Verification failed.',
          gate: selectedGate
        };
        setLogs(prev => [failedLog, ...prev].slice(0, 50));
      }
    } catch (err) {
      playBeep('error');
      setStatusMessage({
        type: 'error',
        text: 'Network lookup timeout. Try scanning again.'
      });
    } finally {
      setIsProcessing(false);
      statusTimeoutRef.current = setTimeout(() => {
        setStatusMessage({ type: 'idle', text: 'Waiting for ID card scan...' });
      }, 4000);
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scannedId = inputValue.trim();
    if (!scannedId) return;
    setInputValue(''); // Clear input instantly for next hardware scan
    await processScan(scannedId);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setStatusMessage({ type: 'idle', text: 'Initializing camera...' });
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Prefer back camera if multiple exist
        const defaultCam = devices.length > 1 ? devices[1].id : devices[0].id;
        setSelectedCamera(defaultCam);

        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          defaultCam,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            processScan(decodedText);
          },
          (errorMessage) => {
            // Ignore continuous scan failures
          }
        );
        setStatusMessage({ type: 'idle', text: 'Camera Active. Scan QR Code.' });
      } else {
        setStatusMessage({ type: 'error', text: 'No camera found on this device.' });
        setIsCameraOpen(false);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Camera permission denied.' });
      setIsCameraOpen(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (e) {
        console.error(e);
      }
    }
    setIsCameraOpen(false);
    setStatusMessage({ type: 'idle', text: 'Waiting for ID card scan...' });
  };

  const switchCamera = async () => {
    if (!cameras.length || !scannerRef.current) return;

    const currentIndex = cameras.findIndex(c => c.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCam = cameras[nextIndex].id;

    await stopCamera();

    setIsCameraOpen(true);
    setSelectedCamera(nextCam);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        nextCam,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processScan(decodedText);
        },
        () => { }
      );
      setStatusMessage({ type: 'idle', text: 'Camera Active. Scan QR Code.' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to switch camera.' });
      setIsCameraOpen(false);
    }
  };

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
    <div className="space-y-8">
      {/* Configuration & Options Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-bg-tertiary/40 border border-border/50 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-accent" />
          <select
            value={selectedGate}
            onChange={(e) => {
              setSelectedGate(e.target.value);
              setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
            }}
            className="bg-transparent font-bold text-sm text-text-primary focus:outline-none cursor-pointer border-none p-0 focus:ring-0"
          >
            <option value="Main Gate - Terminal A" className="bg-bg-secondary text-text-primary">Main Gate (Terminal A)</option>
            <option value="North Entrance - Terminal B" className="bg-bg-secondary text-text-primary">North Entrance (Terminal B)</option>
            <option value="Primary Wing - Terminal C" className="bg-bg-secondary text-text-primary">Primary Wing (Terminal C)</option>
          </select>
        </div>

        <button
          onClick={() => {
            setIsMuted(!isMuted);
            setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
          }}
          className={cn(
            "p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider",
            isMuted
              ? "bg-danger/10 text-danger hover:bg-danger/20"
              : "bg-success/10 text-success hover:bg-success/20"
          )}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span>{isMuted ? "Sound Muted" : "Chime Enabled"}</span>
        </button>
      </div>

      {/* Main Radar Scanning Console */}
      <div className="relative w-full max-w-md mx-auto bg-gradient-to-b from-bg-secondary to-bg-tertiary rounded-[2.5rem] border border-border p-8 shadow-2xl overflow-hidden text-center flex flex-col items-center">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        {/* Pulsing Radar Ring & Camera Container */}
        <div className="relative w-full max-w-[280px] aspect-square mx-auto mb-6 flex items-center justify-center">
          {/* Camera Viewport */}
          {isCameraOpen ? (
            <div className="absolute inset-0 rounded-3xl overflow-hidden border-4 border-accent/40 shadow-2xl z-20">
              <div id="qr-reader" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />
              {/* Animated Scan Line Overlay */}
              <div className="absolute inset-x-0 h-1 bg-accent/80 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-radar-sweep opacity-70 z-30" />
            </div>
          ) : (
            <>
              {/* Outer Ring */}
              <div className={cn(
                "absolute inset-0 rounded-full border-2 border-dashed transition-all duration-700 animate-spin-slow",
                (statusMessage.type === 'success' || statusMessage.type === 'already_marked') && "border-success/40",
                statusMessage.type === 'error' && "border-danger/40",
                statusMessage.type === 'duplicate' && "border-warning/40",
                statusMessage.type === 'pending' && "border-amber-500/40",
                statusMessage.type === 'idle' && "border-accent/40"
              )} />
              {/* Inner Glow Circle */}
              <div className={cn(
                "h-48 w-48 rounded-full flex flex-col items-center justify-center shadow-inner relative transition-colors duration-500",
                (statusMessage.type === 'success' || statusMessage.type === 'already_marked') && "bg-success/10 text-success shadow-success/10",
                statusMessage.type === 'error' && "bg-danger/10 text-danger shadow-danger/10",
                statusMessage.type === 'duplicate' && "bg-warning/10 text-warning shadow-warning/10",
                statusMessage.type === 'pending' && "bg-amber-500/10 text-amber-500 shadow-amber-500/10",
                statusMessage.type === 'idle' && "bg-accent/5 text-accent shadow-accent/5"
              )}>
                {/* Visual Radar Laser Bar */}
                {statusMessage.type === 'idle' && (
                  <div className="absolute inset-x-4 top-0 h-1 bg-accent/60 shadow-lg shadow-accent animate-radar-sweep rounded-full" />
                )}

                {isProcessing ? (
                  <Loader2 className="h-16 w-16 animate-spin" />
                ) : (statusMessage.type === 'success' || statusMessage.type === 'already_marked') ? (
                  <CheckCircle2 className="h-16 w-16 animate-in zoom-in duration-300" />
                ) : statusMessage.type === 'pending' ? (
                  <Clock className="h-16 w-16 animate-in zoom-in duration-300" />
                ) : statusMessage.type === 'error' ? (
                  <XCircle className="h-16 w-16 animate-in zoom-in duration-300" />
                ) : statusMessage.type === 'duplicate' ? (
                  <ShieldAlert className="h-16 w-16 animate-in zoom-in duration-300" />
                ) : (
                  <ScanLine className="h-16 w-16 opacity-60 animate-pulse" />
                )}
              </div>
            </>
          )}
        </div>

        {/* Dynamic Status Text */}
        <div className="space-y-2 relative z-10">
          <p className={cn(
            "text-xs font-black uppercase tracking-[0.2em]",
            (statusMessage.type === 'success' || statusMessage.type === 'already_marked') && "text-success",
            statusMessage.type === 'error' && "text-danger",
            statusMessage.type === 'duplicate' && "text-warning",
            statusMessage.type === 'pending' && "text-amber-500",
            statusMessage.type === 'idle' && "text-text-tertiary"
          )}>
            {statusMessage.type === 'success' && "Verification Success"}
            {statusMessage.type === 'already_marked' && "Already Marked"}
            {statusMessage.type === 'pending' && "Approval Required"}
            {statusMessage.type === 'error' && "Verification Failed"}
            {statusMessage.type === 'duplicate' && "Security Debounce"}
            {statusMessage.type === 'idle' && "System Ready"}
          </p>

          <h4 className="text-lg font-black text-text-primary tracking-tight px-4 leading-tight">
            {statusMessage.text}
          </h4>
          <p className="text-[11px] text-text-tertiary font-bold max-w-[280px] mx-auto leading-relaxed">
            Scan QR via camera, external hardware scanner, or manually input ID.
          </p>
        </div>

        {/* Camera Controls */}
        <div className="mt-6 flex gap-3 relative z-10 w-full justify-center">
          {!isCameraOpen ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Camera className="h-4 w-4" />
              Open Mobile Camera
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  stopCamera();
                  setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-tertiary text-text-secondary font-black text-[11px] uppercase tracking-wider hover:bg-bg-tertiary/80 transition-all"
              >
                Close Camera
              </button>
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/50 border border-border/50 text-text-primary font-black text-[11px] uppercase tracking-wider hover:bg-white transition-all"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Hidden/Styled Capture Form */}
        <form onSubmit={handleScanSubmit} className="mt-8 w-full relative z-10">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300" />
            <div className="relative flex items-center bg-bg-primary rounded-xl border border-border/70 overflow-hidden px-4 cursor-text" onClick={() => inputRef.current?.focus()}>
              <Keyboard className="h-4 w-4 text-text-tertiary flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Scanner input active..."
                className="w-full bg-transparent border-none text-sm font-black text-text-primary placeholder:text-text-tertiary/50 py-3.5 focus:outline-none focus:ring-0 pl-3"
                autoComplete="off"
                disabled={isProcessing}
              />
              {inputValue && (
                <button
                  type="submit"
                  className="bg-accent text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-accent-hover transition-colors"
                >
                  Enter
                </button>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-1.5 opacity-60">
            <div className="h-1.5 w-1.5 bg-success rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
              Hardware Listener Hooked
            </span>
          </div>
        </form>
      </div>

      {/* Terminal Live Activity Log */}
      <div className="bg-bg-secondary border border-border rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <History className="h-4.5 w-4.5 text-accent" />
            <h5 className="text-xs font-black uppercase tracking-widest text-text-primary">Terminal Activity Log</h5>
          </div>
          {logs.length > 0 && (
            <button
              onClick={() => {
                setLogs([]);
                inputRef.current?.focus();
              }}
              className="text-[10px] font-black text-text-tertiary hover:text-danger uppercase tracking-wider transition-colors"
            >
              Clear Logs
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border/50 rounded-2xl bg-bg-tertiary/20">
            <p className="text-xs font-bold text-text-tertiary">No scans recorded on this terminal yet.</p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "p-3 rounded-2xl flex items-center justify-between gap-4 text-xs border transition-all animate-in slide-in-from-top-2 duration-300",
                  (log.status === 'success' || log.status === 'already_marked') && "bg-emerald-50/40 border-emerald-100 text-emerald-900",
                  log.status === 'failed' && "bg-red-50/40 border-red-100 text-red-900",
                  log.status === 'duplicate' && "bg-amber-50/40 border-amber-100 text-amber-900",
                  log.status === 'pending' && "bg-amber-50/40 border-amber-300 text-amber-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                    (log.status === 'success' || log.status === 'already_marked') && "bg-success/15 text-success",
                    log.status === 'failed' && "bg-danger/15 text-danger",
                    log.status === 'duplicate' && "bg-warning/15 text-warning",
                    log.status === 'pending' && "bg-amber-500/15 text-amber-600"
                  )}>
                    {(log.status === 'success' || log.status === 'already_marked') && "✓"}
                    {log.status === 'pending' && "!"}
                    {log.status === 'failed' && "✗"}
                    {log.status === 'duplicate' && "⚠"}
                  </div>
                  <div>
                    <p className="font-black text-text-primary tracking-tight leading-none mb-1">
                      {log.scannedId}
                    </p>
                    <p className="text-[10px] font-bold text-text-tertiary truncate max-w-[200px]">
                      {log.message}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-black text-text-primary text-[10px]">{log.timestamp}</p>
                  <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">{log.gate}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
