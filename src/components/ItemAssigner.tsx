"use client";

import React from 'react';
import { User, Check, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BillItem } from '@/lib/bill-utils';
import { cn } from '@/lib/utils';

interface ItemAssignerProps {
  items: BillItem[];
  friends: string[];
  assignments: Record<string, string[]>;
  onToggleAssignment: (itemId: string, friend: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<BillItem>) => void;
  onDeleteItem: (itemId: string) => void;
}

export default function ItemAssigner({
  items,
  friends,
  assignments,
  onToggleAssignment,
  onUpdateItem,
  onDeleteItem
}: ItemAssignerProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => {
          const itemAssignments = assignments[item.id] || [];
          return (
            <Card key={item.id} className="overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      value={item.name}
                      onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                      className="h-9 text-base font-medium border-x-0 border-t-0 rounded-none border-b-2 border-transparent hover:border-primary/20 focus:border-primary focus:ring-0 px-1 -ml-1 transition-colors"
                      placeholder="Item Name"
                    />
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <label htmlFor={`qty-${item.id}`} className="text-xs">Qty</label>
                        <Input
                          id={`qty-${item.id}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value) || 0;
                            onUpdateItem(item.id, { quantity: q });
                          }}
                          className="w-16 h-8 text-center bg-muted/50 rounded-md border-input"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label htmlFor={`price-${item.id}`} className="text-xs">Price (₹)</label>
                        <Input
                          id={`price-${item.id}`}
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => {
                            const p = parseFloat(e.target.value) || 0;
                            onUpdateItem(item.id, { price: p });
                          }}
                          className="w-20 h-8 text-center bg-muted/50 rounded-md border-input"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-primary">₹{item.lineTotal.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 w-9"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assign to:</p>
                  <div className="flex flex-wrap gap-2">
                    {friends.map((friend) => {
                      const isActive = itemAssignments.includes(friend);
                      return (
                        <button
                          key={friend}
                          onClick={() => onToggleAssignment(item.id, friend)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          )}
                        >
                          <User className={cn("w-3 h-3", !isActive && "text-muted-foreground/70")} />
                          {friend}
                          {isActive && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}