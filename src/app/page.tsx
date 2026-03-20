
'use client';

import React, { 
  useReducer, 
  useState, 
  useCallback, 
  useMemo,
  useRef,
  ChangeEvent
} from 'react';
import { 
  Users, 
  FileText, 
  Plus, 
  Trash2, 
  Camera, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  FileDown,
  X,
  CheckCircle2,
  Share2,
  ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea";
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from '@/lib/utils';
import type { Bill, Participant, Item, SplitMethod } from '@/lib/types';
import { AppLogo } from '@/components/icons/AppLogo';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { SmsIcon } from '@/components/icons/SmsIcon';
import { 
  analyzeBillImage, 
  analyzeDigitalBill, 
  processNaturalLanguageItems 
} from './actions';
import type { ScanPhysicalBillOutput } from '@/ai/flows/scan-physical-bill-flow';

type BillAction =
  | { type: 'RESET_BILL' }
  | { type: 'UPDATE_BILL_DETAILS'; payload: { name?: string; date?: string; place?: string, splitMethod?: SplitMethod, tax?: number, tip?: number } }
  | { type: 'ADD_PARTICIPANT'; payload: Participant }
  | { type: 'REMOVE_PARTICIPANT'; payload: { id: string } }
  | { type: 'ADD_ITEM'; payload: Item }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<Item> } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'SET_FROM_AI', payload: Partial<Bill> };

const initialState: Bill = {
  name: "New Bill",
  date: new Date().toISOString().split('T')[0],
  participants: [],
  items: [],
  tax: 0,
  tip: 0,
  splitMethod: 'item-wise',
};

const billReducer = (state: Bill, action: BillAction): Bill => {
  switch (action.type) {
    case 'RESET_BILL':
      return { ...initialState, date: new Date().toISOString().split('T')[0] };
    case 'UPDATE_BILL_DETAILS':
      return { ...state, ...action.payload };
    case 'ADD_PARTICIPANT':
      return { ...state, participants: [...state.participants, action.payload] };
    case 'REMOVE_PARTICIPANT': {
      const newParticipants = state.participants.filter(p => p.id !== action.payload.id);
      const newItems = state.items.map(item => ({
        ...item,
        paidBy: item.paidBy === action.payload.id ? 'unassigned' : item.paidBy,
        splitAmong: item.splitAmong.filter(id => id !== action.payload.id),
      })).filter(item => item.splitAmong.length > 0 || item.paidBy !== 'unassigned');
      return { ...state, participants: newParticipants, items: newItems };
    }
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
        ),
      };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload.id) };
    case 'SET_FROM_AI': {
       const aiData = action.payload;
       let newState = { ...state };
       
       if (aiData.place) newState.place = aiData.place;
       if (aiData.tax) newState.tax = aiData.tax;
       if (aiData.tip) newState.tip = aiData.tip;
       
       const existingParticipants = [...newState.participants];
       const newParticipantsFromAI = (aiData.participants || [])
         .filter(p => !existingParticipants.some(ep => ep.name.toLowerCase() === p.name.toLowerCase()));
       
       newParticipantsFromAI.forEach(p => {
           existingParticipants.push({ ...p, id: `p_${Date.now()}_${Math.random()}`});
       });
       newState.participants = existingParticipants;

       const newItems = (aiData.items || []).map(item => {
           let paidBy = 'unassigned';
           const paidByParticipant = newState.participants.find(p => p.name.toLowerCase() === (item.paidBy as unknown as string)?.toLowerCase());
           if (paidByParticipant) paidBy = paidByParticipant.id;

           const splitAmong = (item.splitAmong as unknown as string[])
                .map(name => newState.participants.find(p => p.name.toLowerCase() === name.toLowerCase())?.id)
                .filter((id): id is string => !!id);
           
           return {
               ...item,
               id: `i_${Date.now()}_${Math.random()}`,
               paidBy,
               splitAmong: splitAmong.length > 0 ? splitAmong : newState.participants.map(p => p.id),
           };
       });

       newState.items = [...newState.items, ...newItems];

       return newState;
    }
    default:
      return state;
  }
};

