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

// ── Shared helper: upload base64 to Supabase and get an HTTPS URL ────────
async function uploadAndGetUrl(
  base64: string,
  fileName: string,
  mimeType: string
): Promise<{ publicUrl?: string; error?: string }> {
  try {
    const result = await uploadTempFile(base64, fileName, mimeType);
    if (!result || result.error) {
      return { error: result?.error || 'Upload returned no response' };
    }
    if (!result.publicUrl) {
      return { error: 'Upload succeeded but no public URL was returned' };
    }
    return { publicUrl: result.publicUrl };
  } catch (err: any) {
    return { error: err.message || 'Upload exception' };
  }
}


// ── Core handler used by ALL three public functions ──────────────────────
async function handleDownload(
  base64: string,
  fileName: string,
  mimeType: string,
  toastId: string | number
): Promise<void> {
  console.log('[Download] Starting secure file upload...');
  toast.loading('Uploading file for secure download...', { id: toastId });

  const { publicUrl, error } = await uploadAndGetUrl(base64, fileName, mimeType);

  if (error || !publicUrl) {
    console.error('[Download] Supabase upload failed:', error);
    toast.error(`Download failed: ${error || 'Could not upload file'}`, { id: toastId });
    return;
  }

  console.log('[Download] Upload OK. Triggering direct HTTPS download.');
  toast.success('Download started successfully!', { id: toastId });

  // For Android WebViews, blob/data URIs fail. By using a Supabase HTTPS URL 
  // with a ?download= query parameter, we force the Android DownloadManager 
  // to reliably handle the file.
  const link = document.createElement('a');
  link.href = publicUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  console.log('--- triggerDownload START ---', fileName, mimeType);
  const toastId = toast.loading('Preparing download...');

  // Extract pure base64
  let base64 = dataUrl;
  if (dataUrl.includes(',')) {
    base64 = dataUrl.split(',')[1];
  }

  if (!base64 || base64.length === 0) {
    toast.error('Download failed: empty file data.', { id: toastId });
    return;
  }

  try {
    await handleDownload(base64, fileName, mimeType, toastId);
  } catch (err: any) {
    console.error('triggerDownload exception:', err);
    toast.error(`Download error: ${err.message || 'Unknown error'}`, { id: toastId });
  }
}

/**
 * Download a Blob (e.g. CSV export).
 */
export async function triggerBlobDownload(
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<void> {
  console.log('--- triggerBlobDownload START ---', fileName, mimeType);
  const toastId = toast.loading('Preparing download...');

  try {
    // Convert Blob → base64 via FileReader
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });

    const base64 = dataUrl.split(',')[1];
    if (!base64 || base64.length === 0) {
      toast.error('Download failed: empty file data.', { id: toastId });
      return;
    }

    await handleDownload(base64, fileName, mimeType, toastId);
  } catch (err: any) {
    console.error('triggerBlobDownload exception:', err);
    toast.error(`Download error: ${err.message || 'Unknown error'}`, { id: toastId });
  }
}

/**
 * Download a jsPDF document instance.
 */
export async function triggerPdfDownload(
  pdf: any,
  fileName: string
): Promise<void> {
  console.log('--- triggerPdfDownload START ---', fileName);
  const toastId = toast.loading('Preparing PDF download...');

  try {
    const base64 = pdf.output('datauristring').split(',')[1];
    if (!base64 || base64.length === 0) {
      toast.error('Download failed: PDF generation returned empty data.', { id: toastId });
      return;
    }

    await handleDownload(base64, fileName, 'application/pdf', toastId);
  } catch (err: any) {
    console.error('triggerPdfDownload exception:', err);
    toast.error(`Download error: ${err.message || 'Unknown error'}`, { id: toastId });
  }
}
