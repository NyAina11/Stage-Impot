import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DossierPaiement, User, Role, DossierStatus, AuditLog, TaxDetail, PaymentMethod } from '../types';
import { USERS } from '../constants';

interface AppState {
  dossiers: DossierPaiement[];
  currentUser: User | null;
  login: (userId: string) => void;
  logout: () => void;
  createDossier: (data: { taxpayerName: string; taxId: string; taxTypes: string[] }) => void;
  updateDossierTaxAmounts: (dossierId: string, taxDetails: TaxDetail[]) => void;
  confirmPayment: (dossierId: string, paymentDetails: { method: PaymentMethod; bankName?: string }) => void;
  cancelDossier: (dossierId: string, reason: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const getNextDossierId = (dossiers: DossierPaiement[]): string => {
    const currentYear = new Date().getFullYear();
    const dossiersThisYear = dossiers.filter(d => d.id.startsWith(`${currentYear}-`));
    const nextId = dossiersThisYear.length + 1;
    return `${currentYear}-${String(nextId).padStart(4, '0')}`;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dossiers, setDossiers] = useState<DossierPaiement[]>(() => {
        try {
            const localData = localStorage.getItem('dossiers');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Error loading dossiers from localStorage", error);
            return [];
        }
    });

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const localUser = localStorage.getItem('currentUser');
            return localUser ? JSON.parse(localUser) : null;
        } catch (error) {
            console.error("Error loading user from localStorage", error);
            return null;
        }
    });

    useEffect(() => {
        localStorage.setItem('dossiers', JSON.stringify(dossiers));
    }, [dossiers]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    const addAuditLog = useCallback((dossier: DossierPaiement, action: string, user: User): DossierPaiement => {
        const newLog: AuditLog = {
            user: user.name,
            role: user.role,
            action,
            timestamp: new Date().toISOString(),
        };
        return { ...dossier, history: [...dossier.history, newLog] };
    }, []);

    const login = (userId: string) => {
        const user = USERS.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
        }
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const createDossier = (data: { taxpayerName: string; taxId: string; taxTypes: string[] }) => {
        if (!currentUser) return;
        const newDossier: DossierPaiement = {
            taxpayerName: data.taxpayerName,
            taxId: data.taxId,
            taxDetails: data.taxTypes.map(name => ({ name, amount: undefined })),
            id: getNextDossierId(dossiers),
            status: DossierStatus.EN_ATTENTE_DE_CALCUL,
            creationDate: new Date().toISOString(),
            createdBy: currentUser.name,
            history: [],
        };
        const dossierWithLog = addAuditLog(newDossier, `Dossier créé.`, currentUser);
        setDossiers(prev => [dossierWithLog, ...prev]);
    };

    const updateDossierTaxAmounts = (dossierId: string, taxDetails: TaxDetail[]) => {
        if (!currentUser) return;
        setDossiers(prev => prev.map(d => {
            if (d.id === dossierId) {
                const totalAmount = taxDetails.reduce((sum, tax) => sum + (tax.amount || 0), 0);
                const updatedDossier = {
                    ...d,
                    taxDetails: taxDetails,
                    amountDue: totalAmount,
                    status: DossierStatus.EN_ATTENTE_DE_PAIEMENT,
                    validationDate: new Date().toISOString(),
                    managedBy: currentUser.name,
                };
                return addAuditLog(updatedDossier, `Montant à payer défini: ${totalAmount.toLocaleString('fr-FR')} Ar.`, currentUser);
            }
            return d;
        }));
    };

    const confirmPayment = (dossierId: string, paymentDetails: { method: PaymentMethod; bankName?: string }) => {
        if (!currentUser) return;
        setDossiers(prev => prev.map(d => {
            if (d.id === dossierId) {
                const updatedDossier: DossierPaiement = {
                    ...d,
                    status: DossierStatus.PAYE,
                    paymentDate: new Date().toISOString(),
                    paidTo: currentUser.name,
                    paymentMethod: paymentDetails.method,
                    bankName: paymentDetails.bankName,
                };
                 let logMessage = `Paiement confirmé par ${paymentDetails.method}.`;
                if (paymentDetails.method === PaymentMethod.VIREMENT && paymentDetails.bankName) {
                    logMessage += ` (Banque: ${paymentDetails.bankName})`;
                }
                return addAuditLog(updatedDossier, logMessage, currentUser);
            }
            return d;
        }));
    };

    const cancelDossier = (dossierId: string, reason: string) => {
        if (!currentUser) return;
        setDossiers(prev => prev.map(d => {
            if (d.id === dossierId) {
                const updatedDossier = {
                    ...d,
                    status: DossierStatus.ANNULE,
                    cancellationReason: reason,
                };
                return addAuditLog(updatedDossier, `Dossier annulé. Raison: ${reason}`, currentUser);
            }
            return d;
        }));
    };


    // FIX: The file has a .ts extension but was using JSX syntax, which caused a series of parsing errors.
    // The fix is to use React.createElement instead of JSX to make the code valid in a .ts file.
    return React.createElement(
        AppContext.Provider,
        {
            value: { dossiers, currentUser, login, logout, createDossier, updateDossierTaxAmounts, confirmPayment, cancelDossier }
        },
        children
    );
};

export const useAppStore = (): AppState => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppStore must be used within an AppProvider');
    }
    return context;
};