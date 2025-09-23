import React from 'react';
import { Dossier, DossierStatus, PaymentMethod } from '../types'; 
import Badge from './ui/Badge';
import Card from './ui/Card';
import Button from './ui/Button'; // Assurez-vous que Button est importé

interface DossierDetailModalProps {
  dossier: Dossier; 
  onClose: () => void;
}

const TimelineStep: React.FC<{ title: string; status: 'completed' | 'current' | 'pending'; children: React.ReactNode }> = ({ title, status, children }) => {
    const statusClasses = {
        completed: { bg: 'bg-green-500', text: 'text-green-800 dark:text-green-300', ring: 'ring-green-500' },
        current: { bg: 'bg-blue-500', text: 'text-blue-800 dark:text-blue-300', ring: 'ring-blue-500' },
        pending: { bg: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400', ring: 'ring-gray-400' },
    };
    const classes = statusClasses[status];

    return (
        <li className="mb-10 ml-6">
            <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 ${classes.bg}`}>
                {/* Icon based on status could go here */}
            </span>
            <h3 className={`flex items-center mb-1 text-lg font-semibold ${classes.text}`}>{title}</h3>
            <div className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                {children}
            </div>
        </li>
    );
};

const DossierDetailModal: React.FC<DossierDetailModalProps> = ({ dossier, onClose }) => {
    console.log("DossierDetailModal received dossier:", dossier); // Log pour diagnostiquer

    if (!dossier) {
        console.error("DossierDetailModal received null or undefined dossier.");
        return null; // Ne rien rendre si le dossier est null
    }

    const getStepStatus = (step: number) => {
        const statusOrder = [
            DossierStatus.EN_ATTENTE_DE_CALCUL,
            DossierStatus.EN_ATTENTE_DE_PAIEMENT,
            DossierStatus.PAYE
        ];
        const currentIndex = statusOrder.indexOf(dossier.status);

        if (dossier.status === DossierStatus.ANNULE && step <= currentIndex) return 'completed';
        if (step < currentIndex) return 'completed';
        if (step === currentIndex) return 'current';
        return 'pending';
    };

    const formatTaxDetails = (taxDetails: { name: string; amount: number }[]) => {
        if (!taxDetails || taxDetails.length === 0) return "Aucun détail fiscal";
        return taxDetails.map(detail => `${detail.name}: ${detail.amount.toLocaleString('fr-FR')} Ar`).join(', ');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Détails du Dossier #{dossier.id}</h2>
                    <Button variant="ghost" onClick={onClose}>×</Button>
                </div>
                
                <div className="space-y-4 mb-6">
                    <p><strong>Contribuable:</strong> {dossier.taxpayerName}</p>
                    <p><strong>Période Fiscale:</strong> {dossier.taxPeriod}</p>
                    <p><strong>Statut:</strong> <Badge status={dossier.status} /></p>
                    <p><strong>Montant Total:</strong> {dossier.totalAmount?.toLocaleString('fr-FR')} Ar</p>
                    <p><strong>Détails des impôts:</strong> {formatTaxDetails(dossier.taxDetails)}</p>
                </div>

                <h3 className="text-lg font-bold mb-4">Chronologie du Dossier</h3>
                <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
                    <TimelineStep title="Création du dossier" status={getStepStatus(0)}>
                        {dossier.createdAt ? new Date(dossier.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        <p>Créé par: {dossier.createdBy}</p>
                    </TimelineStep>

                    <TimelineStep title="Calcul des montants" status={getStepStatus(1)}>
                        {dossier.managedBy ? 
                            <p>Validé par: {dossier.managedBy} le {new Date(dossier.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p> 
                            : 'En attente de validation par la Gestion'}
                    </TimelineStep>

                    <TimelineStep title="Paiement du dossier" status={getStepStatus(2)}>
                        {dossier.paymentDetails?.processedAt ? 
                            <p>Payé par: {dossier.paymentDetails.processedBy} le {new Date(dossier.paymentDetails.processedAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                            : (dossier.status === DossierStatus.ANNULE ? 'Dossier annulé, pas de paiement.' : 'En attente de paiement')}
                    </TimelineStep>

                    {dossier.status === DossierStatus.ANNULE && dossier.cancelledAt && dossier.reason && (
                        <TimelineStep title="Dossier Annulé" status={'completed'}>
                            <p>Annulé le: {new Date(dossier.cancelledAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p>Raison: {dossier.reason}</p>
                            {dossier.cancelledBy && <p>Annulé par: {dossier.cancelledBy}</p>}
                        </TimelineStep>
                    )}
                </ol>
                
                <div className="mt-6 text-right">
                    <Button onClick={onClose}>Fermer</Button>
                </div>
            </Card>
        </div>
    );
};

export default DossierDetailModal;