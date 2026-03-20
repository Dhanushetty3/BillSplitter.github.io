export type Participant = {
  id: string;
  name: string;
};

export type Item = {
  id:string;
  description: string;
  amount: number;
  paidBy: string; // participant.id
  splitAmong: string[]; // array of participant.id
};

export type SplitMethod = 'item-wise' | 'equally';

export type Bill = {
  name: string;
  date: string;
  place?: string;
  participants: Participant[];
  items: Item[];
  tax: number;
  tip: number;
  splitMethod: SplitMethod;
};
