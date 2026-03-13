import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface TripTransaction {
    id: string;
    type: 'income' | 'expense';
    amount_cents: number;
    currency: string;
    lkr_value_cents: number;
    category: string;
    paid_by: 'out_of_pocket' | 'agency_advance';
    createdAt: any;
}

export interface TripSettlementSummary {
    tripId: string;
    agencyAdvanceLKR: number;
    totalExpensesLKR: number;
    outOfPocketLKR: number;
    balanceDueLKR: number; // Positive means driver owes agency, negative means agency owes driver
    transactions: TripTransaction[];
    loading: boolean;
    error: string | null;
}

export const useTripSettlement = (tripId: string | null) => {
    const { currentUser } = useAuth();
    const [settlement, setSettlement] = useState<TripSettlementSummary>({
        tripId: tripId || '',
        agencyAdvanceLKR: 0,
        totalExpensesLKR: 0,
        outOfPocketLKR: 0,
        balanceDueLKR: 0,
        transactions: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!currentUser || !tripId) {
            setSettlement(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchSettlementData = async () => {
            try {
                setSettlement(prev => ({ ...prev, loading: true, error: null }));

                // 1. Fetch Trip details (for Advance/Revenue)
                const tripRef = doc(db, `users/${currentUser.uid}/trips/${tripId}`);
                const tripSnap = await getDoc(tripRef);

                let advance = 0;
                if (tripSnap.exists()) {
                    // Assuming we store initial advance explicitly, or we calculate it from income transactions
                    advance = tripSnap.data().agency_advance_lkr_cents || 0;
                }

                // 2. Fetch all Trip Transactions
                const txnsRef = collection(db, `users/${currentUser.uid}/trips/${tripId}/transactions`);
                const q = query(txnsRef); // We get all of them and aggregate in memory for the PDF
                const txnsSnap = await getDocs(q);

                const transactions: TripTransaction[] = [];
                let totalExp = 0;
                let outOfPocket = 0;
                let calculatedAdvance = advance;

                txnsSnap.forEach(doc => {
                    const data = doc.data() as Omit<TripTransaction, 'id'>;
                    transactions.push({ id: doc.id, ...data });

                    if (data.type === 'expense') {
                        totalExp += data.lkr_value_cents;
                        if (data.paid_by === 'out_of_pocket') {
                            outOfPocket += data.lkr_value_cents;
                        }
                    } else if (data.type === 'income' && data.category === 'Agency Advance') {
                        // Fallback: If advance is logged as an income transaction
                        calculatedAdvance += data.lkr_value_cents;
                    }
                });

                // Driver Balance Logic:
                // Advance - (Total Expenses - OutOfPocket) 
                // Or simpler: What did the driver receive (Advance) vs What did they spend ON BEHALF OF the agency (TotalExp - OutOfPocket assuming OutOfPocket doesn't count against advance? No, OutOfPocket means they used their own money).
                // Standard model: Balance = AdvanceReceived - TotalReimbursableExpenses
                const reimbursableExpenses = totalExp; // For simplicity, all logged expenses are considered for the settlement
                const balance = calculatedAdvance - reimbursableExpenses;

                setSettlement({
                    tripId,
                    agencyAdvanceLKR: calculatedAdvance,
                    totalExpensesLKR: totalExp,
                    outOfPocketLKR: outOfPocket,
                    balanceDueLKR: balance,
                    transactions: transactions.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()), // Descending
                    loading: false,
                    error: null,
                });

            } catch (err: any) {
                console.error("Error fetching trip settlement:", err);
                setSettlement(prev => ({ ...prev, loading: false, error: err.message }));
            }
        };

        fetchSettlementData();
    }, [currentUser, tripId]);

    return settlement;
};
