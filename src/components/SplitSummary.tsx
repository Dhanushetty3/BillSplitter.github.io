
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SplitResult } from '@/lib/bill-utils';
import { Separator } from '@/components/ui/separator';
import { User, Receipt, FileDown, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { jsPDF } from "jspdf";
import { WhatsappIcon } from './icons/WhatsappIcon';
import { SmsIcon } from './icons/SmsIcon';

interface SplitSummaryProps {
  splits: SplitResult[];
  tax: number;
  tip: number;
  total: number;
  restaurantName?: string;
  hasError?: boolean;
}

export default function SplitSummary({ splits, tax, tip, total, restaurantName, hasError }: SplitSummaryProps) {
  const generateShareMessage = (res: SplitResult) => {
    const itemsText = res.items.map(it => `• ${it.name}: Rs.${it.cost.toFixed(2)}`).join('\n');
    const greeting = `Hi ${res.friend}!`;
    const intro = restaurantName 
      ? `Here is your split from ${restaurantName} via BillSplitter:`
      : `Here is your split from BillSplitter:`;
      
    return `${greeting}
${intro}

${itemsText}

Subtotal: Rs.${res.subtotal.toFixed(2)}
Tax Share: Rs.${res.taxShare.toFixed(2)}
Tip Share: Rs.${res.tipShare.toFixed(2)}
-------------------
Total Owed: Rs.${res.total.toFixed(2)}

Thanks!`;
  };

  const shareWhatsApp = (res: SplitResult) => {
    const text = encodeURIComponent(generateShareMessage(res));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareSMS = (res: SplitResult) => {
    const text = encodeURIComponent(generateShareMessage(res));
    const separator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?';
    window.open(`sms:${separator}body=${text}`, '_blank');
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    const convertSvgToPng = (svgDataUrl: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = svgDataUrl;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          // Upscale for better quality in PDF
          canvas.width = img.width * 4;
          canvas.height = img.height * 4;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const pngDataUrl = canvas.toDataURL("image/png");
            resolve(pngDataUrl);
          } else {
            reject(new Error("Could not get canvas context to convert SVG."));
          }
        };
        img.onerror = (err) => {
          console.error("SVG to PNG conversion error:", err);
          reject(new Error("Failed to load SVG image for PDF conversion."));
        };
      });
    };

    // --- Logo ---
    const logoDataUrl = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNiIgZmlsbD0iIzAwQTNGRiIvPjxwYXRoIGZpbGw9IndoaXRlIiBkPSJNNyA1aDEwYy41NSAwIDEgLjQ1IDEgMXYxM2wtMS41LTEuMjVMMTUgMTlsLTEuNS0xLjI1TDEyIDE5bC0xLjUtMS4yNUw5IDE5bC0xLjUtMS4yNUw2IDE5VjZjMC0uNTUuNDUtMSAxLTFaIi8+PC9zdmc+';
    
    let logoPngDataUrl: string;
    try {
      logoPngDataUrl = await convertSvgToPng(logoDataUrl);
    } catch (error) {
      console.error(error);
      // Fallback if conversion fails, proceed without logo
      logoPngDataUrl = '';
    }

    // --- Theme and Config ---
    const primaryColor = "#00A3FF"; // Matching the logo's blue
    const textColor = "#1F2937"; // gray-800
    const mutedColor = "#6B7280"; // gray-500
    const pageMargin = 20;
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (pageMargin * 2);

    // --- Helper Functions ---
    const drawHeader = (title: string) => {
        if (logoPngDataUrl) {
          doc.addImage(logoPngDataUrl, 'PNG', pageMargin, 18, 10, 10);
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        
        const startX = pageMargin + (logoPngDataUrl ? 14 : 0);
        
        // Draw "Bill" in black
        doc.setTextColor(textColor);
        doc.text("Bill", startX, 25);
        
        const billWidth = doc.getTextWidth("Bill");
        
        // Draw "Splitter" in blue
        doc.setTextColor(primaryColor);
        doc.text("Splitter", startX + billWidth, 25);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(textColor);
        doc.text(title, pageWidth - pageMargin, 25, { align: 'right' });
        
        const subtext = restaurantName ? `${restaurantName} | ${dateStr}` : dateStr;
        doc.setFontSize(10);
        doc.setTextColor(mutedColor);
        doc.text(subtext, pageWidth - pageMargin, 32, { align: 'right' });

        doc.setDrawColor(primaryColor);
        doc.setLineWidth(0.5);
        doc.line(pageMargin, 40, pageWidth - pageMargin, 40);
    };

    const drawFooter = (page: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setTextColor(mutedColor);
        const footerText = `Page ${page} of ${totalPages} | Generated by BillSplitter`;
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    const totalPages = splits.length + 1;
    let currentPage = 1;

    // --- Page 1: Summary Report ---
    drawHeader("Summary Report");
    let y = 60;
    
    // Summary table header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(mutedColor);
    doc.text("MEMBER", pageMargin, y);
    doc.text("TOTAL OWED", pageWidth - pageMargin, y, { align: 'right' });
    y += 8;
    doc.setDrawColor("#E5E7EB"); // gray-200
    doc.line(pageMargin, y, pageWidth - pageMargin, y);
    y += 8;

    // Summary table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(textColor);
    splits.forEach((res, index) => {
        if (index % 2 !== 0) { // Alternating row color
            doc.setFillColor("#F9FAFB"); // gray-50
            doc.rect(pageMargin, y - 6, contentWidth, 10, 'F');
        }
        doc.text(res.friend, pageMargin, y);
        doc.text(`Rs. ${res.total.toFixed(2)}`, pageWidth - pageMargin, y, { align: 'right' });
        y += 10;
    });

    // Grand total
    y += 5;
    doc.setDrawColor(primaryColor);
    doc.line(pageWidth / 2, y, pageWidth - pageMargin, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text("GRAND TOTAL", pageWidth / 2, y);
    doc.text(`Rs. ${total.toFixed(2)}`, pageWidth - pageMargin, y, { align: 'right' });

    drawFooter(currentPage, totalPages);
    currentPage++;


    // --- Pages 2+: Individual Breakdowns ---
    splits.forEach(res => {
        doc.addPage();
        drawHeader(`Breakdown for ${res.friend}`);
        y = 60;
        
        // Items table header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(mutedColor);
        doc.text("ITEM", pageMargin, y);
        doc.text("COST", pageWidth - pageMargin, y, { align: 'right' });
        y += 8;
        doc.setDrawColor("#E5E7EB");
        doc.line(pageMargin, y, pageWidth - pageMargin, y);
        y += 8;

        // Items table rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(textColor);
        if (res.items.length > 0) {
            res.items.forEach((item, index) => {
                if (index % 2 !== 0) {
                    doc.setFillColor("#F9FAFB");
                    doc.rect(pageMargin, y - 6, contentWidth, 10, 'F');
                }
                doc.text(item.name, pageMargin, y);
                doc.text(`Rs. ${item.cost.toFixed(2)}`, pageWidth - pageMargin, y, { align: 'right' });
                y += 10;
            });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(mutedColor);
            doc.text("No specific items assigned (split by equal/percentage).", pageMargin, y);
            y += 10;
        }

        // Calculation summary
        y = Math.max(y, 100); // Ensure summary starts at a consistent position if item list is short
        y += 15;

        const summaryX = pageWidth - pageMargin - 50;
        const valueX = pageWidth - pageMargin;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(textColor);

        doc.text("Subtotal:", summaryX, y, { align: 'right' });
        doc.text(`Rs. ${res.subtotal.toFixed(2)}`, valueX, y, { align: 'right' });
        y += 7;
        
        doc.text("Tax Share:", summaryX, y, { align: 'right' });
        doc.text(`Rs. ${res.taxShare.toFixed(2)}`, valueX, y, { align: 'right' });
        y += 7;

        doc.text("Tip Share:", summaryX, y, { align: 'right' });
        doc.text(`Rs. ${res.tipShare.toFixed(2)}`, valueX, y, { align: 'right' });
        y += 7;
        
        doc.setDrawColor("#E5E7EB");
        doc.line(summaryX - 10, y, valueX, y);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.text("Total Owed:", summaryX, y, { align: 'right' });
        doc.text(`Rs. ${res.total.toFixed(2)}`, valueX, y, { align: 'right' });

        drawFooter(currentPage, totalPages);
        currentPage++;
    });


    // --- Save the PDF ---
    const filename = restaurantName
      ? `BillSplitter_${restaurantName.replace(/\s+/g, '_')}_Report.pdf`
      : "BillSplitter_Split_Report.pdf";
    doc.save(filename);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-headline font-black text-foreground">Summary</h2>
          <p className="text-sm text-muted-foreground font-medium">Review and share individual breakdowns.</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generatePDF} 
                disabled={hasError}
                className="h-10 px-4 border-primary/20 text-primary hover:bg-primary/10 flex items-center gap-2 font-bold shadow-sm rounded-full"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasError ? "Complete the split to export" : "Download detailed PDF report"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {splits.map((res) => (
          <Card key={res.friend} className="border-border shadow-lg bg-card hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-2xl">
            <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <User className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-headline font-bold">{res.friend}</CardTitle>
                </div>
                <div className="flex gap-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={hasError}
                          className="h-8 w-8 disabled:opacity-30 rounded-full transition-all"
                          onClick={() => shareWhatsApp(res)}
                        >
                          <WhatsappIcon className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{hasError ? "Incomplete split" : "Share via WhatsApp"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={hasError}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 disabled:opacity-30 rounded-full transition-all"
                          onClick={() => shareSMS(res)}
                        >
                          <SmsIcon className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{hasError ? "Incomplete split" : "Share via SMS"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                {res.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm items-start">
                    <span className="text-muted-foreground/80 font-medium max-w-[70%] break-words">{item.name}</span>
                    <span className="font-bold shrink-0">Rs.${item.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="opacity-50" />
              <div className="space-y-1.5 text-xs font-medium text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-foreground">Rs.${res.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Share</span>
                  <span className="text-foreground">Rs.${res.taxShare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip Share</span>
                  <span className="text-foreground">Rs.${res.tipShare.toFixed(2)}</span>
                </div>
              </div>
              <div className="pt-2">
                <div className="bg-primary/5 rounded-xl p-3 flex justify-between items-center border border-primary/10">
                  <span className="font-bold text-primary/80 text-xs uppercase tracking-wider">Owes</span>
                  <span className="text-sm font-bold text-primary">Rs.${res.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary text-primary-foreground border-none shadow-2xl overflow-hidden relative rounded-3xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Receipt className="w-32 h-32 rotate-12" />
        </div>
        <CardContent className="p-8 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
                  <Store className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="space-y-1">
                  {restaurantName && (
                    <div className="text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] md:text-xs mb-1 opacity-90">
                      {restaurantName}
                    </div>
                  )}
                  <div className="text-primary-foreground/70 font-bold text-xs md:text-sm uppercase tracking-wider">
                    Grand Total
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-black flex items-center gap-1.5">
                <span className="text-sm opacity-80">Rs.</span>
                {total.toFixed(2)}
              </h3>
            </div>
            
            <div className="flex gap-8 border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-10 w-full md:w-auto justify-center md:justify-start">
              <div className="text-center">
                <p className="text-primary-foreground/60 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Total Tax</p>
                <p className="font-bold text-sm">Rs.${tax.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-primary-foreground/60 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Total Tip</p>
                <p className="font-bold text-sm">Rs.${tip.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
