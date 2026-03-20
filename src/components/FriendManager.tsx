"use client";

import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, X, User, Contact, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FriendManagerProps {
  friends: string[];
  onAddFriend: (name: string) => void;
  onRemoveFriend: (name: string) => void;
}

export default function FriendManager({ friends, onAddFriend, onRemoveFriend }: FriendManagerProps) {
  const [newName, setNewName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isContactPickerSupported, setIsContactPickerSupported] = useState(false);
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    setIsContactPickerSupported('contacts' in navigator && 'ContactsManager' in window);
  }, []);

  const handleAdd = () => {
    const names = newName.split(/[,\n]/).map(n => n.trim()).filter(n => n !== '');
    
    let addedCount = 0;
    names.forEach(name => {
      if (!friends.includes(name)) {
        onAddFriend(name);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setNewName('');
    }
  };

  const handleImportContacts = async () => {
    if (isContactPickerSupported) {
      try {
        // @ts-ignore - Contacts API
        const contacts = await navigator.contacts.select(['name'], { multiple: true });
        if (contacts && contacts.length > 0) {
          let addedCount = 0;
          contacts.forEach((contact: any) => {
            const name = contact.name?.[0] || 'Unknown';
            if (!friends.includes(name)) {
              onAddFriend(name);
              addedCount++;
            }
          });
          if (addedCount > 0) toast({ title: "Contacts Imported", description: `Added ${addedCount} members.` });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      }
    } else {
      vcfInputRef.current?.click();
    }
  };

  const handleVcfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fnRegex = /^FN:(.+)$/gm;
      const names: string[] = [];
      let match;
      while ((match = fnRegex.exec(content)) !== null) {
        const extractedName = match[1].trim();
        if (extractedName && !extractedName.includes('=')) names.push(extractedName);
      }
      if (names.length > 0) {
        let addedCount = 0;
        names.forEach(name => {
          if (!friends.includes(name)) { onAddFriend(name); addedCount++; }
        });
        if (addedCount > 0) toast({ title: "Imported", description: `Added ${addedCount} names.` });
      }
      if (vcfInputRef.current) vcfInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Friend's name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 h-11"
            suppressHydrationWarning
          />
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleImportContacts}
                    className="shrink-0 h-11 w-11 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Contact className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isContactPickerSupported ? 'Contacts' : 'vCard (.vcf)'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input type="file" ref={vcfInputRef} accept=".vcf" className="hidden" onChange={handleVcfUpload} />

            <Button size="icon" onClick={handleAdd} className="bg-primary h-11 w-11 hover:bg-primary/90 text-white shrink-0 shadow-sm">
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <p className="text-[10px] text-muted-foreground px-1 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Tip: You can paste multiple names separated by commas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {friends.map((friend) => (
          <Badge 
            key={friend} 
            variant="secondary" 
            className="pl-2 pr-1 py-1.5 flex items-center gap-1 text-sm bg-card border border-border shadow-sm animate-in zoom-in-95 duration-200"
          >
            <User className="w-3.5 h-3.5 text-primary/70" />
            <span className="max-w-[120px] truncate font-medium">{friend}</span>
            <button 
              onClick={() => onRemoveFriend(friend)}
              className="ml-1 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </Badge>
        ))}
        {friends.length === 0 && (
          <div className="text-center w-full py-6 bg-muted/20 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Add people to start splitting!</p>
          </div>
        )}
      </div>
    </div>
  );
}
