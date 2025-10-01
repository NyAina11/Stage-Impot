import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DossierStatus } from '../../types';

function mapDossierToDossierPaiement(dossier: any): any {
    return {
        ...dossier,
        amountDue: dossier.totalAmount ?? 0,
        creationDate: dossier.createdAt,
        validationDate: dossier.updatedAt || dossier.validationDate,
        paidTo: dossier.paymentDetails?.processedBy || '',
        paymentDate: dossier.paymentDetails?.processedAt || null,
        cancellationReason: dossier.reason,
        history: [],
    };
}
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import DossierDetailModal from '../DossierDetailModal';
import KPICharts from '../KPICharts';

const ChefDivisionView: React.FC = () => {
    const { dossiers, cancelDossier, fetchPersonnel } = useAppStore();
    const [filters, setFilters] = useState({
        searchTerm: '',
        status: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchPersonnel();
    }, [fetchPersonnel]);

    const [modalDossier, setModalDossier] = useState<any | null>(null);
        const [dossierToCancel, setDossierToCancel] = useState<any | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };



    const filteredDossiers = useMemo(() => {
        return dossiers.filter(d => {
            const searchTermMatch = filters.searchTerm === '' ||
                d.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                d.taxpayerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                d.taxPeriod.toLowerCase().includes(filters.searchTerm.toLowerCase());

            const statusMatch = filters.status === '' || d.status === filters.status;

            const date = new Date(d.createdAt);
            const startDateMatch = filters.startDate === '' || date >= new Date(filters.startDate);
            const endDateMatch = filters.endDate === '' || date <= new Date(filters.endDate);

            return searchTermMatch && statusMatch && startDateMatch && endDateMatch;
        });
    }, [dossiers, filters]);
    
    const handleCancel = () => {
        if(dossierToCancel && cancelReason){
            cancelDossier(dossierToCancel.id, cancelReason);
            setDossierToCancel(null);
            setCancelReason('');
        }
    };
    
    // Note: PDF/Excel export is a complex feature requiring libraries. This is a placeholder.
    const handleExport = () => {
        alert("La fonctionnalité d'exportation sera implémentée ultérieurement.");
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Tableau de bord - Chef de Division</h1>
            <KPICharts dossiers={dossiers.map(mapDossierToDossierPaiement)} />

            <Card>
                <h2 className="text-xl font-bold mb-4">Consultation de tous les dossiers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <input name="searchTerm" placeholder="Rechercher..." onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <select name="status" onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="">Tous les statuts</option>
                        {Object.values(DossierStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input name="startDate" type="date" onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <input name="endDate" type="date" onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex justify-end mb-4">
                    <Button onClick={handleExport}>Exporter en PDF/Excel</Button>
                </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Contribuable</th>
                                <th className="px-6 py-3">Montant</th>
                                <th className="px-6 py-3">Statut</th>
                                <th className="px-6 py-3">Date Création</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDossiers.map(d => (
                                <tr key={d.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{d.id}</td>
                                    <td className="px-6 py-4">{d.taxpayerName}</td>
                                    <td className="px-6 py-4">{d.totalAmount ? `${d.totalAmount.toLocaleString('fr-FR')} Ar` : 'N/A'}</td>
                                    <td className="px-6 py-4"><Badge status={d.status} /></td>
                                    <td className="px-6 py-4">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <Button variant="secondary" onClick={() => setModalDossier(mapDossierToDossierPaiement(d))}>Détails</Button>
                                        {d.status !== DossierStatus.PAYE && d.status !== DossierStatus.ANNULE && 
                                            <Button variant="danger" onClick={() => setDossierToCancel(d)}>Annuler</Button>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            {modalDossier && <DossierDetailModal dossier={modalDossier} onClose={() => setModalDossier(null)} />}
            {dossierToCancel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <Card className="w-full max-w-md">
                        <h2 className="text-lg font-bold mb-4">Annuler le dossier {dossierToCancel.id}</h2>
                        <textarea
                            placeholder="Raison de l'annulation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-4"
                        />
                        <div className="flex justify-end space-x-2">
                            <Button variant="secondary" onClick={() => setDossierToCancel(null)}>Fermer</Button>
                            <Button variant="danger" onClick={handleCancel} disabled={!cancelReason}>Confirmer l'annulation</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ChefDivisionView;