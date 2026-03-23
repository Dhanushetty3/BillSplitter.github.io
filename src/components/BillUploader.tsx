"use client";

import React, { useState } from 'react';
import { Upload, Loader2, FileText, Camera, WifiOff, X, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeBillImage } from '@/app/actions';
import { type ExtractBillItemsOutput } from '@/ai/flows/extract-bill-items-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface BillUploaderProps {
  onDataExtracted: (data: ExtractBillItemsOutput) => void;
  isOnline: boolean;
}

export default function BillUploader({ onDataExtracted, isOnline }: BillUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [billImages, setBillImages] = useState<string[]>([]);
  const { toast } = useToast();

  const compressAndResizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
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

  const addImageToQueue = async (dataUrl: string) => {
    try {
      const compressedUrl = await compressAndResizeImage(dataUrl);
      setBillImages(prev => [...prev, compressedUrl]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Image Error",
        description: "Could not process the selected image.",
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addImageToQueue(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setBillImages(prev => prev.filter((_, i) => i !== index));
  };

  const mergeImages = async (imageSrcs: string[]): Promise<string> => {
    const images = await Promise.all(imageSrcs.map(src => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context is not supported");

    const maxWidth = Math.max(...images.map(img => img.width));
    const totalHeight = images.reduce((sum, img) => sum + img.height, 0);

    canvas.width = maxWidth;
    canvas.height = totalHeight;

    let currentY = 0;
    for (const img of images) {
        ctx.drawImage(img, 0, currentY);
        currentY += img.height;
    }

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleAnalyzeBill = async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "AI scanning requires an internet connection.",
      });
      return;
    }
    if (billImages.length === 0) {
      toast({
        title: "No Images",
        description: "Please add at least one bill image to analyze.",
      });
      return;
    }

    setLoading(true);
    try {
      const finalImage = billImages.length > 1 ? await mergeImages(billImages) : billImages[0];
      const result = await analyzeBillImage(finalImage);
      
      if (result.success) {
        onDataExtracted(result.data);
        setBillImages([]); // Clear images on success
      } else {
        toast({
          variant: "destructive",
          title: "Extraction Failed",
          description: result.error,
        });
      }
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

  const commonButtonProps = {
    disabled: loading || !isOnline,
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-primary/30 rounded-2xl bg-card transition-all hover:border-primary/60">
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
        Add one or more images of your bill. We'll stitch them together for analysis.
      </p>

      {!isOnline && (
        <div className="mb-4 w-full max-w-xs text-center p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span>AI scanning is unavailable offline.</span>
        </div>
      )}

      {billImages.length > 0 && (
        <div className="mb-6 w-full space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {billImages.map((src, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                <Image src={src} alt={`Bill ${index + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full" onClick={() => removeImage(index)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button 
            onClick={handleAnalyzeBill}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-base rounded-full shadow-lg"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ScanLine className="mr-2" />}
            {billImages.length === 1 ? `Split 1 Bill` : `Split ${billImages.length} Bills`}
          </Button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button 
          {...commonButtonProps}
          onClick={() => document.getElementById('camera-capture')?.click()}
          variant={billImages.length > 0 ? "outline" : "default"}
          className="flex-1 h-11"
        >
          <Camera className="w-4 h-4 mr-2" />
          {billImages.length > 0 ? 'Add More' : 'Take a Pic'}
        </Button>
        
        <Button 
          variant="outline"
          {...commonButtonProps}
          onClick={() => document.getElementById('bill-upload')?.click()}
          className="flex-1 border-primary/30 text-primary hover:bg-primary/5 h-11"
        >
          <Upload className="w-4 h-4 mr-2" />
          {billImages.length > 0 ? 'Upload More' : 'Upload Bill'}
        </Button>
      </div>
      
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
      
      {loading && billImages.length === 0 && (
        <div className="mt-6 flex items-center gap-3 text-primary animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm font-bold">Analyzing...</p>
        </div>
      )}
    </div>
  );
}
