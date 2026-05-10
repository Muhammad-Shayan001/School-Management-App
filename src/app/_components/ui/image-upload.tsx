'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/_lib/supabase/client';
import { Camera, Loader2, Upload, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/app/_lib/utils/cn';

interface ImageUploadProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  userId?: string; // Accept userId as a prop
  bucket?: string;
  className?: string;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export function ImageUpload({
  currentImageUrl,
  onUploadComplete,
  userId,
  bucket = 'profiles',
  className
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError('Please upload an image less than 1 MB');
      e.target.value = '';
      return;
    }

    if (!userId) {
      setError('System Error: User ID missing');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      // Use the passed userId for a clean filename
      const filePath = `${userId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '0',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}?t=${new Date().getTime()}`;

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
    } catch (error: any) {
      console.error('Upload Error:', error);
      setError(error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("relative flex flex-col items-center gap-4", className)}>
      <div className="relative group">
        <div className={cn(
          "relative w-32 h-32 rounded-[2rem] overflow-hidden border-2 transition-all duration-300 bg-bg-tertiary shadow-xl",
          error ? "border-danger ring-4 ring-danger/10" : "border-border group-hover:border-accent"
        )}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=User&background=random`;
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-tertiary">
              <Upload className="h-8 w-8 mb-2 opacity-50" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Upload</span>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-7 w-7 text-white animate-spin" />
            </div>
          )}

          <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm z-20">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleUpload}
              disabled={isUploading}
            />
            <div className="p-3 rounded-2xl bg-white text-text-primary shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Camera className="h-6 w-6" />
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="absolute top-full mt-4 w-64 animate-in fade-in slide-in-from-top-2 duration-300 z-30">
          <div className="bg-white dark:bg-zinc-900 border border-danger/20 rounded-2xl p-4 shadow-2xl flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-danger" />
            <AlertTriangle className="h-4 w-4 text-danger flex-shrink-0" />
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[11px] font-bold text-danger leading-tight">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="absolute top-2 right-2 text-text-tertiary hover:text-danger">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
