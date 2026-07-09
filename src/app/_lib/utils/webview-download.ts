'use client';

import { toast } from 'sonner';
import { uploadTempFile } from '@/app/_lib/actions/profile';

/**
 * Detects if the current page is running inside an Android WebView.
 * Checks for common WebView user-agent indicators.
 */
export function isAndroidWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return (
    ua.includes('SkolicAndroidApp') ||
    ua.includes('wv') ||
    (ua.includes('Android') && ua.includes('Version/'))
  );
}

/**
 * Call this at the VERY BEGINNING of any download click handler.
 * If true, return early and do NOT generate the file!
 */
export function interceptWebViewDownload(): boolean {
  if (isAndroidWebView()) {
    toast.success('Opening page in browser to complete download...', { duration: 6000 });
    
    const url = window.location.href;
    const separator = url.includes('?') ? '&' : '?';
    const externalUrl = `${url}${separator}open_external=true`;
    
    // 1. Try URL scheme which the WebViewClient intercepts
    window.location.href = externalUrl;
    
    // 2. Try intent scheme as fallback
    setTimeout(() => {
      try {
        const parsedUrl = new URL(url);
        const intentUrl = `intent://${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}#Intent;scheme=${parsedUrl.protocol.replace(':', '')};end;`;
        window.location.href = intentUrl;
      } catch (e) {
        // Ignore
      }
    }, 300);

    // 3. Try window.open
    setTimeout(() => {
      window.open(url, '_blank');
    }, 600);
    
    return true;
  }
  return false;
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API — these are the only functions imported by the rest of the app
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Download a file from a data-URL or raw base64 string.
 * Used for PNG / image downloads (e.g. ID card images via html-to-image).
 */
export async function triggerDownload(
  dataUrl: string,
  fileName: string,
  mimeType: string
): Promise<void> {
  const link = document.createElement('a');
  // Ensure the dataUrl has the correct mime prefix if it doesn't already
  if (!dataUrl.startsWith('data:')) {
    link.href = `data:${mimeType};base64,${dataUrl}`;
  } else {
    link.href = dataUrl;
  }
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download a Blob (e.g. CSV export).
 */
/**
 * Open the app's download viewer in a new tab using an object URL created
 * from the provided Blob. The viewer will auto-trigger the download and
 * show a friendly UI. The object URL is revoked after a timeout.
 */
export async function openDownloadViewerWithBlob(blob: Blob, fileName: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const objectUrl = URL.createObjectURL(blob);
    const viewerUrl = `${window.location.origin}/download-viewer?fileUrl=${encodeURIComponent(objectUrl)}&fileName=${encodeURIComponent(fileName)}`;
    // Open in a new tab so users keep the app open; browsers will block popups
    // if not triggered by a user gesture — callers should ensure this runs
    // directly from click handlers where possible.
    window.open(viewerUrl, '_blank');

    // Revoke the object URL after 60s to free memory.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000);
  } catch (e) {
    // If anything goes wrong, fall through to the fallback download method.
    console.error('Failed to open download viewer', e);
    throw e;
  }
}

export async function triggerBlobDownload(
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<void> {
  // Prefer opening the download viewer for a consistent UX (auto-trigger, progress UI).
  if (typeof window !== 'undefined') {
    try {
      await openDownloadViewerWithBlob(blob, fileName);
      return;
    } catch (e) {
      // Ignore and fallback to direct anchor download
    }
  }

  // Fallback: direct anchor download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download a jsPDF document instance. Prefer the download viewer when possible.
 */
export async function triggerPdfDownload(
  pdf: any,
  fileName: string
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      // jsPDF supports output('blob') in modern versions
      const blob: Blob | null = (typeof pdf.output === 'function') ? (pdf.output('blob') as Blob) : null;
      if (blob) {
        await openDownloadViewerWithBlob(blob, fileName);
        return;
      }
    } catch (e) {
      // If blob conversion fails, fall back to save()
      console.warn('Failed to convert PDF to blob for viewer, falling back to save()', e);
    }
  }

  // Last-resort fallback
  try {
    pdf.save(fileName);
  } catch (e) {
    console.error('Failed to save PDF directly', e);
  }
}
