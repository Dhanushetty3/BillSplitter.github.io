'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Share2, Printer, AlertTriangle } from 'lucide-react';
import type { SplitResult } from '@/lib/bill-utils';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { SmsIcon } from '@/components/icons/SmsIcon';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';


interface SplitSummaryProps {
  splits: SplitResult;
  tax: number;
  tip: number;
  total: number;
  restaurantName: string;
  hasError: boolean;
}

export default function SplitSummary({ splits, tax, tip, total, restaurantName, hasError }: SplitSummaryProps) {
  const friends = Object.keys(splits);

  const generateShareText = (friendName?: string) => {
    let text = `Bill Summary from ${restaurantName}:\n\n`;
    if (friendName) {
      const friendSplit = splits[friendName];
      text += `${friendName}, you owe ₹${friendSplit.total.toFixed(2)}.\n\nYour items:\n`;
      friendSplit.items.forEach(item => {
        text += `- ${item.name}: ₹${item.amount.toFixed(2)}\n`;
      });
    } else {
      text += `Total Bill: ₹${total.toFixed(2)}\n(Includes Tax: ₹${tax.toFixed(2)} & Tip: ₹${tip.toFixed(2)})\n\n`;
      text += '--- Who Pays What ---\n';
      friends.forEach(friend => {
        text += `${friend}: ₹${splits[friend].total.toFixed(2)}\n`;
      });
    }
    return encodeURIComponent(text);
  };

  const handlePrint = () => {
    window.print();
  };

  if (hasError) {
    return (
      <div className="p-10 text-center bg-card rounded-2xl border-2 border-dashed border-destructive/20 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2 text-destructive">Incomplete Split</h3>
        <p className="text-sm text-muted-foreground">
          Please resolve the issues in the 'Assign' tab before viewing the summary.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 printable-area">
      <Card className="shadow-lg border-border/50">
        <CardHeader className="text-center pb-4">
          <p className="text-sm text-muted-foreground">{restaurantName}</p>
          <CardTitle className="text-4xl font-black">₹{total.toFixed(2)}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Subtotal: ₹${(total - tax - tip).toFixed(2)} | Tax: ₹${tax.toFixed(2)} | Tip: ₹${tip.toFixed(2)}
          </p>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <Card key={friend} className="bg-muted/30">
                <CardHeader className="flex-row items-center justify-between p-4">
                  <CardTitle className="text-lg">{friend}</CardTitle>
                  <div className="text-lg font-bold text-primary">₹{splits[friend]?.total.toFixed(2) || '0.00'}</div>
                </CardHeader>
                {splits[friend]?.items.length > 0 && (
                  <CardContent className="p-4 pt-0">
                    <Separator className="mb-2" />
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {splits[friend].items.map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span className="truncate pr-2">{item.name}</span>
                          <span>₹{item.amount.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2 p-4 no-print">
            <Popover>
                <PopoverTrigger asChild>
                    <Button className="w-full sm:w-auto" variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share Summary</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                    <div className="flex flex-col gap-1">
                        <Button
                            variant="ghost"
                            className="justify-start"
                            asChild
                        >
                            <a href={`https://wa.me/?text=${generateShareText()}`} target="_blank" rel="noopener noreferrer">
                                <WhatsappIcon className="mr-2 h-4 w-4" /> WhatsApp
                            </a>
                        </Button>
                         <Button
                            variant="ghost"
                            className="justify-start"
                            asChild
                        >
                            <a href={`sms:?body=${generateShareText()}`}>
                                <SmsIcon className="mr-2 h-4 w-4" /> SMS
                            </a>
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

          <Button onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
