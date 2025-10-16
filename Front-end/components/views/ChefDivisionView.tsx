import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DossierStatus } from '../../types';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
import DossierDetailModal from '../DossierDetailModal';
import KPICharts from '../KPICharts';

const ChefDivisionView: React.FC = () => {
    const { dossiers, cancelDossier } = useAppStore();
    const [filters, setFilters] = useState({
        searchTerm: '',
        startDate: '',
        endDate: '',
    });

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

            const date = new Date(d.createdAt);
            const startDateMatch = filters.startDate === '' || date >= new Date(filters.startDate);
            const endDateMatch = filters.endDate === '' || date <= new Date(filters.endDate);

            return searchTermMatch && startDateMatch && endDateMatch;
        });
    }, [dossiers, filters]);
    
    const handleCancel = () => {
        if(dossierToCancel && cancelReason){
            cancelDossier(dossierToCancel.id, cancelReason);
            setDossierToCancel(null);
            setCancelReason('');
        }
    };
    

    const handleExportExcel = () => {
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}-${now.getMilliseconds().toString().padStart(3, '0')}`;
        const fileName = `dossiers_${formattedDate}.xlsx`;

        const ws = XLSX.utils.json_to_sheet(filteredDossiers.map(d => ({
            'ID': d.id,
            'Contribuable': d.taxpayerName,
            "Type d'impôt": d.taxDetails ? d.taxDetails.map(td => td.name).join(', ') : 'N/A',
            'Mois': d.taxPeriod,
            'Date Création': new Date(d.createdAt).toLocaleDateString('fr-FR'),
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Dossiers');
        XLSX.writeFile(wb, fileName);
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Tableau de bord - Chef de Division</h1>
            <KPICharts dossiers={dossiers.map(mapDossierToDossierPaiement)} />

            <Card>
                <h2 className="text-xl font-bold mb-4">Consultation de tous les dossiers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <input name="searchTerm" placeholder="Rechercher..." onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />

                    <input name="startDate" type="date" onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <input name="endDate" type="date" onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex justify-end mb-4 space-x-2">
                    <Button onClick={handleExportExcel}>Exporter en Excel</Button>
                </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Contribuable</th>
                                <th className="px-6 py-3">Type d'impôt</th>
                                <th className="px-6 py-3">Mois</th>
                                <th className="px-6 py-3">Date Création</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDossiers.map(d => (
                                <tr key={d.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{d.id}</td>
                                    <td className="px-6 py-4">{d.taxpayerName}</td>
                                    <td className="px-6 py-4">{d.taxDetails ? d.taxDetails.map(td => td.name).join(', ') : 'N/A'}</td>
                                    <td className="px-6 py-4">{d.taxPeriod}</td>
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