'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, UserPlus } from 'lucide-react';

interface FriendManagerProps {
  friends: string[];
  onAddFriend: (name: string) => void;
  onRemoveFriend: (name: string) => void;
}

export default function FriendManager({ friends, onAddFriend, onRemoveFriend }: FriendManagerProps) {
  const [newFriendName, setNewFriendName] = useState('');

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFriendName.trim() && !friends.includes(newFriendName.trim())) {
      onAddFriend(newFriendName.trim());
      setNewFriendName('');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddFriend} className="flex gap-2">
        <Input
          type="text"
          value={newFriendName}
          onChange={(e) => setNewFriendName(e.target.value)}
          placeholder="Enter friend's name"
          className="h-10"
        />
        <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0">
          <UserPlus className="h-4 w-4" />
        </Button>
      </form>
      <div className="space-y-2">
        {friends.map((friend) => (
          <div
            key={friend}
            className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
          >
            <span className="font-medium text-sm">{friend}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveFriend(friend)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
