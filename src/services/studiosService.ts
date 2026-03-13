import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type StudioEventStatus = 'lead' | 'booked' | 'shot' | 'editing' | 'delivered' | 'archived';
export type StudioMilestoneStatus = 'unpaid' | 'paid';
export type StudioExpenseCategory = 'freelancer' | 'printing' | 'gear_rent' | 'travel' | 'album' | 'assistant' | 'other';
export type StudioAssetCategory = 'camera_gear' | 'drone' | 'computer' | 'lighting' | 'lens' | 'audio' | 'other';
export type StudioAiDraftType = 'contract' | 'voice' | 'diplomat';

export interface StudioEvent {
    id?: string;
    clientName: string;
    eventDate: string;
    startTime?: string;
    location: string;
    packageName: string;
    totalValue: number;
    status: StudioEventStatus;
    shootType?: string;
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface StudioMilestone {
    id?: string;
    eventId: string;
    eventName: string;
    clientName: string;
    title: string;
    amount: number;
    dueDate: string;
    status: StudioMilestoneStatus;
    paymentLink?: string;
    notes?: string;
    paidDate?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface StudioExpense {
    id?: string;
    eventId: string;
    eventName: string;
    payeeName: string;
    amount: number;
    category: StudioExpenseCategory;
    date: string;
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface StudioAsset {
    id?: string;
    itemName: string;
    purchaseDate: string;
    purchasePrice: number;
    category: StudioAssetCategory;
    receiptImageUrl?: string;
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface StudioAiDraft {
    id?: string;
    type: StudioAiDraftType;
    title: string;
    prompt: string;
    result: string;
    relatedEventId?: string;
    relatedEventName?: string;
    tokenCost: number;
    createdAt?: any;
    updatedAt?: any;
}

function userCollection(uid: string, collectionName: string) {
    return collection(db, 'users', uid, collectionName);
}

function userDoc(uid: string, collectionName: string, docId: string) {
    return doc(db, 'users', uid, collectionName, docId);
}

export function subscribeStudioEvents(uid: string, callback: (events: StudioEvent[]) => void): () => void {
    const q = query(userCollection(uid, 'studio_events'), orderBy('eventDate', 'asc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
        })) as StudioEvent[]);
    }, (error) => {
        console.error('Studio events subscription error:', error);
        callback([]);
    });
}

export async function addStudioEvent(uid: string, event: Omit<StudioEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(userCollection(uid, 'studio_events'), {
        ...event,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateStudioEvent(uid: string, eventId: string, updates: Partial<StudioEvent>): Promise<void> {
    await updateDoc(userDoc(uid, 'studio_events', eventId), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export function subscribeStudioMilestones(uid: string, callback: (milestones: StudioMilestone[]) => void): () => void {
    const q = query(userCollection(uid, 'studio_milestones'), orderBy('dueDate', 'asc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
        })) as StudioMilestone[]);
    }, (error) => {
        console.error('Studio milestones subscription error:', error);
        callback([]);
    });
}

export async function addStudioMilestone(uid: string, milestone: Omit<StudioMilestone, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(userCollection(uid, 'studio_milestones'), {
        ...milestone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateStudioMilestone(uid: string, milestoneId: string, updates: Partial<StudioMilestone>): Promise<void> {
    await updateDoc(userDoc(uid, 'studio_milestones', milestoneId), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export function subscribeStudioExpenses(uid: string, callback: (expenses: StudioExpense[]) => void): () => void {
    const q = query(userCollection(uid, 'studio_expenses'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
        })) as StudioExpense[]);
    }, (error) => {
        console.error('Studio expenses subscription error:', error);
        callback([]);
    });
}

export async function addStudioExpense(uid: string, expense: Omit<StudioExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(userCollection(uid, 'studio_expenses'), {
        ...expense,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export function subscribeStudioAssets(uid: string, callback: (assets: StudioAsset[]) => void): () => void {
    const q = query(userCollection(uid, 'studio_assets'), orderBy('purchaseDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
        })) as StudioAsset[]);
    }, (error) => {
        console.error('Studio assets subscription error:', error);
        callback([]);
    });
}

export async function addStudioAsset(uid: string, asset: Omit<StudioAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(userCollection(uid, 'studio_assets'), {
        ...asset,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export function subscribeStudioAiDrafts(uid: string, callback: (drafts: StudioAiDraft[]) => void): () => void {
    const q = query(userCollection(uid, 'studio_ai_drafts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((entry) => ({
            id: entry.id,
            ...entry.data(),
        })) as StudioAiDraft[]);
    }, (error) => {
        console.error('Studio AI drafts subscription error:', error);
        callback([]);
    });
}

export async function addStudioAiDraft(uid: string, draft: Omit<StudioAiDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(userCollection(uid, 'studio_ai_drafts'), {
        ...draft,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}
