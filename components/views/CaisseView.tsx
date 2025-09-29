import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore.tsx';
import { Dossier, DossierStatus, PaymentMethod } from '../../types'; 
import Button from '../ui/Button';
import Card from '../ui/Card';

import DossierDetailModal from '../DossierDetailModal';

const CaisseView: React.FC = () => {
    const { dossiers, confirmPayment } = useAppStore();
    const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null); 
    const [dossierToPay, setDossierToPay] = useState<Dossier | null>(null); 
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ESPECE);
    const [bankName, setBankName] = useState('');

    const paymentStats = useMemo(() => {
        const paidDossiers = dossiers.filter(d => d.status === DossierStatus.PAYE && d.paymentDetails?.processedAt); 

        const calculateTotals = (dossierList: Dossier[]) => { 
            const totals = {
                [PaymentMethod.ESPECE]: 0,
                [PaymentMethod.CHEQUE]: 0,
                [PaymentMethod.VIREMENT]: 0,
                total: 0,
            };
            for (const d of dossierList) {
                const amount = d.totalAmount || 0; 
                if (d.paymentMethod && totals.hasOwnProperty(d.paymentMethod)) {
                    totals[d.paymentMethod] += amount;
                }
                totals.total += amount;
            }
            return totals;
        };
        
        const now = new Date();
        
        const todayDossiers = paidDossiers.filter(d => 
            new Date(d.paymentDetails!.processedAt!).toDateString() === now.toDateString()
        );

        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(now.getDate() - 10);
        const last10DaysDossiers = paidDossiers.filter(d => 
            new Date(d.paymentDetails!.processedAt!) >= tenDaysAgo
        );

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthDossiers = paidDossiers.filter(d => 
            new Date(d.paymentDetails!.processedAt!) >= startOfMonth
        );

        return {
            daily: calculateTotals(todayDossiers),
            last10Days: calculateTotals(last10DaysDossiers),
            monthly: calculateTotals(currentMonthDossiers),
        };

    }, [dossiers]);

    const dossiersToProcess = useMemo(() => {
        return dossiers.filter(d => d.status === DossierStatus.EN_ATTENTE_DE_PAIEMENT);
    }, [dossiers]);
    
    const processedDossiers = useMemo(() => {
        return dossiers.filter(d => d.status === DossierStatus.PAYE);
    }, [dossiers]);

    const handlePayClick = (dossier: Dossier) => { 
        setDossierToPay(dossier);
        setPaymentMethod(PaymentMethod.ESPECE);
        setBankName('');
    };

    const handleConfirmPayment = () => {
        if (!dossierToPay) return;
        
        const paymentDetails: { method: PaymentMethod; bankName?: string } = { method: paymentMethod };
        if (paymentMethod === PaymentMethod.VIREMENT) {
            paymentDetails.bankName = bankName;
        }

        confirmPayment(dossierToPay.id, paymentDetails);
        setDossierToPay(null);
    };

    const isConfirmDisabled = paymentMethod === PaymentMethod.VIREMENT && !bankName.trim();

    const StatRow: React.FC<{title: string, stats: any}> = ({title, stats}) => (
        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{title}</td>
            <td className="px-6 py-4 text-right">{stats[PaymentMethod.ESPECE].toLocaleString('fr-FR')} Ar</td>
            <td className="px-6 py-4 text-right">{stats[PaymentMethod.CHEQUE].toLocaleString('fr-FR')} Ar</td>
            <td className="px-6 py-4 text-right">{stats[PaymentMethod.VIREMENT].toLocaleString('fr-FR')} Ar</td>
            <td className="px-6 py-4 text-right font-bold text-primary-600 dark:text-primary-400">{stats.total.toLocaleString('fr-FR')} Ar</td>
        </tr>
    );


            <Card>
                <h2 className="text-xl font-bold mb-4">Statistiques des Paiements</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Période</th>
                                <th scope="col" className="px-6 py-3 text-right">Espèces</th>
                                <th scope="col" className="px-6 py-3 text-right">Chèques</th>
                                <th scope="col" className="px-6 py-3 text-right">Virements</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Général</th>
                            </tr>
                        </thead>
                        <tbody>
                            <StatRow title="Aujourd'hui" stats={paymentStats.daily} />
                            <StatRow title="10 derniers jours" stats={paymentStats.last10Days} />
                            <StatRow title="Ce mois-ci" stats={paymentStats.monthly} />
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Dossiers en attente de paiement</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID Dossier</th>
                                <th scope="col" className="px-6 py-3">Contribuable</th>
                                <th scope="col" className="px-6 py-3">Montant à Payer</th>
                                <th scope="col" className="px-6 py-3">Date de Création</th> {/* Changed to Date de Création */}
                                <th scope="col" className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dossiersToProcess.map(dossier => (
                                <tr key={dossier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dossier.id}</td>
                                    <td className="px-6 py-4">{dossier.taxpayerName}</td>
                                    <td className="px-6 py-4 font-semibold">{dossier.totalAmount?.toLocaleString('fr-FR')} Ar</td> 
                                    <td className="px-6 py-4">{dossier.createdAt ? new Date(dossier.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</td> {/* Using createdAt */}
                                    <td className="px-6 py-4 flex space-x-2">
                                        <Button onClick={() => handlePayClick(dossier)}>Confirmer Paiement</Button>
                                        <Button variant="secondary" onClick={() => setSelectedDossier(dossier)}>Voir Détails</Button>
                                    </td>
                                </tr>
                            ))}
                            {dossiersToProcess.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-4">Aucun dossier en attente de paiement.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

             <Card>
                <h2 className="text-xl font-bold mb-4">Historique des paiements</h2>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID Dossier</th>
                                <th scope="col" className="px-6 py-3">Contribuable</th>
                                <th scope="col" className="px-6 py-3">Montant Payé</th>
                                <th scope="col" className="px-6 py-3">Date Paiement</th>
                                <th scope="col" className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedDossiers.map(dossier => (
                                <tr key={dossier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dossier.id}</td>
                                    <td className="px-6 py-4">{dossier.taxpayerName}</td>
                                    <td className="px-6 py-4">{dossier.totalAmount?.toLocaleString('fr-FR')} Ar</td> 
                                    <td className="px-6 py-4">{dossier.paymentDetails?.processedAt ? new Date(dossier.paymentDetails.processedAt).toLocaleDateString('fr-FR') : 'N/A'}</td> 
                                    <td className="px-6 py-4">
                                        <Button variant="secondary" onClick={() => setSelectedDossier(dossier)}>Voir Détails</Button>
                                    </td>
                                </tr>
                            ))}
                             {processedDossiers.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-4">Aucun paiement enregistré.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {selectedDossier && <DossierDetailModal dossier={selectedDossier} onClose={() => setSelectedDossier(null)} />}

            {dossierToPay && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <Card className="w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Confirmer le paiement pour {dossierToPay.id}</h2>
                        <p className="mb-4">Montant: <span className="font-bold">{dossierToPay.totalAmount?.toLocaleString('fr-FR')} Ar</span></p> 
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Méthode de paiement</label>
                                <select 
                                    id="paymentMethod"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                >
                                    {Object.values(PaymentMethod).map(method => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>
                             {paymentMethod === PaymentMethod.VIREMENT && (
                                <div>
                                     <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de la banque</label>
                                    <input
                                        id="bankName"
                                        type="text"
                                        placeholder="ex: BNI Madagascar"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                        required
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button variant="secondary" onClick={() => setDossierToPay(null)}>Annuler</Button>
                            <Button onClick={handleConfirmPayment} disabled={isConfirmDisabled}>Confirmer</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CaisseView;