const Header = ({ onReset }: { onReset: () => void }) => (
  <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 no-print">
    <div className="flex items-center gap-2">
      <AppLogo className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold tracking-tight text-primary">BillSplitter</h1>
    </div>
    <p className="hidden md:block text-sm text-muted-foreground italic ml-4">Split the bill, not the friendship.</p>
    <div className="ml-auto">
      <Button variant="ghost" size="icon" onClick={onReset} title="Reset Session">
        <RefreshCw className="h-5 w-5" />
      </Button>
    </div>
  </header>
);

const ParticipantManager = ({ participants, dispatch }: { participants: Participant[], dispatch: React.Dispatch<BillAction> }) => {
  const [newParticipantName, setNewParticipantName] = useState('');

  const handleAddParticipant = () => {
    if (!newParticipantName.trim()) return;

    const names = newParticipantName.split(',').map(name => name.trim()).filter(Boolean);
    names.forEach(name => {
      const newParticipant: Participant = {
        id: `p_${Date.now()}_${Math.random()}`,
        name: name,
      };
      dispatch({ type: 'ADD_PARTICIPANT', payload: newParticipant });
    });
    setNewParticipantName('');
  };
  
  const getInitials = (name:string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users />Group Members</CardTitle>
        <CardDescription>Add people to split the bill with.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            placeholder="Add name(s), comma separated"
            onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
          />
          <Button onClick={handleAddParticipant}><Plus className="mr-2 h-4 w-4"/>Add</Button>
        </div>
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-accent">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(p.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{p.name}</span>
                </div>
              <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'REMOVE_PARTICIPANT', payload: { id: p.id } })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const BillSummaryCard = ({ bill, dispatch }: { bill: Bill, dispatch: React.Dispatch<BillAction> }) => {
  const subtotal = bill.items.reduce((acc, item) => acc + item.amount, 0);
  const total = subtotal + bill.tax + bill.tip;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText />Bill Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
            <Label htmlFor="bill-name">Bill Name</Label>
            <Input id="bill-name" value={bill.name} onChange={(e) => dispatch({ type: 'UPDATE_BILL_DETAILS', payload: { name: e.target.value } })} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="bill-place">Place</Label>
            <Input id="bill-place" value={bill.place || ''} onChange={(e) => dispatch({ type: 'UPDATE_BILL_DETAILS', payload: { place: e.target.value } })} placeholder="e.g., The Grand Cafe"/>
        </div>
        <div className="space-y-2">
            <Label htmlFor="bill-date">Date</Label>
            <Input id="bill-date" type="date" value={bill.date} onChange={(e) => dispatch({ type: 'UPDATE_BILL_DETAILS', payload: { date: e.target.value } })} />
        </div>
        <Separator />
         <div className="space-y-2">
            <Label htmlFor="bill-tax">Tax</Label>
            <Input id="bill-tax" type="number" value={bill.tax} onChange={(e) => dispatch({ type: 'UPDATE_BILL_DETAILS', payload: { tax: parseFloat(e.target.value) || 0 } })} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="bill-tip">Tip</Label>
            <Input id="bill-tip" type="number" value={bill.tip} onChange={(e) => dispatch({ type: 'UPDATE_BILL_DETAILS', payload: { tip: parseFloat(e.target.value) || 0 } })} />
        </div>
        <Separator />
        <div className="space-y-2 font-medium">
            <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Tax:</span> <span>{formatCurrency(bill.tax)}</span></div>
            <div className="flex justify-between"><span>Tip:</span> <span>{formatCurrency(bill.tip)}</span></div>
            <div className="flex justify-between text-lg"><span>Total:</span> <span>{formatCurrency(total)}</span></div>
        </div>
      </CardContent>
    </Card>
  );
};

