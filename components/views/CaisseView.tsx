import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DossierPaiement, DossierStatus, PaymentMethod } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import DossierDetailModal from '../DossierDetailModal';

interface PaymentStats {
    espece: number;
    cheque: number;
    virement: number;
    total: number;
}

const StatCard: React.FC<{ title: string; stats: PaymentStats }> = ({ title, stats }) => {
    const formatCurrency = (amount: number) => `${amount.toLocaleString('fr-FR')} Ar`;
    
    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{title}</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Espèces:</span>
                    <span className="font-medium">{formatCurrency(stats.espece)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Chèques:</span>
                    <span className="font-medium">{formatCurrency(stats.cheque)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Virements:</span>
                    <span className="font-medium">{formatCurrency(stats.virement)}</span>
                </div>
                <hr className="my-2 border-gray-200 dark:border-gray-600" />
                <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span className="text-primary-600 dark:text-primary-400">{formatCurrency(stats.total)}</span>
                </div>
            </div>
        </Card>
    );
};


const CaisseView: React.FC = () => {
    const { dossiers, confirmPayment } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [dossierToConfirm, setDossierToConfirm] = useState<DossierPaiement | null>(null);
    const [selectedDossierForDetail, setSelectedDossierForDetail] = useState<DossierPaiement | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.ESPECE);
    const [bankName, setBankName] = useState('');

    const dossiersToPay = useMemo(() => {
        const pending = dossiers.filter(d => d.status === DossierStatus.EN_ATTENTE_DE_PAIEMENT);
         if (!searchTerm) return pending;
        return pending.filter(d =>
            d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.taxpayerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.taxId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [dossiers, searchTerm]);
    
    const paymentStats = useMemo(() => {
        const paidDossiers = dossiers.filter(d => d.status === DossierStatus.PAYE && d.paymentDate);

        const calculateTotals = (filteredList: DossierPaiement[]): PaymentStats => {
            return filteredList.reduce((acc, dossier) => {
                const amount = dossier.amountDue || 0;
                if (dossier.paymentMethod === PaymentMethod.ESPECE) acc.espece += amount;
                else if (dossier.paymentMethod === PaymentMethod.CHEQUE) acc.cheque += amount;
                else if (dossier.paymentMethod === PaymentMethod.VIREMENT) acc.virement += amount;
                acc.total += amount;
                return acc;
            }, { espece: 0, cheque: 0, virement: 0, total: 0 });
        };

        const today = new Date();
        const todayStr = today.toDateString();
        const dailyDossiers = paidDossiers.filter(d => new Date(d.paymentDate!).toDateString() === todayStr);

        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(today.getDate() - 9); // Inclusive of today
        tenDaysAgo.setHours(0,0,0,0);
        const last10DaysDossiers = paidDossiers.filter(d => new Date(d.paymentDate!) >= tenDaysAgo);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyDossiers = paidDossiers.filter(d => new Date(d.paymentDate!) >= startOfMonth);

        return {
            daily: calculateTotals(dailyDossiers),
            last10Days: calculateTotals(last10DaysDossiers),
            monthly: calculateTotals(monthlyDossiers)
        };
    }, [dossiers]);


    const handleOpenConfirmModal = (dossier: DossierPaiement) => {
        setDossierToConfirm(dossier);
        setPaymentMethod(PaymentMethod.ESPECE);
        setBankName('');
    };

    const handleConfirm = () => {
        if (dossierToConfirm) {
             if (paymentMethod === PaymentMethod.VIREMENT && !bankName.trim()) {
                alert("Veuillez saisir le nom de la banque.");
                return;
            }
            confirmPayment(dossierToConfirm.id, {
                method: paymentMethod,
                bankName: paymentMethod === PaymentMethod.VIREMENT ? bankName.trim() : undefined,
            });
            setDossierToConfirm(null);
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Encaissé (Aujourd'hui)" stats={paymentStats.daily} />
                <StatCard title="Total Encaissé (10 derniers jours)" stats={paymentStats.last10Days} />
                <StatCard title="Total Encaissé (Ce mois-ci)" stats={paymentStats.monthly} />
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Dossiers en attente de paiement</h2>
                    <Input label="" id="search" placeholder="Rechercher par ID, Nom, NIF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID Dossier</th>
                                <th scope="col" className="px-6 py-3">Contribuable</th>
                                <th scope="col" className="px-6 py-3">Montant à Payer</th>
                                <th scope="col" className="px-6 py-3">Validé par</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dossiersToPay.map(dossier => (
                                <tr key={dossier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dossier.id}</td>
                                    <td className="px-6 py-4">{dossier.taxpayerName}</td>
                                    <td className="px-6 py-4 font-semibold">{dossier.amountDue?.toLocaleString('fr-FR')} Ar</td>
                                    <td className="px-6 py-4">{dossier.managedBy}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <Button onClick={() => handleOpenConfirmModal(dossier)}>Confirmer Paiement</Button>
                                        <Button variant="secondary" onClick={() => setSelectedDossierForDetail(dossier)}>Détails</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {dossierToConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <Card className="w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Confirmer le paiement</h2>
                        <p className="mb-2"><strong>Dossier:</strong> {dossierToConfirm.id}</p>
                        <p className="mb-2"><strong>Contribuable:</strong> {dossierToConfirm.taxpayerName}</p>
                        <p className="mb-4 text-xl font-bold text-primary-600"><strong>Montant:</strong> {dossierToConfirm.amountDue?.toLocaleString('fr-FR')} Ariary</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Méthode de paiement</label>
                                <div className="flex flex-wrap gap-4">
                                    {Object.values(PaymentMethod).map(method => (
                                        <label key={method} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value={method}
                                                checked={paymentMethod === method}
                                                onChange={() => setPaymentMethod(method)}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                            />
                                            <span className="text-sm">{method}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {paymentMethod === PaymentMethod.VIREMENT && (
                                <Input
                                    label="Nom de la banque"
                                    id="bankName"
                                    value={bankName}
                                    onChange={e => setBankName(e.target.value)}
                                    required
                                />
                            )}
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="secondary" onClick={() => setDossierToConfirm(null)}>Annuler</Button>
                            <Button onClick={handleConfirm}>Confirmer</Button>
                        </div>
                    </Card>
                </div>
            )}
            
            {selectedDossierForDetail && <DossierDetailModal dossier={selectedDossierForDetail} onClose={() => setSelectedDossierForDetail(null)} />}

        </div>
    );
};

export default CaisseView;