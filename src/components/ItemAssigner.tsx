'use client';

import React from 'react';
import { BillItem } from '@/lib/bill-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Plus, Minus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/utils';


interface ItemAssignerProps {
  items: BillItem[];
  friends: string[];
  assignments: Record<string, string[]>;
  onToggleAssignment: (itemId: string, friend: string) => void;
  onUpdateItem: (id: string, updates: Partial<BillItem>) => void;
  onDeleteItem: (id: string) => void;
}

const QuantityControl = ({ id, quantity, onUpdateItem }: { id: string; quantity: number; onUpdateItem: (id:string, updates: Partial<BillItem>) => void}) => {
    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => onUpdateItem(id, { quantity: Math.max(1, quantity - 1) })}
            >
                <Minus className="h-4 w-4" />
            </Button>
            <Input
                type="number"
                value={quantity}
                onChange={(e) => onUpdateItem(id, { quantity: parseInt(e.target.value, 10) || 1 })}
                className="w-14 h-8 text-center font-bold border-0 bg-transparent focus-visible:ring-0"
                placeholder="Qty"
            />
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => onUpdateItem(id, { quantity: quantity + 1 })}
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
};


export default function ItemAssigner({
  items,
  friends,
  assignments,
  onToggleAssignment,
  onUpdateItem,
  onDeleteItem,
}: ItemAssignerProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="bg-card p-4 rounded-xl border border-border/70 shadow-sm transition-all hover:shadow-lg flex flex-col sm:flex-row sm:items-start gap-4">
          
          <div className="flex-grow space-y-3">
            <Input
              value={item.name}
              onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
              placeholder="Item Name"
              className="h-11 text-base font-medium"
            />
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50">
                    <span className="text-sm font-semibold pl-2 text-muted-foreground">Qty</span>
                    <QuantityControl id={item.id} quantity={item.quantity} onUpdateItem={onUpdateItem} />
                </div>
                <div className="flex items-center p-1 rounded-lg bg-muted/50 flex-grow">
                    <span className="text-sm font-semibold pl-2 text-muted-foreground">Price</span>
                    <div className="relative flex items-center flex-grow">
                        <span className="absolute left-2 text-sm font-medium text-muted-foreground">₹</span>
                        <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => onUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="h-8 text-right font-bold border-0 bg-transparent flex-grow pl-6"
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2">
            <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium">Item Total</p>
                <p className="font-extrabold text-2xl text-foreground">{formatCurrency(item.lineTotal)}</p>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-11 w-11 p-0 flex-shrink-0 relative rounded-lg border-dashed border-primary/50 text-primary hover:bg-primary hover:text-white">
                        <Users className="h-5 w-5"/>
                        <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-card">
                            {assignments[item.id]?.length || 0}
                        </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="flex flex-col gap-1">
                      {friends.map((friend) => (
                        <Button
                          key={friend}
                          variant={assignments[item.id]?.includes(friend) ? 'secondary' : 'ghost'}
                          onClick={() => onToggleAssignment(item.id, friend)}
                          className="justify-start"
                        >
                          {friend}
                        </Button>
                      ))}
                      {friends.length === 0 && <p className="p-2 text-xs text-muted-foreground">Add friends to assign</p>}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-11 w-11 flex-shrink-0 rounded-lg"
                  onClick={() => onDeleteItem(item.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
            </div>

          </div>
        </div>
      ))}
       {items.length === 0 && (
        <div className="text-center p-8 bg-muted/50 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground font-medium">No items to assign.</p>
          <p className="text-sm text-muted-foreground">Add items manually or re-scan your bill.</p>
        </div>
      )}
    </div>
  );
}
