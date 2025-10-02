import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Dossier, User, DossierStatus, TaxDetail, PaymentMethod, ResourceOrder, Personnel, ResourceType, ResourceOrderStatus } from '../types';
import { getDossiers, createDossier as apiCreateDossier, updateDossier as apiUpdateDossier, deleteDossier as apiDeleteDossier, createResourceOrder as apiCreateResourceOrder, getResourceOrders as apiGetResourceOrders, updateResourceOrder as apiUpdateResourceOrder, getPersonnel, createPersonnel, updatePersonnel as apiUpdatePersonnel, deletePersonnel as apiDeletePersonnel } from '../src/services/api';

interface AppState {
  dossiers: Dossier[];
  currentUser: User | null;
  token: string | null;
  dossiersLoading: boolean;
  dossiersError: string | null;
  resourceOrders: ResourceOrder[];
  resourceOrdersLoading: boolean;
  resourceOrdersError: string | null;
  unreadResourceOrdersCount: number;
  personnel: Personnel[];
  personnelLoading: boolean;
  personnelError: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  fetchDossiers: (params?: { limit?: number; offset?: number }, append?: boolean) => Promise<{ fetched: number; total: number } | void>;
  createDossier: (dossierData: Omit<Dossier, 'id' | 'createdAt' | 'createdBy' | 'totalAmount'>) => Promise<void>;
  updateDossierTaxAmounts: (dossierId: string, taxDetails: TaxDetail[]) => Promise<void>;
  confirmPayment: (dossierId: string, paymentDetails: { method: PaymentMethod; bankName?: string; chequeNumber?: string; bankTransferRef?: string }) => Promise<void>;
  cancelDossier: (dossierId: string, reason: string) => Promise<void>;
  deleteDossier: (dossierId: string) => Promise<void>;
  fetchResourceOrders: (params?: { limit?: number; offset?: number }, append?: boolean) => Promise<{ fetched: number; total: number } | void>;
  createResourceOrder: (orderData: { resourceType: ResourceType; quantity: number; unit: string; targetDivision: Role; description?: string; notes?: string }) => Promise<void>;
  deliverResourceOrder: (id: string, notes?: string) => Promise<void>;
  confirmResourceOrderReceipt: (id: string, notes?: string) => Promise<void>;
  markAllResourceOrdersAsRead: () => Promise<void>;
  fetchPersonnel: () => Promise<void>;
  addPersonnel: (personnelData: Omit<Personnel, 'id'>) => Promise<void>;
  updatePersonnel: (personnelId: string, personnelData: Omit<Personnel, 'id'>) => Promise<void>;
  deletePersonnel: (personnelId: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dossiers, setDossiers] = useState<Dossier[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const localUser = localStorage.getItem('user');
            return localUser ? JSON.parse(localUser) : null;
        } catch (error) {
            console.error("Error loading user from localStorage", error);
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [dossiersLoading, setDossiersLoading] = useState<boolean>(false);
    const [dossiersError, setDossiersError] = useState<string | null>(null);
    const [resourceOrders, setResourceOrders] = useState<ResourceOrder[]>([]);
    const [resourceOrdersLoading, setResourceOrdersLoading] = useState<boolean>(false);
    const [resourceOrdersError, setResourceOrdersError] = useState<string | null>(null);
    const [unreadResourceOrdersCount, setUnreadResourceOrdersCount] = useState<number>(0);
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [personnelLoading, setPersonnelLoading] = useState<boolean>(false);
    const [personnelError, setPersonnelError] = useState<string | null>(null);


    useEffect(() => {
        const undeliveredCount = resourceOrders.filter(order => 
            order.status === ResourceOrderStatus.EN_ATTENTE || 
            order.status === ResourceOrderStatus.LIVRE
        ).length;
        setUnreadResourceOrdersCount(undeliveredCount);
    }, [resourceOrders]);

    const fetchDossiers = useCallback(async (params?: { limit?: number; offset?: number }, append: boolean = false) => {
        if (!token) return;
        setDossiersLoading(true);
        setDossiersError(null);
        try {
            const response = await getDossiers(params);
            const items = Array.isArray(response.data) ? response.data : response.data.items;
            const total = Array.isArray(response.data) ? items.length : response.data.total;
            setDossiers(prev => append ? [...prev, ...items] : items);
            return { fetched: items.length, total };
        } catch (error: any) {
            console.error("Erreur lors de la récupération des dossiers:", error);
            setDossiersError(error.response?.data?.message || 'Échec de la récupération des dossiers.');
        } finally {
            setDossiersLoading(false);
        }
    }, [token]);

    const fetchPersonnel = useCallback(async () => {
        if (!token) return;
        setPersonnelLoading(true);
        setPersonnelError(null);
        try {
            const response = await getPersonnel();
            const personnelWithHistory = response.data.map(p => ({
                ...p,
                history: p.history || [],
            }));
            setPersonnel(personnelWithHistory);
        } catch (error: any) {
            console.error('Error fetching personnel:', error);
            setPersonnelError(error.response?.data?.message || 'Échec de la récupération du personnel.');
        } finally {
            setPersonnelLoading(false);
        }
    }, [token]);

    const fetchResourceOrders = useCallback(async (params?: { limit?: number; offset?: number }, append: boolean = false) => {
        if (!token) return;
        setResourceOrdersLoading(true);
        setResourceOrdersError(null);
        try {
            const response = await apiGetResourceOrders(params);
            const items = Array.isArray(response.data) ? response.data : response.data.items;
            const total = Array.isArray(response.data) ? items.length : response.data.total;
            setResourceOrders(prev => append ? [...prev, ...items] : items);
            return { fetched: items.length, total };
        } catch (error: any) {
            console.error('Erreur lors de la récupération des commandes de ressources:', error);
            setResourceOrdersError(error.response?.data?.message || 'Échec de la récupération des commandes de ressources.');
        } finally {
            setResourceOrdersLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token && currentUser) {
            fetchDossiers();
            fetchResourceOrders();
            // Charger le personnel pour le Chef de Division
            if (currentUser.role === 'Chef de Division') {
                fetchPersonnel();
            }
        } else {
            setDossiers([]);
            setResourceOrders([]);
            setPersonnel([]);
        }
    }, [token, currentUser, fetchDossiers, fetchPersonnel, fetchResourceOrders]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('user', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('user');
        }
    }, [currentUser]);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const setUser = (user: User | null) => setCurrentUser(user);
    const handleSetToken = (newToken: string | null) => setToken(newToken);

