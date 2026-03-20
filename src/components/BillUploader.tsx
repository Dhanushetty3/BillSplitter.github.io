
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Camera, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeBillImage } from '@/app/actions';
import type { ScanPhysicalBillOutput } from '@/ai/flows/scan-physical-bill-flow';

interface BillUploaderProps {
  onDataExtracted: (data: ScanPhysicalBillOutput) => void;
}

const MAX_IMAGE_SIZE = 1024; // pixels

async function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('Failed to read file.'));
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_IMAGE_SIZE) {
            height = Math.round((height * MAX_IMAGE_SIZE) / width);
            width = MAX_IMAGE_SIZE;
          }
        } else {
          if (height > MAX_IMAGE_SIZE) {
            width = Math.round((width * MAX_IMAGE_SIZE) / height);
            height = MAX_IMAGE_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type));
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}


export default function BillUploader({ onDataExtracted }: BillUploaderProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload an image file (e.g., JPG, PNG).',
      });
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const resizedDataUri = await resizeImage(file);
      const result = await analyzeBillImage(resizedDataUri);

      if (result.success) {
        onDataExtracted(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error('An unknown error occurred');
      console.error(err);
      const errorMessage = 'Scan failed. Please try again with a clearer image.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: errorMessage,
      });
    } finally {
      setIsScanning(false);
    }
  }, [onDataExtracted, toast]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0] || null);
    if(event.target) {
      event.target.value = "";
    }
  };

  const handleButtonClick = (capture: 'environment' | 'user' | undefined) => {
    if (fileInputRef.current) {
        if (capture) {
            fileInputRef.current.setAttribute('capture', capture);
        } else {
            fileInputRef.current.removeAttribute('capture');
        }
        fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Scan Your Bill</h2>
        <p className="text-muted-foreground md:text-lg">
            Use your camera or upload a photo to extract items automatically.
        </p>

        <div className="relative flex flex-col items-center justify-center gap-4 pt-4">
            <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                ref={fileInputRef}
                className="hidden"
                disabled={isScanning}
            />

            <Button
                onClick={() => handleButtonClick('environment')}
                disabled={isScanning}
                className="w-full max-w-sm h-16 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:bg-primary/90 transition-all transform hover:scale-105"
            >
                {isScanning ? (
                    <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Scanning...
                    </>
                ) : (
                    <>
                        <Camera className="mr-2 h-6 w-6" />
                        Scan with Camera
                    </>
                )}
            </Button>
            
            <div className="text-sm text-muted-foreground">or</div>
            
            <Button
                variant="outline"
                onClick={() => handleButtonClick(undefined)}
                disabled={isScanning}
                className="w-full max-w-sm h-12 rounded-full border-border font-semibold"
            >
                <Upload className="mr-2 h-5 w-5" />
                Upload Photo
            </Button>
        </div>

        {error && (
            <div className="mt-4 text-center p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
            </div>
        )}
    </div>
  );
}
