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
    const itemsText = res.items.map(it => `• ${it.name}: ₹${it.cost.toFixed(2)}`).join('\n');
    const greeting = `Hi ${res.friend}!`;
    const intro = restaurantName 
      ? `Here is your split from ${restaurantName} via BillSplitter:`
      : `Here is your split from BillSplitter:`;
      
    return `${greeting}
${intro}

${itemsText}

Subtotal: ₹${res.subtotal.toFixed(2)}
Tax Share: ₹${res.taxShare.toFixed(2)}
Tip Share: ₹${res.tipShare.toFixed(2)}
-------------------
Total Owed: ₹${res.total.toFixed(2)}

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

  const generatePDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text("BillSplitter Summary Report", 20, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    if (restaurantName) {
      doc.setFont("helvetica", "bold");
      doc.text(restaurantName, 20, 35);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${dateStr}`, 20, 42);
    } else {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${dateStr}`, 20, 35);
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 48, 190, 48);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Person", 20, 60);
    doc.text("Total Owed (INR)", 190, 60, { align: "right" });
    
    doc.setDrawColor(59, 130, 246);
    doc.line(20, 63, 190, 63);

    let y = 75;
    doc.setFont("helvetica", "normal");
    let grandTotalSum = 0;
    
    splits.forEach((res) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(res.friend, 20, y);
      doc.text(res.total.toFixed(2), 190, y, { align: "right" });
      grandTotalSum += res.total;
      y += 12;
    });

    y += 5;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(110, y - 8, 190, y - 8);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("GRAND TOTAL", 110, y);
    doc.text(`${grandTotalSum.toFixed(2)}`, 190, y, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text("Total including tax and tip. Detailed breakdowns follow on the next pages.", 105, 285, { align: "center" });

    splits.forEach((res) => {
      doc.addPage();
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246);
      doc.text(`Breakdown for ${res.friend}`, 20, 25);
      
      if (restaurantName) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`From: ${restaurantName}`, 20, 32);
      }
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 36, 190, 36);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Item Name", 20, 50);
      doc.text("Cost (INR)", 190, 50, { align: "right" });
      doc.line(20, 53, 190, 53);

      let itemY = 63;
      doc.setFont("helvetica", "normal");
      res.items.forEach((item) => {
        if (itemY > 250) {
          doc.addPage();
          itemY = 20;
        }
        doc.text(item.name, 20, itemY);
        doc.text(item.cost.toFixed(2), 190, itemY, { align: "right" });
        itemY += 10;
      });

      itemY += 10;
      doc.line(120, itemY, 190, itemY);
      itemY += 10;
      
      doc.text("Subtotal:", 120, itemY);
      doc.text(res.subtotal.toFixed(2), 190, itemY, { align: "right" });
      itemY += 8;
      
      doc.text("Tax Share:", 120, itemY);
      doc.text(res.taxShare.toFixed(2), 190, itemY, { align: "right" });
      itemY += 8;
      
      doc.text("Tip Share:", 120, itemY);
      doc.text(res.tipShare.toFixed(2), 190, itemY, { align: "right" });
      
      itemY += 12;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246);
      doc.text("Total Owed:", 120, itemY);
      doc.text(`${res.total.toFixed(2)}`, 190, itemY, { align: "right" });
    });

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
                          className="h-8 w-8 hover:bg-green-100 disabled:opacity-30 rounded-full transition-all"
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
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 disabled:opacity-30 rounded-full transition-all"
                          onClick={() => shareSMS(res)}
                        >
                          <SmsIcon className="w-4 h-4" />
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
                    <span className="font-bold shrink-0">₹{item.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="opacity-50" />
              <div className="space-y-1.5 text-xs font-medium text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-foreground">₹{res.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Share</span>
                  <span className="text-foreground">₹{res.taxShare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tip Share</span>
                  <span className="text-foreground">₹{res.tipShare.toFixed(2)}</span>
                </div>
              </div>
              <div className="pt-2">
                <div className="bg-primary/5 rounded-xl p-3 flex justify-between items-center border border-primary/10">
                  <span className="font-bold text-primary/80 text-xs uppercase tracking-wider">Owes</span>
                  <span className="text-sm font-bold text-primary">₹{res.total.toFixed(2)}</span>
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
                <span className="text-sm opacity-80">₹</span>
                {total.toFixed(2)}
              </h3>
            </div>
            
            <div className="flex gap-8 border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-10 w-full md:w-auto justify-center md:justify-start">
              <div className="text-center">
                <p className="text-primary-foreground/60 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Total Tax</p>
                <p className="font-bold text-sm">₹{tax.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-primary-foreground/60 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Total Tip</p>
                <p className="font-bold text-sm">₹{tip.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