    const logout = () => {
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const createDossier = async (dossierData: Omit<Dossier, 'id' | 'createdAt' | 'createdBy' | 'totalAmount'>) => {
        if (!currentUser) throw new Error("User not authenticated");
        setDossiersLoading(true);
        try {
            const response = await apiCreateDossier(dossierData);
            setDossiers(prev => [response.data, ...prev]);
        } catch (error: any) {
            setDossiersError(error.response?.data?.message || 'Échec de la création du dossier.');
            throw error;
        } finally {
            setDossiersLoading(false);
        }
    };

    const updateDossierTaxAmounts = async (dossierId: string, taxDetails: TaxDetail[]) => {
        console.log("--- updateDossierTaxAmounts call ---");
        console.log("dossierId:", dossierId);
        console.log("taxDetails received:", taxDetails);
        const totalAmount = taxDetails.reduce((sum, tax) => sum + (tax.amount || 0), 0);
        const updatedFields = { taxDetails, totalAmount, status: DossierStatus.EN_ATTENTE_DE_PAIEMENT };
        console.log("updatedFields sent to API:", updatedFields);
        try {
            const response = await apiUpdateDossier(dossierId, updatedFields);
            setDossiers(prev => prev.map(d => (d.id === dossierId ? response.data : d)));
        } catch (error: any) {
            console.error("Erreur lors de la mise à jour des montants fiscaux:", error);
            setDossiersError(error.response?.data?.message || 'Échec de la mise à jour.');
            throw error;
        }
    };

    const confirmPayment = async (dossierId: string, paymentDetails: { method: PaymentMethod; bankName?: string; chequeNumber?: string; bankTransferRef?: string }) => {
        if (!currentUser) throw new Error("User not authenticated");
        console.log("--- confirmPayment call ---");
        console.log("dossierId:", dossierId);
        console.log("paymentDetails received:", paymentDetails);
        const updatedFields = {
            status: DossierStatus.PAYE,
            paymentMethod: paymentDetails.method,
            paymentDetails: {
                processedBy: currentUser.id,
                processedAt: new Date().toISOString(),
                chequeNumber: paymentDetails.chequeNumber,
                bankTransferRef: paymentDetails.bankTransferRef,
            },
        };
        console.log("updatedFields sent to API (confirmPayment):", updatedFields);
        try {
            const response = await apiUpdateDossier(dossierId, updatedFields);
            setDossiers(prev => prev.map(d => (d.id === dossierId ? response.data : d)));
        } catch (error: any) {
            console.error("Erreur lors de la confirmation du paiement:", error);
            setDossiersError(error.response?.data?.message || 'Échec de la confirmation.');
            throw error;
        }
    };

    const cancelDossier = async (dossierId: string, reason: string) => {
        if (!currentUser) throw new Error("User not authenticated");
        console.log("--- cancelDossier call ---");
        console.log("dossierId:", dossierId);
        console.log("reason received:", reason);
        const updatedFields = {
            status: DossierStatus.ANNULE,
            reason,
            cancelledBy: currentUser.id,
            cancelledAt: new Date().toISOString(),
        };
        console.log("updatedFields sent to API (cancelDossier):", updatedFields);
        try {
            const response = await apiUpdateDossier(dossierId, updatedFields);
            setDossiers(prev => prev.map(d => (d.id === dossierId ? response.data : d)));
        } catch (error: any) {
            console.error("Erreur lors de l'annulation du dossier:", error);
            setDossiersError(error.response?.data?.message || 'Échec de l\'annulation.');
            throw error;
        }
    };

    const deleteDossier = async (dossierId: string) => {
        try {
            await apiDeleteDossier(dossierId);
            setDossiers(prev => prev.filter(d => d.id !== dossierId));
        } catch (error: any) {
            setDossiersError(error.response?.data?.message || 'Échec de la suppression.');
            throw error;
        }
    };


    const createResourceOrder = async (orderData: { resourceType: ResourceType; quantity: number; unit: string; targetDivision: Role; description?: string; notes?: string }) => {
        if (!currentUser) throw new Error('User not authenticated');
        try {
            const response = await apiCreateResourceOrder(orderData);
            setResourceOrders(prev => [response.data, ...prev]);
        } catch (error: any) {
            setResourceOrdersError(error.response?.data?.message || 'Échec de la création de la commande.');
            throw error;
        }
    };

    const deliverResourceOrder = async (id: string, notes?: string) => {
        if (!currentUser) throw new Error('User not authenticated');
        try {
            const response = await apiUpdateResourceOrder(id, { 
                status: ResourceOrderStatus.LIVRE, 
                deliveredBy: currentUser.id,
                deliveredAt: new Date().toISOString(),
                notes 
            });
            setResourceOrders(prev => prev.map(order => (order.id === id ? response.data : order)));
        } catch (error: any) {
            setResourceOrdersError(error.response?.data?.message || 'Échec de la livraison.');
            throw error;
        }
    };

    const confirmResourceOrderReceipt = async (id: string, notes?: string) => {
        if (!currentUser) throw new Error('User not authenticated');
        try {
            const response = await apiUpdateResourceOrder(id, { 
                status: ResourceOrderStatus.RECU, 
                receivedBy: currentUser.id,
                receivedAt: new Date().toISOString(),
                notes 
            });
            setResourceOrders(prev => prev.map(order => (order.id === id ? response.data : order)));
        } catch (error: any) {
            setResourceOrdersError(error.response?.data?.message || 'Échec de la confirmation de réception.');
            throw error;
        }
    };

    const markAllResourceOrdersAsRead = async () => {
        const unreceivedOrders = resourceOrders.filter(order => 
            order.status !== ResourceOrderStatus.RECU && 
            (order.targetDivision === currentUser?.role || currentUser?.role === 'Accueil')
        );
        for (const order of unreceivedOrders) {
            try {
                if (order.status === ResourceOrderStatus.LIVRE && currentUser?.role !== 'Accueil') {
                    await confirmResourceOrderReceipt(order.id);
                }
            } catch (error) {
                console.error(`Failed to confirm resource order ${order.id}`, error);
            }
        }
    };


    const addPersonnel = async (personnelData: Omit<Personnel, 'id'>) => {
        if (!currentUser) throw new Error("User not authenticated");
        setPersonnelLoading(true);
        console.log("--- Création du personnel (envoi) ---", personnelData);
        try {
            const response = await createPersonnel(personnelData);
            console.log("--- Création du personnel (réponse) ---", response.data);
            const newPersonnel = { ...personnelData, id: response.data.id } as Personnel;
            setPersonnel(prev => [...prev, newPersonnel]);
        } catch (error: any) {
            setPersonnelError(error.response?.data?.message || 'Échec de l\'ajout du personnel.');
            throw error;
        } finally {
            setPersonnelLoading(false);
        }
    };

    const updatePersonnel = async (personnelId: string, personnelData: Omit<Personnel, 'id'>) => {
        if (!currentUser) throw new Error("User not authenticated");
        setPersonnelLoading(true);
        console.log(`--- Mise à jour du personnel ${personnelId} (envoi) ---`, personnelData);
        try {
            const response = await apiUpdatePersonnel(personnelId, personnelData);
            console.log(`--- Mise à jour du personnel ${personnelId} (réponse) ---`, response.data);
            setPersonnel(prev => prev.map(p => (p.id === personnelId ? { ...p, ...personnelData, ...response.data } : p)));
        } catch (error: any) {
            setPersonnelError(error.response?.data?.message || 'Échec de la mise à jour du personnel.');
            throw error;
        } finally {
            setPersonnelLoading(false);
        }
    };

    const deletePersonnel = async (personnelId: string) => {
        try {
            await apiDeletePersonnel(personnelId);
            setPersonnel(prev => prev.filter(p => p.id !== personnelId));
        } catch (error: any) {
            setPersonnelError(error.response?.data?.message || 'Échec de la suppression du personnel.');
            throw error;
        }
    };



    const value = {
        dossiers,
        currentUser,
        token,
        dossiersLoading,
        dossiersError,
        resourceOrders,
        resourceOrdersLoading,
        resourceOrdersError,
        unreadResourceOrdersCount,
        personnel,
        personnelLoading,
        personnelError,
        setUser,
        setToken: handleSetToken,
        logout,
        fetchDossiers,
        createDossier,
        updateDossierTaxAmounts,
        confirmPayment,
        cancelDossier,
        deleteDossier,
        fetchResourceOrders,
        createResourceOrder,
        deliverResourceOrder,
        confirmResourceOrderReceipt,
        markAllResourceOrdersAsRead,
        fetchPersonnel,
        addPersonnel,
        updatePersonnel,
        deletePersonnel
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppStore = (): AppState => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppStore must be used within an AppProvider');
    }
    return context;
};