'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, ArrowLeft, Smartphone, ExternalLink } from 'lucide-react';

function DownloadViewerContent() {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get('fileUrl');
  const fileName = searchParams.get('fileName') || 'download';

  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-trigger the download as soon as the page loads
  useEffect(() => {
    if (!fileUrl || downloadTriggered) return;

    // Small delay so the user sees the page first
    const timer = setTimeout(() => {
      triggerFileDownload();
    }, 800);

    return () => clearTimeout(timer);
  }, [fileUrl, downloadTriggered]);

  function triggerFileDownload() {
    if (!fileUrl) return;
    setDownloadTriggered(true);

    // Create a hidden anchor and click it — this triggers a standard
    // HTTPS download that Chrome / Edge can handle natively.
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success message after a brief moment
    setTimeout(() => setShowSuccess(true), 1500);
  }

  // No file URL provided — show a friendly error
  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-slate-100">
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <ExternalLink className="h-9 w-9 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">No File Found</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            The download link has expired or is invalid. Please return to the app and try downloading again.
          </p>
          <button
            onClick={() => window.close()}
            className="w-full h-14 rounded-2xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
            Close This Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-slate-100/80">

        {/* Success Icon */}
        <div className={`h-24 w-24 rounded-full mx-auto mb-8 flex items-center justify-center transition-all duration-700 ${
          showSuccess
            ? 'bg-emerald-50 scale-100'
            : 'bg-blue-50 scale-95 animate-pulse'
        }`}>
          {showSuccess ? (
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          ) : (
            <Download className="h-12 w-12 text-blue-500 animate-bounce" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
          {showSuccess ? 'Download Complete!' : 'Downloading Your File...'}
        </h1>

        {/* File name badge */}
        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mb-6">
          <Download className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{fileName}</span>
        </div>

        {/* Status Message */}
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          {showSuccess
            ? 'Download completed successfully. You may now return to the School Management App.'
            : 'Your file is being downloaded in the browser. Please wait a moment...'}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Manual re-download button */}
          <button
            onClick={triggerFileDownload}
            className="w-full h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-all active:scale-95"
          >
            <Download className="h-4 w-4" />
            Download Again
          </button>

          {/* Return to App instruction */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
              <Smartphone className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-medium text-left leading-relaxed">
                To return to the app, tap the <strong>recent apps</strong> button on your phone and select the <strong>School Management App</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <p className="mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
        Powered by Skolic
      </p>
    </div>
  );
}

export default function DownloadViewer() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Download className="h-10 w-10 text-blue-400 animate-bounce mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400">Preparing download...</p>
        </div>
      </div>
    }>
      <DownloadViewerContent />
    </Suspense>
  );
}
