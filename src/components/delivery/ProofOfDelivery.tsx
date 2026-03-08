import { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useImageUpload } from '@/hooks/useImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProofOfDeliveryProps {
  orderId: string;
  onComplete?: () => void;
}

export function ProofOfDelivery({ orderId, onComplete }: ProofOfDeliveryProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress } = useImageUpload();
  const { toast } = useToast();

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      const result = await upload(file, {
        bucket: 'driver-documents',
        path: `proof-of-delivery/${orderId}`,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.7,
      });

      if (!result) return;

      const { error } = await supabase
        .from('orders')
        .update({ proof_of_delivery_url: result.url } as any)
        .eq('id', orderId);

      if (error) throw error;

      toast({ title: 'Delivery Confirmed', description: 'Photo proof uploaded successfully' });
      onComplete?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Proof of Delivery</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Delivery proof" className="w-full rounded-lg max-h-64 object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-32 border-dashed flex flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-muted-foreground">Take photo or upload</span>
          </Button>
        )}

        {preview && (
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isUploading || isSubmitting}
          >
            {isUploading || isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading... {progress}%
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Delivery
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