const AITools = ({ dispatch, participants }: { dispatch: React.Dispatch<BillAction>, participants: Participant[] }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
    const [aiResult, setAiResult] = useState<ScanPhysicalBillOutput | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>, tool: 'scan' | 'upload') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(tool);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const dataUri = reader.result as string;
            const result = tool === 'scan' ? await analyzeBillImage(dataUri) : await analyzeDigitalBill(dataUri);

            if (result.success) {
                setAiResult(result.data);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
            setIsLoading(null);
        };
        reader.onerror = () => {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to read the file.' });
            setIsLoading(null);
        };

        // Reset file input
        if (event.target) event.target.value = '';
    };
    
    const handleNaturalLanguageSubmit = async () => {
        if (!naturalLanguageInput.trim()) return;
        setIsLoading('nlp');
        const result = await processNaturalLanguageItems(naturalLanguageInput, participants);

        if (result.success) {
            // This AI flow already gives us items in the right structure
            const aiBill = {
                items: (result.data.items || []).map(item => {
                    const paidByParticipant = participants.find(p => p.name.toLowerCase() === item.paidBy.toLowerCase());
                    const splitAmongParticipants = item.splitAmong
                        .map(name => participants.find(p => p.name.toLowerCase() === name.toLowerCase()))
                        .filter(Boolean) as Participant[];
                    
                    return {
                        id: `i_${Date.now()}_${Math.random()}`,
                        description: item.description,
                        amount: item.amount,
                        paidBy: paidByParticipant ? paidByParticipant.id : 'unassigned',
                        splitAmong: splitAmongParticipants.length > 0 ? splitAmongParticipants.map(p => p.id) : participants.map(p => p.id)
                    };
                }),
                participants: result.data.items.flatMap(i => [i.paidBy, ...i.splitAmong])
                    .filter((name, index, self) => self.indexOf(name) === index && name !== 'unassigned')
                    .map(name => ({name}))
            };
            dispatch({ type: 'SET_FROM_AI', payload: aiBill as any});
            setNaturalLanguageInput('');
             toast({ title: 'Success', description: `${result.data.items.length} items added.`});
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }

        setIsLoading(null);
    };

    const handleAcceptAiResult = () => {
        if (aiResult) {
            const payload: Partial<Bill> = {
                place: aiResult.placeOfTransaction,
                tax: aiResult.tax,
                tip: aiResult.tip || 0,
                items: aiResult.items.map(item => ({
                    ...item,
                    paidBy: 'unassigned',
                    splitAmong: []
                })) as any,
                date: aiResult.date || undefined
            };
            dispatch({ type: 'SET_FROM_AI', payload });
            setAiResult(null);
            toast({ title: 'Success', description: 'Bill updated with scanned data.'});
        }
    };
    
    const triggerFileScan = () => fileInputRef.current?.click();
    const triggerFileUpload = () => fileInputRef.current?.click();

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI-Powered Entry</CardTitle>
                <CardDescription>Quickly add items using AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, e.currentTarget.id as any)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={() => { fileInputRef.current!.id = 'scan'; triggerFileScan(); }} disabled={!!isLoading} size="lg">
                        {isLoading === 'scan' ? 'Scanning...' : <><Camera className="mr-2"/> Scan Physical Bill</>}
                    </Button>
                    <Button onClick={() => { fileInputRef.current!.id = 'upload'; triggerFileUpload(); }} disabled={!!isLoading} size="lg">
                        {isLoading === 'upload' ? 'Uploading...' : <><Upload className="mr-2"/> Upload Digital Bill</>}
                    </Button>
                </div>
                <div className="space-y-2 pt-4">
                    <Label htmlFor="nlp-input" className="flex items-center gap-2"><Sparkles className="text-primary"/>Add Items with Natural Language</Label>
                    <Textarea 
                        id="nlp-input"
                        placeholder="e.g., Alice paid for Pizza $25 and Coke $5, everyone shared Fries $10"
                        value={naturalLanguageInput}
                        onChange={(e) => setNaturalLanguageInput(e.target.value)}
                        rows={3}
                    />
                    <Button onClick={handleNaturalLanguageSubmit} disabled={!!isLoading || participants.length === 0} className="w-full">
                        {isLoading === 'nlp' ? 'Processing...' : 'Add Items'}
                    </Button>
                    {participants.length === 0 && <p className="text-xs text-muted-foreground text-center">Add participants to use this feature.</p>}
                </div>
            </CardContent>

            <Dialog open={!!aiResult} onOpenChange={() => setAiResult(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="text-accent-foreground"/>Receipt Analyzed!</DialogTitle>
                        <DialogDescription>Review the extracted details. You can edit them later.</DialogDescription>
                    </DialogHeader>
                    {aiResult && (
                        <div className="max-h-96 overflow-y-auto pr-4 text-sm">
                            <p><strong>Place:</strong> {aiResult.placeOfTransaction}</p>
                            <Separator className="my-2"/>
                            <h4 className="font-semibold mb-1">Items:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                {aiResult.items.map((item, i) => (
                                    <li key={i}>{item.description}: {formatCurrency(item.amount)}</li>
                                ))}
                            </ul>
                            <Separator className="my-2"/>
                            <div className="space-y-1 font-medium">
                                <p className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(aiResult.subtotal)}</span></p>
                                <p className="flex justify-between"><span>Tax:</span> <span>{formatCurrency(aiResult.tax)}</span></p>
                                {aiResult.tip && <p className="flex justify-between"><span>Tip:</span> <span>{formatCurrency(aiResult.tip)}</span></p>}
                                <p className="flex justify-between text-base"><span>Total:</span> <span>{formatCurrency(aiResult.total)}</span></p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAiResult(null)}>Wrong items?</Button>
                        <Button onClick={handleAcceptAiResult}>Looks Good, Add to Bill</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

const ItemManager = ({ bill, dispatch }: { bill: Bill, dispatch: React.Dispatch<BillAction> }) => {
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemAmount, setNewItemAmount] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const handleAddItem = () => {
        if (!newItemDesc.trim() || !newItemAmount) return;
        const newItem: Item = {
            id: `i_${Date.now()}_${Math.random()}`,
            description: newItemDesc,
            amount: parseFloat(newItemAmount),
            paidBy: bill.participants[0]?.id || 'unassigned',
            splitAmong: bill.participants.map(p => p.id),
        };
        dispatch({ type: 'ADD_ITEM', payload: newItem });
        setNewItemDesc('');
        setNewItemAmount('');
    };

    const handleUpdateItem = (id: string, updates: Partial<Item>) => {
        dispatch({ type: 'UPDATE_ITEM', payload: { id, updates } });
    }

    const renderItemRow = (item: Item) => {
        const isEditing = editingItemId === item.id;
        return (
            <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center gap-2 p-2 rounded-lg bg-accent/50" onDoubleClick={() => setEditingItemId(item.id)}>
                <div className="grid grid-cols-2 md:flex md:items-center gap-2 flex-1">
                    {isEditing ? (
                        <Input value={item.description} onChange={e => handleUpdateItem(item.id, { description: e.target.value })} className="md:w-48" />
                    ) : (
                        <span className="font-medium md:w-48 truncate" title={item.description}>{item.description}</span>
                    )}
                    {isEditing ? (
                         <Input type="number" value={item.amount} onChange={e => handleUpdateItem(item.id, { amount: parseFloat(e.target.value) || 0 })} className="w-24"/>
                    ) : (
                        <span className="w-24">{formatCurrency(item.amount)}</span>
                    )}
                </div>
                <div className="flex-1 w-full flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full md:w-36 justify-between">
                                <span className="truncate">{bill.participants.find(p => p.id === item.paidBy)?.name || 'Unassigned'}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {bill.participants.map(p => (
                                <DropdownMenuItem key={p.id} onSelect={() => handleUpdateItem(item.id, { paidBy: p.id })}>
                                    {p.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full md:w-36 justify-between">
                                <span className="truncate">{item.splitAmong.length === bill.participants.length ? 'Everyone' : `${item.splitAmong.length} people`}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleUpdateItem(item.id, { splitAmong: bill.participants.map(p => p.id) })}>
                                Everyone
                            </DropdownMenuItem>
                             {bill.participants.map(p => (
                                <DropdownMenuItem key={p.id} onSelect={(e) => { e.preventDefault();
                                  const newSplit = item.splitAmong.includes(p.id) ? item.splitAmong.filter(id => id !== p.id) : [...item.splitAmong, p.id];
                                  handleUpdateItem(item.id, {splitAmong: newSplit.length > 0 ? newSplit : [p.id]});
                                }}>
                                    <Checkbox checked={item.splitAmong.includes(p.id)} className="mr-2"/> {p.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex gap-2 self-end md:self-center">
                  {isEditing && <Button size="icon" variant="ghost" onClick={() => setEditingItemId(null)}><CheckCircle2 className="h-4 w-4"/></Button>}
                  <Button variant="ghost" size="icon" onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            </div>
        )
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Bill Items</CardTitle>
                <CardDescription>Add or edit items on the bill. Double-click an item to edit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex flex-col md:flex-row gap-2">
                    <Input placeholder="Item Description" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} />
                    <Input type="number" placeholder="Amount" value={newItemAmount} onChange={(e) => setNewItemAmount(e.target.value)} className="md:w-32" />
                    <Button onClick={handleAddItem} disabled={bill.participants.length === 0} className="w-full md:w-auto">Add Item</Button>
                </div>
                 {bill.participants.length === 0 && <p className="text-xs text-muted-foreground text-center">Add participants before adding items.</p>}
                <div className="space-y-2">
                    {bill.items.map(renderItemRow)}
                </div>
            </CardContent>
        </Card>
    );
};

const SplitSummary = ({ bill }: { bill: Bill }) => {
    const { toast } = useToast();

    const calculation = useMemo(() => {
        const participantBalances: { [key: string]: number } = {};
        bill.participants.forEach(p => participantBalances[p.id] = 0);
        
        // Item-wise split
        bill.items.forEach(item => {
            const share = item.amount / item.splitAmong.length;
            if(item.paidBy !== 'unassigned') participantBalances[item.paidBy] += item.amount;
            item.splitAmong.forEach(pid => participantBalances[pid] -= share);
        });

        const subtotal = bill.items.reduce((acc, item) => acc + item.amount, 0);
        
        // Tax and Tip split
        if (subtotal > 0) {
            bill.participants.forEach(p => {
                let p_subtotal = 0;
                bill.items.forEach(item => {
                    if (item.splitAmong.includes(p.id)) {
                        p_subtotal += item.amount / item.splitAmong.length;
                    }
                });
                const proportion = p_subtotal / subtotal;
                participantBalances[p.id] -= (bill.tax + bill.tip) * proportion;
            });
        }
        
        const balances = bill.participants.map(p => ({
            ...p,
            balance: participantBalances[p.id]
        }));
        
        const debtors = balances.filter(p => p.balance < 0).sort((a,b) => a.balance - b.balance);
        const creditors = balances.filter(p => p.balance > 0).sort((a,b) => b.balance - a.balance);

        const transactions: {from: string, to: string, amount: number}[] = [];

        let i = 0, j = 0;
        while(i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            const amountToTransfer = Math.min(-debtor.balance, creditor.balance);

            transactions.push({
                from: debtor.name,
                to: creditor.name,
                amount: amountToTransfer,
            });
            
            debtor.balance += amountToTransfer;
            creditor.balance -= amountToTransfer;

            if (Math.abs(debtor.balance) < 0.01) i++;
            if (Math.abs(creditor.balance) < 0.01) j++;
        }

        return { participantTotals: balances, transactions };
    }, [bill]);

    const getParticipantTotal = (participantId: string) => {
        const subtotal = bill.items.reduce((acc, item) => {
            if (item.splitAmong.includes(participantId)) {
                return acc + item.amount / item.splitAmong.length;
            }
            return acc;
        }, 0);
        
        const totalSubtotal = bill.items.reduce((acc, item) => acc + item.amount, 0);
        const proportion = totalSubtotal > 0 ? subtotal / totalSubtotal : (1 / bill.participants.length);
        const taxShare = bill.tax * proportion;
        const tipShare = bill.tip * proportion;
        const total = subtotal + taxShare + tipShare;

        return { subtotal, taxShare, tipShare, total };
    };

    const handlePrint = () => window.print();

    const handleShare = (p: Participant, via: 'whatsapp' | 'sms') => {
        const pTotal = getParticipantTotal(p.id);
        let message = `Hi ${p.name}, here's your bill summary for "${bill.name}":\n\n`;
        message += `Subtotal: ${formatCurrency(pTotal.subtotal)}\n`;
        message += `Your share of Tax: ${formatCurrency(pTotal.taxShare)}\n`;
        message += `Your share of Tip: ${formatCurrency(pTotal.tipShare)}\n`;
        message += `-------------------\n`;
        message += `TOTAL: ${formatCurrency(pTotal.total)}\n\n`;
        
        const pBalance = calculation.transactions.filter(t => t.from === p.name);
        if (pBalance.length > 0) {
            message += `You need to pay:\n`;
            pBalance.forEach(t => {
                message += `- ${formatCurrency(t.amount)} to ${t.to}\n`;
            });
        } else {
            message += `You are all settled up, or others owe you!\n`;
        }
        
        const encodedMessage = encodeURIComponent(message);
        const url = via === 'whatsapp' 
            ? `https://api.whatsapp.com/send?text=${encodedMessage}`
            : `sms:?&body=${encodedMessage}`;
        
        window.open(url, '_blank');
        toast({title: "Sharing...", description: "Your messaging app should open."});
    };
    
    if (bill.participants.length === 0) return <Card><CardHeader><CardTitle>Split Summary</CardTitle></CardHeader><CardContent><p>Add participants and items to see the split.</p></CardContent></Card>

    return (
        <div className="space-y-6">
            <Card className="printable-area" id="print-summary">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                        <CardTitle className="text-2xl">{bill.name} - Summary</CardTitle>
                        <CardDescription>{new Date(bill.date).toLocaleDateString()} at {bill.place || 'Unknown Place'}</CardDescription>
                        </div>
                        <Button onClick={handlePrint} variant="outline" className="no-print"><FileDown className="mr-2 h-4 w-4"/>Export PDF</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {bill.participants.map(p => {
                           const pTotal = getParticipantTotal(p.id);
                           return (
                               <Card key={p.id} className="relative">
                                   <CardHeader>
                                       <CardTitle>{p.name}</CardTitle>
                                   </CardHeader>
                                   <CardContent className="space-y-1 text-sm">
                                       <p className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(pTotal.subtotal)}</span></p>
                                       <p className="flex justify-between"><span>Tax</span><span>{formatCurrency(pTotal.taxShare)}</span></p>
                                       <p className="flex justify-between"><span>Tip</span><span>{formatCurrency(pTotal.tipShare)}</span></p>
                                       <Separator className="my-2"/>
                                       <p className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(pTotal.total)}</span></p>
                                   </CardContent>
                                   <CardFooter className="flex gap-2">
                                       <Button size="sm" variant="outline" className="w-full" onClick={() => handleShare(p, 'whatsapp')}><WhatsappIcon className="mr-2 h-4 w-4"/>WhatsApp</Button>
                                       <Button size="sm" variant="outline" className="w-full" onClick={() => handleShare(p, 'sms')}><SmsIcon className="mr-2 h-4 w-4"/>SMS</Button>
                                   </CardFooter>
                               </Card>
                           )
                       })}
                   </div>
                   
                   <Card>
                       <CardHeader>
                           <CardTitle>Who Owes Whom</CardTitle>
                       </CardHeader>
                       <CardContent>
                           {calculation.transactions.length > 0 ? (
                               <ul className="space-y-2">
                                   {calculation.transactions.map((t, i) => (
                                       <li key={i} className="flex items-center gap-2 p-2 rounded-md bg-accent">
                                           <span className="font-bold">{t.from}</span>
                                           <span>&rarr;</span>
                                           <span className="font-bold">{t.to}:</span>
                                           <span className="font-mono ml-auto">{formatCurrency(t.amount)}</span>
                                       </li>
                                   ))}
                               </ul>
                           ) : (
                               <p>Everyone is settled up!</p>
                           )}
                       </CardContent>
                   </Card>
                </CardContent>
            </Card>
        </div>
    );
};


export default function BillSplitterPage() {
  const [bill, dispatch] = useReducer(billReducer, initialState);
  const { toast } = useToast();
  
  const handleReset = useCallback(() => {
    if(window.confirm("Are you sure you want to reset everything?")){
        dispatch({ type: 'RESET_BILL' });
        toast({title: "Session Reset", description: "You can start a new bill now."})
    }
  }, [toast]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header onReset={handleReset} />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <ParticipantManager participants={bill.participants} dispatch={dispatch} />
            <BillSummaryCard bill={bill} dispatch={dispatch} />
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="assign">
              <TabsList className="grid w-full grid-cols-3 no-print">
                <TabsTrigger value="scan">AI Tools</TabsTrigger>
                <TabsTrigger value="assign">Assign Items</TabsTrigger>
                <TabsTrigger value="split">Split Summary</TabsTrigger>
              </TabsList>
              <TabsContent value="scan">
                  <AITools dispatch={dispatch} participants={bill.participants} />
              </TabsContent>
              <TabsContent value="assign">
                <ItemManager bill={bill} dispatch={dispatch} />
              </TabsContent>
              <TabsContent value="split">
                <SplitSummary bill={bill} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
