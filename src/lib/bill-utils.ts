
export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export type SplitMode = 'item-wise' | 'equal' | 'percentage';

export interface SplitResult {
  friend: string;
  total: number;
  items: { name: string; cost: number }[];
  subtotal: number;
  taxShare: number;
  tipShare: number;
}

export function calculateSplits(
    items: BillItem[],
    friends: string[],
    assignments: Record<string, string[]>,
    tax: number,
    tip: number,
    subtotal: number,
    splitMode: SplitMode,
    percentages: Record<string, number>
): SplitResult[] {
    const splits: SplitResult[] = [];
    if (friends.length === 0) return splits;

    const billTotal = subtotal + tax + tip;

    if (splitMode === 'equal') {
        const amountPerPerson = billTotal > 0 && friends.length > 0 ? billTotal / friends.length : 0;
        const subtotalPerPerson = subtotal > 0 && friends.length > 0 ? subtotal / friends.length : 0;
        const taxPerPerson = tax > 0 && friends.length > 0 ? tax / friends.length : 0;
        const tipPerPerson = tip > 0 && friends.length > 0 ? tip / friends.length : 0;

        friends.forEach(friend => {
            splits.push({
                friend: friend,
                total: amountPerPerson,
                items: items.map(item => ({
                    name: item.name,
                    cost: item.lineTotal / friends.length
                })),
                subtotal: subtotalPerPerson,
                taxShare: taxPerPerson,
                tipShare: tipPerPerson,
            });
        });
        return splits;
    }

    if (splitMode === 'percentage') {
        friends.forEach(friend => {
            const percentage = percentages[friend] || 0;
            const personTotal = billTotal * (percentage / 100);
            const personSubtotal = subtotal * (percentage / 100);
            const personTax = tax * (percentage / 100);
            const personTip = tip * (percentage / 100);

            splits.push({
                friend: friend,
                total: personTotal,
                items: [], // For percentage split, individual items are not assigned.
                subtotal: personSubtotal,
                taxShare: personTax,
                tipShare: personTip,
            });
        });
        return splits;
    }

    // item-wise
    const friendSubtotals: Record<string, number> = {};
    const friendItems: Record<string, {name: string, cost: number}[]> = {};
    friends.forEach(f => {
        friendSubtotals[f] = 0;
        friendItems[f] = [];
    });

    items.forEach(item => {
        const assignedTo = assignments[item.id] || [];
        if (assignedTo.length > 0) {
            const costPerPerson = item.lineTotal / assignedTo.length;
            assignedTo.forEach(friend => {
                friendSubtotals[friend] += costPerPerson;
                friendItems[friend].push({ name: item.name, cost: costPerPerson });
            });
        }
    });

    const calculatedBillSubtotal = Object.values(friendSubtotals).reduce((a, b) => a + b, 0);

    friends.forEach(friend => {
        const personSubtotal = friendSubtotals[friend];
        let personTaxShare = 0;
        let personTipShare = 0;
        
        if (calculatedBillSubtotal > 0) {
            const proportion = personSubtotal / calculatedBillSubtotal;
            personTaxShare = tax * proportion;
            personTipShare = tip * proportion;
        } else if (subtotal > 0 && friends.length > 0) {
             personTaxShare = tax / friends.length;
             personTipShare = tip / friends.length;
        }

        splits.push({
            friend: friend,
            total: personSubtotal + personTaxShare + personTipShare,
            items: friendItems[friend],
            subtotal: personSubtotal,
            taxShare: personTaxShare,
            tipShare: personTipShare,
        });
    });

    return splits;
}
