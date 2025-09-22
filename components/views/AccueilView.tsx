import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Dossier, DossierStatus, TaxDetail } from '../../types';

// Fonction utilitaire pour transformer un Dossier en DossierPaiement
function mapDossierToDossierPaiement(dossier: any): any {
    return {
        ...dossier,
        amountDue: dossier.totalAmount ?? 0,
        creationDate: dossier.createdAt,
        validationDate: dossier.updatedAt || dossier.validationDate,
        paidTo: dossier.paymentDetails?.processedBy || '',
        paymentDate: dossier.paymentDetails?.processedAt || dossier.paymentDate,
        cancellationReason: dossier.reason,
        history: [], // À remplir si tu veux l'historique, sinon vide
    };
}
import { TAX_TYPES } from '../../constants';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import DossierDetailModal from '../DossierDetailModal';
import FilePlusIcon from '../icons/FilePlusIcon';

const AccueilView: React.FC = () => {
    const { dossiers, createDossier, fetchDossiers, dossiersLoading, dossiersError, currentUser } = useAppStore();
    const [taxpayerName, setTaxpayerName] = useState('');
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11

    const [startMonth, setStartMonth] = useState(currentMonth);
    const [startYear, setStartYear] = useState(currentYear);
    const [endMonth, setEndMonth] = useState(currentMonth);
    const [endYear, setEndYear] = useState(currentYear);
    const [selectedTaxTypes, setSelectedTaxTypes] = useState<string[]>([]);
    const [isTaxDropdownOpen, setIsTaxDropdownOpen] = useState(false);
    const taxDropdownRef = useRef<HTMLDivElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
    const [modalDossier, setModalDossier] = useState<any | null>(null);
    
    const months = [ "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre" ];
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchDossiers();
    }, [fetchDossiers]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (taxDropdownRef.current && !taxDropdownRef.current.contains(event.target as Node)) {
                setIsTaxDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleTaxTypeChange = (taxType: string) => {
        setSelectedTaxTypes(prev =>
            prev.includes(taxType)
                ? prev.filter(t => t !== taxType)
                : [...prev, taxType]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taxpayerName) {
            alert("Veuillez entrer le nom du contribuable.");
            return;
        }
        if (selectedTaxTypes.length === 0) {
            alert("Veuillez sélectionner au moins un type d'impôt.");
            return;
        }

        const taxDetails: TaxDetail[] = selectedTaxTypes.map(type => ({
            name: type,
            amount: 0, 
        }));

        const startPeriod = `${months[startMonth]} ${startYear}`;
        const endPeriod = `${months[endMonth]} ${endYear}`;
        const taxPeriod = startPeriod === endPeriod ? startPeriod : `${startPeriod} à ${endPeriod}`;
        
        const newDossier: Omit<Dossier, 'id' | 'createdAt' | 'createdBy' | 'totalAmount'> = {
            taxpayerName: taxpayerName,
            taxPeriod: taxPeriod,
            status: DossierStatus.EN_ATTENTE_DE_CALCUL,
            taxDetails: taxDetails,
            // totalAmount will be calculated by the backend upon creation (sum of taxDetails amounts)
        };
            
        try {
            await createDossier(newDossier);
            setTaxpayerName('');
            setSelectedTaxTypes([]);
            setStartMonth(currentMonth);
            setStartYear(currentYear);
            setEndMonth(currentMonth);
            setEndYear(currentYear);
            setIsTaxDropdownOpen(false);
        } catch (error) {
            console.error("Failed to create dossier:", error);
        }
    };

    const filteredDossiers = useMemo(() => {
        return dossiers.filter(d =>
            d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.taxpayerName.toLowerCase().includes(searchTerm.toLowerCase()) || // Filter by taxpayerName
            d.taxPeriod.toLowerCase().includes(searchTerm.toLowerCase()) || // Filter by taxPeriod
            (d.taxDetails && d.taxDetails.some(td => td.name.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [dossiers, searchTerm]);

    return (
        <div className="space-y-8">
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center space-x-2">
                        <FilePlusIcon className="w-6 h-6 text-primary-500" />
                        <span>Créer un nouveau dossier de paiement</span>
                    </h2>
                    
                    <Input label="Nom du contribuable" id="taxpayerName" value={taxpayerName} onChange={e => setTaxpayerName(e.target.value)} required />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période de l'impôt</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Du mois de</span>
                                <div className="flex space-x-2">
                                    <select value={startMonth} onChange={e => setStartMonth(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                                    </select>
                                    <select value={startYear} onChange={e => setStartYear(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Au mois de</span>
                                <div className="flex space-x-2">
                                    <select value={endMonth} onChange={e => setEndMonth(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                                    </select>
                                    <select value={endYear} onChange={e => setEndYear(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative" ref={taxDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type(s) d'impôt</label>
                        <button
                            type="button"
                            onClick={() => setIsTaxDropdownOpen(prev => !prev)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-left flex justify-between items-center bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <span className="truncate">
                                {selectedTaxTypes.length === 0
                                    ? "Sélectionner un ou plusieurs types"
                                    : selectedTaxTypes.length === 1
                                        ? selectedTaxTypes[0]
                                        : `${selectedTaxTypes.length} type(s) sélectionné(s)`
                                }
                            </span>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isTaxDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        {isTaxDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {TAX_TYPES.map(tax => (
                                    <label key={tax} className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500"
                                            checked={selectedTaxTypes.includes(tax)}
                                            onChange={() => handleTaxTypeChange(tax)}
                                        />
                                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-200">{tax}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        <Button type="submit" disabled={dossiersLoading}> 
                            {dossiersLoading ? 'Création...' : 'Enregistrer et Transmettre à la Gestion'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Suivi de tous les dossiers</h2>
                    <Input label="" id="search" placeholder="Rechercher par ID, Nom, Période..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                {dossiersLoading && <p className="text-center text-primary-600 dark:text-primary-400">Chargement des dossiers...</p>}
                {dossiersError && <p className="text-center text-red-500">Erreur: {dossiersError}</p>}
                {!dossiersLoading && !dossiersError && filteredDossiers.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400">Aucun dossier trouvé.</p>
                )}
                {!dossiersLoading && !dossiersError && filteredDossiers.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">ID Dossier</th>
                                    <th scope="col" className="px-6 py-3">Contribuable</th>
                                    <th scope="col" className="px-6 py-3">Période Fiscale</th>
                                    <th scope="col" className="px-6 py-3">Statut</th>
                                    <th scope="col" className="px-6 py-3">Type(s) d'impôts</th>
                                    <th scope="col" className="px-6 py-3">Date Création</th>
                                    <th scope="col" className="px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDossiers.map(dossier => (
                                    <tr key={dossier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dossier.id}</td>
                                        <td className="px-6 py-4">{dossier.taxpayerName}</td>
                                        <td className="px-6 py-4">{dossier.taxPeriod}</td>
                                        <td className="px-6 py-4"><Badge status={dossier.status} /></td>
                                        <td className="px-6 py-4">{dossier.taxDetails ? dossier.taxDetails.map(td => td.name).join(', ') : 'N/A'}</td>
                                        <td className="px-6 py-4">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-6 py-4">
                                            <Button variant="secondary" onClick={() => setModalDossier(mapDossierToDossierPaiement(dossier))}>Voir Détails</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {modalDossier && <DossierDetailModal dossier={modalDossier} onClose={() => setModalDossier(null)} />}
        </div>
    );
};

export default AccueilView;