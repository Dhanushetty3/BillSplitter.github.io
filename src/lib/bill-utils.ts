
export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export type SplitMode = 'item-wise' | 'equal' | 'percentage';

export interface SplitResult {
  [friend: string]: {
    total: number;
    items: { name: string; amount: number }[];
  };
}

// This is a mock implementation based on its usage in page.tsx
export function calculateSplits(
    items: BillItem[],
    friends: string[],
    assignments: Record<string, string[]>,
    tax: number,
    tip: number,
    subtotal: number,
    splitMode: SplitMode,
    percentages: Record<string, number>
): SplitResult {
    const splits: SplitResult = {};
    if (friends.length === 0) return splits;

    friends.forEach(friend => {
        splits[friend] = { total: 0, items: [] };
    });

    const total = subtotal + tax + tip;

    if (splitMode === 'equal') {
        const amountPerPerson = total / friends.length;
        friends.forEach(friend => {
            splits[friend].total = amountPerPerson;
        });
        return splits;
    }

    if (splitMode === 'percentage') {
        friends.forEach(friend => {
            const percentage = percentages[friend] || 0;
            splits[friend].total = total * (percentage / 100);
        });
        return splits;
    }

    // item-wise
    const friendTotals: Record<string, number> = {};
    friends.forEach(f => friendTotals[f] = 0);

    items.forEach(item => {
        const assignedTo = assignments[item.id] || [];
        if (assignedTo.length > 0) {
            const amountPerPerson = item.lineTotal / assignedTo.length;
            assignedTo.forEach(friend => {
                friendTotals[friend] += amountPerPerson;
                splits[friend].items.push({ name: item.name, amount: amountPerPerson });
            });
        }
    });

    const calculatedSubtotal = Object.values(friendTotals).reduce((a, b) => a + b, 0);

    if (calculatedSubtotal > 0) {
      const taxAndTipProportion = (tax + tip) / calculatedSubtotal;
      friends.forEach(friend => {
          const individualSubtotal = friendTotals[friend];
          const individualTaxAndTip = individualSubtotal * taxAndTipProportion;
          splits[friend].total = individualSubtotal + individualTaxAndTip;
      });
    }

    return splits;
}
