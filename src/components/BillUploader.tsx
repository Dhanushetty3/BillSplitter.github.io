"use client";

import React, { useState } from 'react';
import { Upload, Loader2, FileText, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractBillItems, ExtractBillItemsOutput } from '@/ai/flows/extract-bill-items-flow';
import { useToast } from '@/hooks/use-toast';

interface BillUploaderProps {
  onDataExtracted: (data: ExtractBillItemsOutput) => void;
}

export default function BillUploader({ onDataExtracted }: BillUploaderProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const compressAndResizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  };

  const processImage = async (dataUrl: string) => {
    setLoading(true);
    try {
      const compressedBase64 = await compressAndResizeImage(dataUrl);
      const result = await extractBillItems({ photoDataUri: compressedBase64 });
      onDataExtracted(result);
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: error.message || "Failed to extract items from the bill.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        processImage(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-xl bg-card transition-all hover:border-primary/60">
      <div className="relative mb-4">
        <div className="bg-primary/10 p-4 rounded-full">
          <FileText className="w-12 h-12 text-primary/60" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-primary p-2 rounded-lg text-white shadow-lg">
          <Camera className="w-4 h-4" />
        </div>
      </div>

      <h2 className="text-xl font-headline font-semibold mb-2">Scan Your Bill</h2>
      <p className="text-muted-foreground text-center mb-6 max-w-xs text-sm">
        Use your camera or upload a photo to extract items automatically.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button 
          disabled={loading}
          onClick={() => document.getElementById('camera-capture')?.click()}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-11"
        >
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
        
        <Button 
          variant="outline"
          disabled={loading}
          onClick={() => document.getElementById('bill-upload')?.click()}
          className="flex-1 border-primary/30 text-primary hover:bg-primary/5 h-11"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        
        {/* Hidden inputs for native handlers */}
        <input 
          id="camera-capture" 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleFileChange} 
        />
        
        <input 
          id="bill-upload" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </div>
      
      {loading && (
        <div className="mt-6 flex items-center gap-3 text-primary animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm font-bold">...Analyzing your bill...</p>
        </div>
      )}
    </div>
  );
}
