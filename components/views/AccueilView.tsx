
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DossierPaiement, DossierStatus } from '../../types';
import { TAX_TYPES } from '../../constants';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import DossierDetailModal from '../DossierDetailModal';
import FilePlusIcon from '../icons/FilePlusIcon';

const AccueilView: React.FC = () => {
    const { dossiers, createDossier } = useAppStore();
    const [taxpayerName, setTaxpayerName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [selectedTaxTypes, setSelectedTaxTypes] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDossier, setSelectedDossier] = useState<DossierPaiement | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (taxpayerName && taxId && selectedTaxTypes.length > 0) {
            createDossier({ taxpayerName, taxId, taxTypes: selectedTaxTypes });
            setTaxpayerName('');
            setTaxId('');
            setSelectedTaxTypes([]);
        }
    };

    const handleTaxTypeChange = (taxType: string) => {
        setSelectedTaxTypes(prev =>
            prev.includes(taxType) ? prev.filter(t => t !== taxType) : [...prev, taxType]
        );
    };

    const filteredDossiers = useMemo(() => {
        return dossiers.filter(d =>
            d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.taxpayerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.taxId.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nom du contribuable" id="taxpayerName" value={taxpayerName} onChange={e => setTaxpayerName(e.target.value)} required />
                        <Input label="Identifiant Fiscal (NIF)" id="taxId" value={taxId} onChange={e => setTaxId(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Types d'impôts</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {TAX_TYPES.map(tax => (
                                <label key={tax} className="flex items-center space-x-2 p-2 rounded-md bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedTaxTypes.includes(tax)}
                                        onChange={() => handleTaxTypeChange(tax)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm">{tax}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <Button type="submit">Enregistrer et Transmettre à la Gestion</Button>
                    </div>
                </form>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Suivi de tous les dossiers</h2>
                    <Input label="" id="search" placeholder="Rechercher par ID, Nom, NIF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID Dossier</th>
                                <th scope="col" className="px-6 py-3">Contribuable</th>
                                <th scope="col" className="px-6 py-3">Statut</th>
                                <th scope="col" className="px-6 py-3">Date Création</th>
                                <th scope="col" className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDossiers.map(dossier => (
                                <tr key={dossier.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dossier.id}</td>
                                    <td className="px-6 py-4">{dossier.taxpayerName}</td>
                                    <td className="px-6 py-4"><Badge status={dossier.status} /></td>
                                    <td className="px-6 py-4">{new Date(dossier.creationDate).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4">
                                        <Button variant="secondary" onClick={() => setSelectedDossier(dossier)}>Voir Détails</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {selectedDossier && <DossierDetailModal dossier={selectedDossier} onClose={() => setSelectedDossier(null)} />}
        </div>
    );
};

export default AccueilView;
