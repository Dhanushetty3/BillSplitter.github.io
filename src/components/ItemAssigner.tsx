'use client';

import React from 'react';
import { BillItem } from '@/lib/bill-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ItemAssignerProps {
  items: BillItem[];
  friends: string[];
  assignments: Record<string, string[]>;
  onToggleAssignment: (itemId: string, friend: string) => void;
  onUpdateItem: (id: string, updates: Partial<BillItem>) => void;
  onDeleteItem: (id: string) => void;
}

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
        <div key={item.id} className="bg-card p-4 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-grow">
            <Input
              value={item.name}
              onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
              placeholder="Item Name"
              className="col-span-2"
            />
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdateItem(item.id, { quantity: parseInt(e.target.value, 10) || 1 })}
              placeholder="Qty"
            />
            <Input
              type="number"
              value={item.price}
              onChange={(e) => onUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
              placeholder="Price"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <div className="text-right sm:text-left w-20">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold">₹{item.lineTotal.toFixed(2)}</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 w-12 p-0 flex-shrink-0">
                    <div className="flex flex-col items-center">
                        <Users className="h-5 w-5"/>
                        <span className="text-xs font-bold">{assignments[item.id]?.length || 0}</span>
                    </div>
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
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-12 w-12 flex-shrink-0"
              onClick={() => onDeleteItem(item.id)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ))}
       {items.length === 0 && (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">No items to assign.</p>
          <p className="text-sm text-muted-foreground">Add items manually or re-scan your bill.</p>
        </div>
      )}
    </div>
  );
}
