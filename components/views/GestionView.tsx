import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DossierPaiement, DossierStatus, TaxDetail } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

const GestionView: React.FC = () => {
    const { dossiers, updateDossierTaxAmounts } = useAppStore();
    const [selectedDossier, setSelectedDossier] = useState<DossierPaiement | null>(null);
    const [editableTaxDetails, setEditableTaxDetails] = useState<TaxDetail[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const dossiersToManage = useMemo(() => {
        const pending = dossiers.filter(d => d.status === DossierStatus.EN_ATTENTE_DE_CALCUL);
        if (!searchTerm) return pending;
        return pending.filter(d =>
            d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.taxpayerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.taxId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [dossiers, searchTerm]);

    const handleSelectDossier = (dossier: DossierPaiement) => {
        setSelectedDossier(dossier);
        setEditableTaxDetails(JSON.parse(JSON.stringify(dossier.taxDetails)));
    };

    const handleTaxAmountChange = (index: number, amount: number) => {
        const newDetails = [...editableTaxDetails];
        newDetails[index].amount = amount >= 0 ? amount : 0;
        setEditableTaxDetails(newDetails);
    };

    const totalAmount = useMemo(() => {
        return editableTaxDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
    }, [editableTaxDetails]);

    const handleSubmitAmounts = () => {
        if (selectedDossier) {
            const allAmountsSet = editableTaxDetails.every(detail => typeof detail.amount === 'number' && detail.amount >= 0);
            if (allAmountsSet && totalAmount > 0) {
                updateDossierTaxAmounts(selectedDossier.id, editableTaxDetails);
                setSelectedDossier(null);
                setEditableTaxDetails([]);
            } else {
                alert("Veuillez définir un montant valide (positif ou nul) pour chaque type d'impôt.");
            }
        }
    };
    
    return (
        <div className="space-y-8">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Dossiers en attente de calcul</h2>
                    <Input label="" id="search" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID Dossier</th>
                                <th scope="col" className="px-6 py-3">Contribuable</th>
                                <th scope="col" className="px-6 py-3">Impôts</th>
                                <th scope="col" className="px-6 py-3">Créé par</th>
                                <th scope="col" className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dossiersToManage.map(dossier => (
                                <tr key={dossier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dossier.id}</td>
                                    <td className="px-6 py-4">{dossier.taxpayerName}</td>
                                    <td className="px-6 py-4">{dossier.taxDetails.map(d => d.name).join(', ')}</td>
                                    <td className="px-6 py-4">{dossier.createdBy}</td>
                                    <td className="px-6 py-4">
                                        <Button onClick={() => handleSelectDossier(dossier)}>Traiter</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {selectedDossier && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <Card className="w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Définir les montants à payer</h2>
                            <button onClick={() => setSelectedDossier(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <p><strong>ID Dossier:</strong> {selectedDossier.id}</p>
                            <p><strong>Contribuable:</strong> {selectedDossier.taxpayerName}</p>
                            <div className="space-y-3 pt-2">
                                {editableTaxDetails.map((detail, index) => (
                                    <div key={index} className="flex items-center justify-between gap-4">
                                        <label htmlFor={`tax-amount-${index}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{detail.name}</label>
                                        <input
                                            id={`tax-amount-${index}`}
                                            type="number"
                                            value={detail.amount ?? ''}
                                            onChange={e => handleTaxAmountChange(index, Number(e.target.value))}
                                            className="w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Montant en Ariary"
                                            required
                                            min="0"
                                        />
                                    </div>
                                ))}
                            </div>
                            <hr className="my-4 border-gray-300 dark:border-gray-600"/>
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Montant Total à Payer:</span>
                                <span className="text-primary-600 dark:text-primary-400">{totalAmount.toLocaleString('fr-FR')} Ar</span>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <Button variant="secondary" onClick={() => setSelectedDossier(null)}>Annuler</Button>
                                <Button onClick={handleSubmitAmounts} disabled={totalAmount <= 0}>Valider et Transmettre à la Caisse</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GestionView;