
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Receipt, Users, ListTodo, PieChart, RotateCcw, PlusCircle, AlertCircle, Sun, Moon, Store, Percent, Scale, ListFilter, PlayCircle, CheckCircle2, Undo2, ArrowDownCircle } from 'lucide-react';
import BillUploader from '@/components/BillUploader';
import FriendManager from '@/components/FriendManager';
import ItemAssigner from '@/components/ItemAssigner';
import SplitSummary from '@/components/SplitSummary';
import { BillItem, calculateSplits, SplitMode } from '@/lib/bill-utils';
import type { ExtractBillItemsOutput } from '@/ai/flows/extract-bill-items-flow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import type { DemoBillData } from '@/app/actions';

export default function BillSplitter() {
  const [items, setItems] = useState<BillItem[]>([]);
  const [originalItems, setOriginalItems] = useState<BillItem[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [splitMode, setSplitMode] = useState<SplitMode>('item-wise');
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [editedFriends, setEditedFriends] = useState<Set<string>>(new Set());
  const [restaurantName, setRestaurantName] = useState("");
  const [billMeta, setBillMeta] = useState({ tax: 0, tip: 0, subtotal: 0 });
  const [activeTab, setActiveTab] = useState("scan");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  
  // Animation stages: 0 (Logo appearing), 1 (Quote fading in), 2 (Move to top)
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    setMounted(true);
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    // Exact Sequence timings:
    // 0s-1s: Logo centered.
    // 1s-3s: Quote fades in very slowly (2s duration).
    // 3s+: The move to header begins very slowly (4s duration).
    const timer1 = setTimeout(() => setAnimationStage(1), 1000); 
    const timer2 = setTimeout(() => setAnimationStage(2), 3000); 

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const resetToEqualPercentages = () => {
    if (friends.length > 0) {
      const evenPercent = Math.floor((100 / friends.length) * 100) / 100;
      const newPercents: Record<string, number> = {};
      friends.forEach((f, i) => {
        newPercents[f] = i === friends.length - 1 
          ? Math.round((100 - evenPercent * (friends.length - 1)) * 100) / 100 
          : evenPercent;
      });
      setPercentages(newPercents);
      setEditedFriends(new Set());
    }
  };

  useEffect(() => {
    resetToEqualPercentages();
  }, [friends.length]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const calculatedSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      setBillMeta(prev => ({ ...prev, subtotal: calculatedSubtotal }));
    }
  }, [calculatedSubtotal, items.length]);

  const billTotal = useMemo(() => billMeta.subtotal + billMeta.tax + billMeta.tip, [billMeta]);

  const onDataExtracted = (data: ExtractBillItemsOutput | DemoBillData) => {
    const formattedItems: BillItem[] = data.items.map((it, idx) => ({
      id: `item-${idx}-${Date.now()}`,
      name: it.name,
      quantity: it.quantity,
      price: it.price,
      lineTotal: it.lineTotal,
    }));
    setItems(formattedItems);
    setOriginalItems([...formattedItems]);
    setRestaurantName(data.restaurantName || "");
    setBillMeta({
      tax: data.tax,
      tip: data.tip || 0,
      subtotal: data.subtotal > 0 ? data.subtotal : formattedItems.reduce((sum, it) => sum + it.lineTotal, 0)
    });

    if ('isDemo' in data && data.isDemo) {
      setFriends(data.participants);
    }

    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    if (friends.length === 0) {
      setTimeout(() => {
        const section = document.getElementById('group-members-section');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  };

  const handleRevertConfirm = () => {
    setItems([...originalItems]);
    setShowRevertDialog(false);
  };

  const handleToggleAssignment = (itemId: string, friend: string) => {
    setAssignments(prev => {
      const current = prev[itemId] || [];
      if (current.includes(friend)) {
        return { ...prev, [itemId]: current.filter(f => f !== friend) };
      }
      return { ...prev, [itemId]: [...current, friend] };
    });
  };

  const handleUpdateItem = (id: string, updates: Partial<BillItem>) => {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        const newItem = { ...it, ...updates };
        if (updates.price !== undefined || updates.quantity !== undefined) {
          newItem.lineTotal = (newItem.price || 0) * (newItem.quantity || 0);
        }
        return newItem;
      }
      return it;
    }));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
    setAssignments(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleRemoveFriend = (name: string) => {
    setFriends(prev => prev.filter(f => f !== name));
    setAssignments(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(itemId => {
        next[itemId] = next[itemId].filter(f => f !== name);
      });
      return next;
    });
    setEditedFriends(prev => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const addNewItem = () => {
    const newItem: BillItem = {
      id: `manual-${Date.now()}`,
      name: "New Item",
      quantity: 1,
      price: 0,
      lineTotal: 0,
    };
    setItems(prev => [...prev, newItem]);
  };

  const handlePercentageChange = (friendName: string, newValue: number) => {
    const updatedEdited = new Set(editedFriends);
    updatedEdited.add(friendName);
    setEditedFriends(updatedEdited);

    const newPercents = { ...percentages, [friendName]: newValue };
    
    const uneditedFriends = friends.filter(f => !updatedEdited.has(f));
    
    if (uneditedFriends.length > 0) {
      const sumEdited = Array.from(updatedEdited).reduce((sum, name) => sum + (newPercents[name] || 0), 0);
      const remaining = Math.max(0, 100 - sumEdited);
      const splitRemaining = remaining / uneditedFriends.length;
      
      uneditedFriends.forEach(f => {
        newPercents[f] = Math.round(splitRemaining * 100) / 100;
      });
    }

    setPercentages(newPercents);
  };

  const unassignedItems = useMemo(() => {
    return items.filter(item => !assignments[item.id] || assignments[item.id].length === 0);
  }, [items, assignments]);

  const totalPercentage = useMemo(() => Object.values(percentages).reduce((sum, p) => sum + p, 0), [percentages]);

  const splitResults = useMemo(() => {
    return calculateSplits(items, friends, assignments, billMeta.tax, billMeta.tip, billMeta.subtotal, splitMode, percentages);
  }, [items, friends, assignments, billMeta, splitMode, percentages]);

  const isBillUploaded = useMemo(() => items.length > 0 || billMeta.subtotal > 0, [items.length, billMeta.subtotal]);

  const totalMismatch = useMemo(() => {
    if (friends.length === 0) return true;
    if (splitMode === 'item-wise') {
      return items.length === 0 || unassignedItems.length > 0;
    }
    if (splitMode === 'percentage') {
      return Math.abs(100 - totalPercentage) > 0.05;
    }
    return false;
  }, [splitMode, unassignedItems, totalPercentage, friends.length, items.length]);

  const isAssignDisabled = useMemo(() => {
    return !isBillUploaded || friends.length === 0;
  }, [isBillUploaded, friends.length]);

  const handleResetSession = () => {
    setItems([]);
    setOriginalItems([]);
    setFriends([]);
    setAssignments({});
    setPercentages({});
    setEditedFriends(new Set());
    setSplitMode('item-wise');
    setBillMeta({ tax: 0, tip: 0, subtotal: 0 });
    setRestaurantName("");
    setActiveTab("scan");
    setShowResetDialog(false);
  };

  if (!mounted) return null;

  const hasChanges = items.length !== originalItems.length || 
    items.some((it, idx) => {
      const orig = originalItems.find(o => o.id === it.id);
      return !orig || it.price !== orig.price || it.name !== orig.name || it.quantity !== orig.quantity;
    });

  return (
    <main className={cn(
      "max-w-5xl mx-auto px-4 pb-24 md:pb-12 safe-bottom min-h-screen overflow-x-hidden flex flex-col relative pt-12 md:pt-24",
      isBillUploaded ? "py-4 md:py-8" : ""
    )}>
      
      {/* Fixed Theme Toggle - Correctly placed at the top-right of the main container */}
      {(animationStage >= 2 || isBillUploaded) && (
        <div className="absolute right-4 top-4 md:top-8 z-[60] animate-in fade-in zoom-in duration-[1500ms]">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleTheme}
            className="h-10 w-10 rounded-full bg-card shadow-sm border-border"
          >
            {isDarkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-700" />}
          </Button>
        </div>
      )}

      {/* Top Dynamic Spacer for centering */}
      <div className={cn(
        "transition-all duration-[4000ms] ease-in-out transform-gpu",
        !isBillUploaded && animationStage < 2 ? "flex-grow" : "h-0 opacity-0 pointer-events-none"
      )} />

      {/* Success Dialog */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <DialogTitle className="text-2xl font-black text-center">Receipt Analyzed!</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              We found <span className="font-bold text-foreground">{items.length} items</span> totaling <span className="font-bold text-foreground">₹{billMeta.subtotal.toFixed(2)}</span> at <span className="font-bold text-foreground">{restaurantName || "the restaurant"}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-4">Ready to split? Let's add your friends next.</p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleCloseSuccessModal} className="w-full h-12 rounded-full font-bold text-base shadow-md">
              Great, Let's Go!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will reset the entire session. All your current progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to revert?</AlertDialogTitle>
            <AlertDialogDescription>
            All added or modified items will be removed, and the bill will return to the original scan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevertConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revert Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Header & Logo Section */}
      <div className={cn(
        "transition-all duration-[4000ms] transform-gpu ease-in-out flex flex-col items-center justify-center w-full z-50",
        !isBillUploaded && animationStage < 2 ? "mb-0" : "h-auto mb-2"
      )}>
        <div className={cn(
          "flex flex-col items-center transition-all duration-[4000ms] transform-gpu",
          !isBillUploaded && animationStage < 2 ? "scale-110 md:scale-125" : "scale-100"
        )}>
          <div className={cn(
            "flex items-center justify-center gap-3 transition-all duration-[1000ms]",
            animationStage >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="bg-primary p-2 md:p-3 rounded-2xl shadow-lg rotate-3 shrink-0">
              <Receipt className="text-white w-8 h-8 md:w-10 md:h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-foreground">
              Bill<span className="text-primary">Splitter</span>
            </h1>
          </div>
          
          <p className={cn(
            "mt-3 text-sm md:text-base text-muted-foreground font-medium text-center transition-all duration-[2000ms]",
            animationStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}>
            Split the bill, not the friendship.
          </p>
        </div>
      </div>

      {/* Main Content Reveal */}
      <div className={cn(
        "transition-all duration-[4000ms] transform-gpu flex flex-col w-full",
        animationStage < 2 && !isBillUploaded ? "opacity-0 pointer-events-none mt-0 h-0 overflow-hidden" : "opacity-100 translate-y-0 mt-4 h-auto"
      )}>
        
        {!isBillUploaded ? (
          <div className="max-w-xl mx-auto w-full py-2 space-y-4 animate-in fade-in duration-[4000ms]">
            <div className="bg-card rounded-3xl p-6 md:p-8 shadow-xl border border-border/50">
               <BillUploader onDataExtracted={onDataExtracted} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in duration-[2000ms]">
            <div className="lg:col-span-4 space-y-6 animate-in slide-in-from-left-8 duration-[2000ms]">
              <section id="group-members-section" className="bg-card rounded-2xl p-6 shadow-sm border border-border scroll-mt-24 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-headline font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Group Members
                  </h3>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium">{friends.length}</span>
                </div>
                <FriendManager 
                  friends={friends} 
                  onAddFriend={name => setFriends(prev => [...prev, name])} 
                  onRemoveFriend={handleRemoveFriend}
                />
                {friends.length === 0 && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-dashed border-primary/20 text-center animate-bounce duration-[2000ms] transition-all">
                    <ArrowDownCircle className="w-6 h-6 text-primary mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-primary font-bold">Add friends here to start splitting!</p>
                  </div>
                )}
              </section>

              <section className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-in slide-in-from-bottom-6 duration-[1500ms] transition-all hover:shadow-md">
                <h3 className="text-lg font-headline font-bold flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-primary" />
                  Bill Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      Place
                    </span>
                    <Input 
                      placeholder="Restaurant Name" 
                      value={restaurantName} 
                      onChange={e => setRestaurantName(e.target.value)}
                      className="w-40 h-8 text-right font-medium border-none bg-muted/30 focus-visible:ring-1" 
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <Input 
                        type="number" 
                        value={billMeta.subtotal} 
                        onChange={e => setBillMeta(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))}
                        className="w-24 h-8 text-right font-bold border-none bg-muted/30 focus-visible:ring-1" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <Input 
                        type="number" 
                        value={billMeta.tax} 
                        onChange={e => setBillMeta(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                        className="w-24 h-8 text-right font-medium border-none bg-muted/30 focus-visible:ring-1" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Tip</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <Input 
                        type="number" 
                        value={billMeta.tip} 
                        onChange={e => setBillMeta(prev => ({ ...prev, tip: parseFloat(e.target.value) || 0 }))}
                        className="w-24 h-8 text-right font-medium border-none bg-muted/30 focus-visible:ring-1" 
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-sm font-bold text-primary">₹{billTotal.toFixed(2)}</span>
                  </div>
                </div>
              </section>

              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full h-11 text-muted-foreground hover:bg-muted transition-all flex items-center justify-center gap-2 rounded-xl"
                  onClick={() => setShowResetDialog(true)}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Session
                </Button>
              </div>
            </div>

            <div className="lg:col-span-8 animate-in slide-in-from-right-8 duration-[2000ms]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-card p-1 rounded-2xl shadow-sm border border-border mb-6">
                  <TabsTrigger value="scan" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Receipt className="w-4 h-4 mr-2" />
                    <span className="text-xs md:text-sm">Scan</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="assign" 
                    disabled={isAssignDisabled}
                    className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white disabled:opacity-30"
                  >
                    <ListTodo className="w-4 h-4 mr-2" />
                    <span className="text-xs md:text-sm">Assign</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="summary" 
                    disabled={totalMismatch}
                    className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white disabled:opacity-30"
                  >
                    <PieChart className="w-4 h-4 mr-2" />
                    <span className="text-xs md:text-sm">Split</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scan" className="mt-0 focus-visible:outline-none">
                  <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                    <p className="text-sm text-center text-muted-foreground mb-4 font-medium">
                      Wrong items or poor scan?
                    </p>
                    <BillUploader onDataExtracted={onDataExtracted} />
                  </div>
                </TabsContent>

                <TabsContent value="assign" className="mt-0 focus-visible:outline-none space-y-6">
                  <div className="bg-card rounded-2xl p-6 border border-border shadow-sm animate-in slide-in-from-top-4 duration-[1000ms]">
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-4 block tracking-widest">Split Method</Label>
                    <RadioGroup 
                      value={splitMode} 
                      onValueChange={(val: any) => setSplitMode(val)}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center space-x-3 py-1">
                        <RadioGroupItem value="item-wise" id="item-wise" />
                        <Label htmlFor="item-wise" className="cursor-pointer font-medium flex items-center gap-2">
                          <ListFilter className="w-4 h-4 text-primary" />
                          Item Wise
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 py-1">
                        <RadioGroupItem value="equal" id="equal" />
                        <Label htmlFor="equal" className="cursor-pointer font-medium flex items-center gap-2">
                          <Scale className="w-4 h-4 text-primary" />
                          Equal Split
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 py-1">
                        <RadioGroupItem value="percentage" id="percentage" />
                        <Label htmlFor="percentage" className="cursor-pointer font-medium flex items-center gap-2">
                          <Percent className="w-4 h-4 text-primary" />
                          Percentage
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {splitMode === 'item-wise' && (
                    <div className="space-y-6 animate-in fade-in duration-[1000ms]">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl md:text-2xl font-headline font-bold text-foreground">Items</h2>
                        <div className="flex gap-2">
                          {hasChanges && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowRevertDialog(true)} 
                              className="h-9 text-muted-foreground hover:text-primary rounded-full px-4"
                            >
                              <Undo2 className="w-4 h-4 mr-1" />
                              Revert to Scanned
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={addNewItem} className="h-9 border-primary/50 text-primary hover:bg-primary hover:text-white rounded-full px-4">
                            <PlusCircle className="w-4 h-4 mr-1" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                      <ItemAssigner 
                        items={items} 
                        friends={friends} 
                        assignments={assignments} 
                        onToggleAssignment={handleToggleAssignment}
                        onUpdateItem={handleUpdateItem}
                        onDeleteItem={handleDeleteItem}
                      />
                    </div>
                  )}

                  {splitMode === 'equal' && (
                    <div className="p-16 text-center bg-card rounded-2xl border-2 border-dashed border-primary/20 shadow-sm animate-in zoom-in-95 duration-[1000ms]">
                      <Scale className="w-16 h-16 text-primary mx-auto mb-6 opacity-80" />
                      <h3 className="text-2xl font-bold mb-3">Equal Split Active</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Divided equally among your <span className="font-bold text-foreground">{friends.length}</span> group members.
                      </p>
                      {friends.length > 0 && (
                        <div className="mt-8 p-6 bg-primary/5 rounded-2xl inline-block border border-primary/10">
                          <p className="text-xs uppercase font-bold text-primary/70 tracking-wider mb-2">Per Person</p>
                          <p className="text-xl font-black text-primary">₹{(billTotal / friends.length).toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {splitMode === 'percentage' && (
                    <div className="space-y-6 animate-in fade-in duration-[1000ms]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl md:text-2xl font-headline font-bold text-foreground">Percentages</h2>
                          {friends.length > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={resetToEqualPercentages}
                              className="h-7 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary border-primary/20 rounded-full"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Equalize
                            </Button>
                          )}
                        </div>
                        <div className={cn(
                          "text-xs font-bold px-4 py-1.5 rounded-full border transition-all duration-500",
                          Math.abs(100 - totalPercentage) < 0.05 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-100"
                        )}>
                          {Math.abs(100 - totalPercentage) < 0.05 ? "100.00%" : `${(100 - totalPercentage).toFixed(2)}% remaining`}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {friends.map(friend => (
                          <Card key={friend} className="overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md animate-in fade-in zoom-in-95 duration-700">
                            <CardContent className="p-5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                  <Users className="w-4 h-4" />
                                </div>
                                <span className="font-bold">{friend}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <PercentageInput 
                                  value={percentages[friend] || 0}
                                  onChange={(val) => handlePercentageChange(friend, val)}
                                />
                                <span className="text-muted-foreground font-bold">%</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalMismatch && (
                    <Alert variant="destructive" className="mt-8 border-2 border-destructive/20 bg-destructive/5 rounded-2xl animate-in slide-in-from-top-6 duration-[1000ms]">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="font-bold">
                        {splitMode === 'percentage' ? `${(100 - totalPercentage).toFixed(2)}% remaining` : "Split incomplete"}
                      </AlertTitle>
                      <AlertDescription className="text-xs opacity-90">
                        {splitMode === 'item-wise' ? (
                          <span>Please assign all items to members.</span>
                        ) : splitMode === 'percentage' ? (
                          <span>Please adjust percentages to reach exactly 100.00%.</span>
                        ) : "Total mismatch detected."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-8 flex justify-end">
                    <Button 
                      size="lg" 
                      onClick={() => setActiveTab("summary")}
                      disabled={totalMismatch}
                      className="w-full sm:w-auto px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-lg h-14 rounded-full disabled:opacity-50 transition-all hover:scale-105"
                    >
                      View Split Summary
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="mt-0 focus-visible:outline-none">
                  <SplitSummary 
                    splits={splitResults} 
                    tax={billMeta.tax} 
                    tip={billMeta.tip} 
                    total={billTotal} 
                    restaurantName={restaurantName}
                    hasError={totalMismatch}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Dynamic Spacer for centering */}
      <div className={cn(
        "transition-all duration-[4000ms] ease-in-out transform-gpu",
        !isBillUploaded && animationStage < 2 ? "flex-grow" : "h-0 opacity-0 pointer-events-none"
      )} />

    </main>
  );
}

function PercentageInput({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const [localValue, setLocalValue] = useState(value.toFixed(2));

  useEffect(() => {
    const parsedLocal = parseFloat(localValue);
    if (!isNaN(parsedLocal) && Math.abs(parsedLocal - value) > 0.001) {
      setLocalValue(value.toFixed(2));
    }
  }, [value]);

  const handleBlur = () => {
    const val = localValue === "" || isNaN(parseFloat(localValue)) ? 0 : parseFloat(localValue);
    onChange(val);
    setLocalValue(val.toFixed(2));
  };

  return (
    <Input 
      className="w-24 text-right h-10 rounded-lg bg-muted/30 border-none focus-visible:ring-1" 
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => e.key === 'Enter' && handleBlur()}
    />
  );
}

    