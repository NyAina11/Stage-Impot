import React, { useState, useMemo, useEffect } from 'react';

const GestionView: React.FC = () => {
    const { dossiers, updateDossierTaxAmounts, fetchDossiers, dossiersLoading, dossiersError } = useAppStore();
    const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null); 
    const [modalDossier, setModalDossier] = useState<any | null>(null);
    const [dossierToEdit, setDossierToEdit] = useState<Dossier | null>(null); 
    const [taxAmounts, setTaxAmounts] = useState<Record<string, number | undefined>>({});

    useEffect(() => {
        fetchDossiers();
    }, [fetchDossiers]);

    const dossiersToProcess = useMemo(() => {
        return dossiers.filter(d => d.status === DossierStatus.EN_ATTENTE_DE_CALCUL);
    }, [dossiers]);
    
    const processedDossiers = useMemo(() => {
        return dossiers.filter(d => 
            d.status !== DossierStatus.EN_ATTENTE_DE_CALCUL && 
            d.managedBy 
        );
    }, [dossiers]);

    const handleEditClick = (dossier: Dossier) => { 
        setDossierToEdit(dossier);
        const initialAmounts = dossier.taxDetails.reduce((acc, detail) => {
            acc[detail.name] = detail.amount !== undefined ? detail.amount : undefined;
            return acc;
        }, {} as Record<string, number | undefined>);
        setTaxAmounts(initialAmounts);
    };

    const handleAmountChange = (name: string, value: string) => {
        const amount = value === '' ? undefined : Number(value);
        if (!isNaN(amount || 0)) {
            setTaxAmounts(prev => ({ ...prev, [name]: amount }));
        }
    };

    const handleValidation = async () => {
        if (!dossierToEdit) return;
        const updatedTaxDetails: TaxDetail[] = dossierToEdit.taxDetails.map(detail => ({
            ...detail,
            amount: taxAmounts[detail.name] !== undefined ? taxAmounts[detail.name] || 0 : 0, 
        }));
        try {
            await updateDossierTaxAmounts(dossierToEdit.id, updatedTaxDetails);
            setDossierToEdit(null);
            setTaxAmounts({});
        } catch (error) {
            console.error("Erreur lors de la validation du calcul:", error);
        }
    };
    
    const isValidationDisabled = useMemo(() => {
        if (!dossierToEdit) return true;
        return dossierToEdit.taxDetails.some(detail => taxAmounts[detail.name] === undefined || (taxAmounts[detail.name] || 0) < 0);
    }, [dossierToEdit, taxAmounts]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Interface de Gestion</h1>



            {dossiersLoading && <p className="text-center text-primary-600 dark:text-primary-400">Chargement des dossiers...</p>}
            {dossiersError && <p className="text-center text-red-500">Erreur: {dossiersError}</p>}

            {!dossiersLoading && !dossiersError && (
                <>
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Dossiers en attente de calcul</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">ID Dossier</th>
                                        <th scope="col" className="px-6 py-3">Contribuable</th>
                                        <th scope="col" className="px-6 py-3">Période Fiscale</th>
                                        <th scope="col" className="px-6 py-3">Date Création</th>
                                        <th scope="col" className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dossiersToProcess.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-4">Aucun dossier en attente.</td></tr>
                                    ) : (
                                        dossiersToProcess.map(dossier => (
                                            <tr key={dossier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dossier.id}</td>
                                                <td className="px-6 py-4">{dossier.taxpayerName}</td>
                                                <td className="px-6 py-4">{dossier.taxPeriod}</td>
                                                <td className="px-6 py-4">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</td> 
                                                <td className="px-6 py-4 flex space-x-2">
                                                    <Button onClick={() => handleEditClick(dossier)}>Calculer Montant</Button>
                                                    <Button variant="secondary" onClick={() => setModalDossier(mapDossierToDossierPaiement(dossier))}>Voir Détails</Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold mb-4">Historique des dossiers traités</h2>
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">ID Dossier</th>
                                        <th scope="col" className="px-6 py-3">Contribuable</th>
                                        <th scope="col" className="px-6 py-3">Période Fiscale</th>
                                        <th scope="col" className="px-6 py-3">Montant Total</th> 
                                        <th scope="col" className="px-6 py-3">Statut</th>
                                        <th scope="col" className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedDossiers.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-4">Aucun dossier traité.</td></tr> 
                                    ) : (
                                        processedDossiers.map(dossier => (
                                            <tr key={dossier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dossier.id}</td>
                                                <td className="px-6 py-4">{dossier.taxpayerName}</td>
                                                <td className="px-6 py-4">{dossier.taxPeriod}</td>
                                                <td className="px-6 py-4">{dossier.totalAmount ? `${dossier.totalAmount.toLocaleString('fr-FR')} Ar` : 'N/A'}</td> 
                                                <td className="px-6 py-4"><Badge status={dossier.status} /></td>
                                                <td className="px-6 py-4">
                                                    <Button variant="secondary" onClick={() => setModalDossier(mapDossierToDossierPaiement(dossier))}>Voir Détails</Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {modalDossier && <DossierDetailModal dossier={modalDossier} onClose={() => setModalDossier(null)} />}

            {dossierToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <Card className="w-full max-w-lg">
                        <h2 className="text-lg font-bold mb-4">Calculer les montants pour {dossierToEdit.id}</h2>
                        <div className="space-y-4">
                            {dossierToEdit.taxDetails.map(detail => (
                                <Input
                                    key={detail.name}
                                    label={detail.name}
                                    id={detail.name}
                                    type="number"
                                    min="0"
                                    placeholder="Montant en Ariary"
                                    value={taxAmounts[detail.name] ?? ''}
                                    onChange={(e) => handleAmountChange(detail.name, e.target.value)}
                                    required
                                />
                            ))}
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                            <Button variant="secondary" onClick={() => { setDossierToEdit(null); setTaxAmounts({}); }}>Annuler</Button>
                            <Button onClick={handleValidation} disabled={isValidationDisabled || dossiersLoading}>Valider le Calcul</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GestionView;