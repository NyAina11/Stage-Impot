import React from 'react';
import { DossierPaiement, DossierStatus, PaymentMethod } from '../types';
import Badge from './ui/Badge';
import Card from './ui/Card';

interface DossierDetailModalProps {
  dossier: DossierPaiement;
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
        <div className="flex">
            <div className="flex flex-col items-center mr-4">
                <div>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${classes.bg} text-white`}>
                        {status === 'completed' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                        {status === 'current' && <div className={`w-3 h-3 bg-white rounded-full ring-2 ${classes.ring}`}></div>}
                    </div>
                </div>
                <div className={`w-px h-full ${status === 'completed' ? 'bg-green-300' : 'bg-gray-300'}`}></div>
            </div>
            <div className="pb-8">
                <p className={`mb-1 text-md font-semibold ${classes.text}`}>{title}</p>
                <div className="text-sm text-gray-600 dark:text-gray-400">{children}</div>
            </div>
        </div>
    );
};


const DossierDetailModal: React.FC<DossierDetailModalProps> = ({ dossier, onClose }) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
                 <h2 className="text-2xl font-bold">Détails du Dossier <span className="text-primary-500">{dossier.id}</span></h2>
                 <Badge status={dossier.status} />
            </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-4">
                <Card>
                    <h3 className="font-bold text-lg mb-2">Informations Générales</h3>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Contribuable:</strong><br/> {dossier.taxpayerName}</div>
                        <div><strong>Identifiant Fiscal:</strong><br/> {dossier.taxId}</div>
                        
                        <div className="col-span-2 mt-2">
                            <strong>Détail des impôts:</strong>
                            <div className="mt-1 space-y-1 rounded-md bg-gray-50 dark:bg-gray-700/50 p-3">
                                {dossier.taxDetails.map((detail, index) => (
                                    <div key={index} className="flex justify-between">
                                        <span>{detail.name}</span>
                                        <span className="font-semibold">{detail.amount ? `${detail.amount.toLocaleString('fr-FR')} Ar` : 'En attente de calcul'}</span>
                                    </div>
                                ))}
                                {dossier.amountDue != null && (
                                    <>
                                        <hr className="border-gray-300 dark:border-gray-600 my-1"/>
                                        <div className="flex justify-between font-bold text-base">
                                             <span>TOTAL</span>
                                             <span>{dossier.amountDue.toLocaleString('fr-FR')} Ar</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {dossier.status === DossierStatus.PAYE && (
                            <>
                                <div className="mt-2"><strong>Méthode de Paiement:</strong><br/> {dossier.paymentMethod}</div>
                                {dossier.paymentMethod === PaymentMethod.VIREMENT && dossier.bankName && (
                                    <div className="mt-2"><strong>Banque:</strong><br/> {dossier.bankName}</div>
                                )}
                            </>
                        )}
                        
                        {dossier.status === DossierStatus.ANNULE && <div className="col-span-2 mt-2"><strong>Raison d'annulation:</strong><br/> {dossier.cancellationReason}</div>}
                    </div>
                </Card>
                <Card>
                    <h3 className="font-bold text-lg mb-4">Historique des Actions</h3>
                    <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                        {dossier.history.map((log, index) => (
                            <div key={index} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                <div>
                                    <span className="font-semibold">{log.action}</span>
                                    <span className="text-gray-500 dark:text-gray-400"> par {log.user} ({log.role})</span>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            {/* Timeline */}
            <div className="md:col-span-1">
                 <Card>
                    <h3 className="font-bold text-lg mb-4">Progression</h3>
                    <div>
                        <TimelineStep title="Création" status={getStepStatus(0)}>
                            <p>Par: {dossier.createdBy}</p>
                            <p>Date: {new Date(dossier.creationDate).toLocaleDateString('fr-FR')}</p>
                        </TimelineStep>
                        <TimelineStep title="Calcul du Montant" status={getStepStatus(1)}>
                            {dossier.managedBy ? (
                                <>
                                <p>Par: {dossier.managedBy}</p>
                                <p>Date: {new Date(dossier.validationDate!).toLocaleDateString('fr-FR')}</p>
                                </>
                            ) : <p>En attente...</p>}
                        </TimelineStep>
                         <div className="flex"> {/* Final step has no line below */}
                             <div className="flex flex-col items-center mr-4">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getStepStatus(2) === 'completed' ? 'bg-green-500' : getStepStatus(2) === 'current' ? 'bg-blue-500' : 'bg-gray-400'} text-white`}>
                                     {getStepStatus(2) === 'completed' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                                </div>
                             </div>
                             <div className="pb-2">
                                 <p className={`mb-1 text-md font-semibold ${getStepStatus(2) === 'completed' ? 'text-green-800 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>Paiement Effectué</p>
                                 <div className="text-sm text-gray-600 dark:text-gray-400">
                                     {dossier.paidTo ? (
                                        <>
                                        <p>Par: {dossier.paidTo}</p>
                                        <p>Date: {new Date(dossier.paymentDate!).toLocaleDateString('fr-FR')}</p>
                                        </>
                                    ) : <p>En attente...</p>}
                                 </div>
                             </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DossierDetailModal;