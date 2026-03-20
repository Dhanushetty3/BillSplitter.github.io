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
      {items.map((item) => {
        const itemAssignments = assignments[item.id] || [];
        return (
          <Card key={item.id} className="overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-4 space-y-4">
                {/* Item Name */}
                <Input
                  value={item.name}
                  onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                  className="h-auto p-0 text-lg font-bold border-none focus-visible:ring-0 bg-transparent w-full"
                  placeholder="Item Name"
                />

                {/* Qty and Price */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor={`qty-${item.id}`} className="text-xs font-medium">Qty</label>
                      <Input
                        id={`qty-${item.id}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const q = parseInt(e.target.value);
                          onUpdateItem(item.id, { quantity: isNaN(q) ? 0 : q });
                        }}
                        className="w-20 h-9 text-center bg-muted/50 rounded-md border-input"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label htmlFor={`price-${item.id}`} className="text-xs font-medium">Price (₹)</label>
                      <Input
                        id={`price-${item.id}`}
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => {
                          const p = parseFloat(e.target.value);
                          onUpdateItem(item.id, { price: isNaN(p) ? 0 : p });
                        }}
                        className="w-24 h-9 text-center bg-muted/50 rounded-md border-input"
                      />
                    </div>
                </div>

                {/* Total and Delete */}
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">₹{item.lineTotal.toFixed(2)}</p>
                  </div>
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-10 w-10"
                    >
                      <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                
                {/* Divider and Assign To */}
                <div className="border-t border-border/50 pt-4">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assign to:</p>
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
                       {friends.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2">Add friends to assign items.</p>
                      )}
                    </div>
                </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
