import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  bucket: string;
  path?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface UploadResult {
  url: string;
  path: string;
}

export function useImageUpload() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = useCallback(
    async (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to compress image'));
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  const upload = useCallback(
    async (file: File, options: UploadOptions): Promise<UploadResult | null> => {
      const { bucket, path = '', maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

      setIsUploading(true);
      setProgress(10);

      try {
        // Compress if image
        let uploadData: Blob | File = file;
        if (file.type.startsWith('image/') && !file.type.includes('svg')) {
          setProgress(30);
          uploadData = await compressImage(file, maxWidth, maxHeight, quality);
        }

        setProgress(50);

        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${path ? path + '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, uploadData, {
            contentType: file.type.startsWith('image/') ? 'image/jpeg' : file.type,
            upsert: false,
          });

        if (error) throw error;

        setProgress(90);

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

        setProgress(100);

        return {
          url: urlData.publicUrl,
          path: data.path,
        };
      } catch (error: any) {
        console.error('Upload failed:', error);
        toast({
          title: 'Upload Failed',
          description: error.message || 'Failed to upload image',
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 500);
      }
    },
    [compressImage, toast]
  );

  const uploadMultiple = useCallback(
    async (files: File[], options: UploadOptions): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];
      for (const file of files) {
        const result = await upload(file, options);
        if (result) results.push(result);
      }
      return results;
    },
    [upload]
  );

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
  };
}
