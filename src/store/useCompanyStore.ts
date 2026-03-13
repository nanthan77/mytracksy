import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'owner' | 'manager' | 'cashier';

export interface Company {
    id: string;
    name: string;
    industry: string;
    registrationNumber?: string;
    vatNumber?: string;
    address?: string;
    currency: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

interface CompanyState {
    companies: Company[];
    activeCompanyId: string | null;
    userRole: UserRole;

    // Actions
    setCompanies: (companies: Company[]) => void;
    addCompany: (company: Company) => void;
    updateCompany: (id: string, updates: Partial<Company>) => void;
    setActiveCompany: (id: string) => void;
    setUserRole: (role: UserRole) => void;

    // Getters
    getActiveCompany: () => Company | undefined;
}

export const useCompanyStore = create<CompanyState>()(
    persist(
        (set, get) => ({
            companies: [],
            activeCompanyId: null,
            userRole: 'owner', // Default, should be synced from Firestore

            setCompanies: (companies) => set({ companies }),

            addCompany: (company) => set((state) => ({
                companies: [...state.companies, company],
                // If it's the first company, set it as active
                activeCompanyId: state.companies.length === 0 ? company.id : state.activeCompanyId
            })),

            updateCompany: (id, updates) => set((state) => ({
                companies: state.companies.map(c =>
                    c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
                )
            })),

            setActiveCompany: (id) => set({ activeCompanyId: id }),

            setUserRole: (role) => set({ userRole: role }),

            getActiveCompany: () => {
                const state = get();
                return state.companies.find(c => c.id === state.activeCompanyId);
            }
        }),
        {
            name: 'biztracksy-company-storage',
            partialize: (state) => ({
                activeCompanyId: state.activeCompanyId,
            }),
        }
    )
);
