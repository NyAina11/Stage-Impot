import React, { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAppStore } from '../store/useAppStore';
import { ResourceType, Role, ResourceOrderStatus } from '../types';
import React, { useState, useEffect } from 'react';

interface ResourceManagementModalProps {
    onClose: () => void;
}

const ResourceManagementModal: React.FC<ResourceManagementModalProps> = ({ onClose }) => {
    const { 
        createResourceOrder, 
        deliverResourceOrder, 
        confirmResourceOrderReceipt, 
        resourceOrders, 
        resourceOrdersTotal,
        fetchResourceOrders,
        resourceOrdersLoading,
        currentUser 
    } = useAppStore();

    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const ordersPerPage = 5;

    useEffect(() => {
        fetchResourceOrders({
            limit: ordersPerPage,
            offset: (currentPage - 1) * ordersPerPage,
            status: statusFilter || undefined,
        });
    }, [currentPage, statusFilter, fetchResourceOrders]);

    const [resourceType, setResourceType] = useState<ResourceType>(ResourceType.PAPIER);
    const [quantity, setQuantity] = useState<number>(1);
    const [unit, setUnit] = useState<string>('rames');
    const [targetDivision, setTargetDivision] = useState<Role>(Role.GESTION);
    const [description, setDescription] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const handleCreateOrder = async () => {
        if (quantity <= 0) return;
        try {
            await createResourceOrder({
                resourceType,
                quantity,
                unit,
                targetDivision,
                description,
                notes
            });
            // Reset form
            setQuantity(1);
            setDescription('');
            setNotes('');
        } catch (error) {
            console.error('Erreur lors de la création de la commande:', error);
        }
    };

    const handleDeliver = async (orderId: string) => {
        try {
            await deliverResourceOrder(orderId, 'Livré par ' + currentUser?.username);
        } catch (error) {
            console.error('Erreur lors de la livraison:', error);
        }
    };

    const handleConfirmReceipt = async (orderId: string) => {
        try {
            await confirmResourceOrderReceipt(orderId, 'Réception confirmée par ' + currentUser?.username);
        } catch (error) {
            console.error('Erreur lors de la confirmation:', error);
        }
    };

    const getResourceTypeDisplayName = (type: ResourceType): string => {
        return Object.values(ResourceType).find(val => val === type) || type;
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'En attente': return 'text-yellow-600 dark:text-yellow-400';
            case 'Livré': return 'text-blue-600 dark:text-blue-400';
            case 'Reçu': return 'text-green-600 dark:text-green-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const canCreateOrders = currentUser?.role === Role.ACCUEIL;
    const canDeliver = currentUser?.role === Role.ACCUEIL;
    const canConfirmReceipt = currentUser?.role !== Role.ACCUEIL;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Gestion des Ressources</h2>
                    <Button variant="ghost" onClick={onClose}>×</Button>
                </div>

                <div className="space-y-6">
                    {canCreateOrders && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Distribuer des Ressources</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Type de ressource</label>
                                    <select 
                                        value={resourceType} 
                                        onChange={(e) => setResourceType(e.target.value as ResourceType)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        {Object.values(ResourceType).map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Division destinataire</label>
                                    <select 
                                        value={targetDivision} 
                                        onChange={(e) => setTargetDivision(e.target.value as Role)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        <option value={Role.GESTION}>Gestion</option>
                                        <option value={Role.CAISSE}>Caisse</option>
                                        <option value={Role.CHEF_DIVISION}>Chef de Division</option>
                                    </select>
                                </div>
                                <div>
                                    <Input 
                                        label="Quantité" 
                                        id="quantity" 
                                        type="number" 
                                        value={quantity.toString()} 
                                        onChange={e => setQuantity(parseInt(e.target.value) || 0)} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <Input 
                                        label="Unité" 
                                        id="unit" 
                                        value={unit} 
                                        onChange={e => setUnit(e.target.value)} 
                                        placeholder="ex: rames, pièces, boîtes"
                                        required 
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input 
                                        label="Description (optionnel)" 
                                        id="description" 
                                        value={description} 
                                        onChange={e => setDescription(e.target.value)} 
                                        placeholder="Description détaillée de la ressource"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input 
                                        label="Notes (optionnel)" 
                                        id="notes" 
                                        value={notes} 
                                        onChange={e => setNotes(e.target.value)} 
                                        placeholder="Notes supplémentaires"
                                    />
                                </div>
                                <div className="md:col-span-2 text-right">
                                    <Button onClick={handleCreateOrder} disabled={resourceOrdersLoading}>
                                        {resourceOrdersLoading ? 'Distribution...' : 'Distribuer vers la Division'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            {canCreateOrders ? 'Ressources Distribuées' : 'Ressources Reçues'}
                        </h3>
                        <div className="flex items-center space-x-4 mb-4">
                            <label htmlFor="statusFilter" className="block text-sm font-medium">Filtrer par statut</label>
                            <select 
                                id="statusFilter"
                                value={statusFilter} 
                                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">Tous</option>
                                <option value={ResourceOrderStatus.EN_ATTENTE}>En attente</option>
                                <option value={ResourceOrderStatus.LIVRE}>Livré</option>
                                <option value={ResourceOrderStatus.RECU}>Reçu</option>
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            {resourceOrders.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400">
                                    {canCreateOrders ? 'Aucune ressource distribuée.' : 'Aucune ressource reçue.'}
                                </p>
                            ) : (
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Ressource</th>
                                            <th className="px-6 py-3">Quantité</th>
                                            <th className="px-6 py-3">{canCreateOrders ? 'Division' : 'Demandeur'}</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Statut</th>
                                            <th className="px-6 py-3">Description</th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resourceOrders.map(order => (
                                            <tr key={order.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                <td className="px-6 py-4 font-medium">
                                                    {getResourceTypeDisplayName(order.resourceType)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.quantity} {order.unit}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {canCreateOrders ? order.targetDivision : order.requestedByRole}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                                                </td>
                                                <td className={`px-6 py-4 font-medium ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate">
                                                    {order.description || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {canDeliver && order.status === 'En attente' && (
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleDeliver(order.id)}
                                                            className="mr-2"
                                                        >
                                                            Livrer
                                                        </Button>
                                                    )}
                                                    {canConfirmReceipt && order.status === 'Livré' && (
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleConfirmReceipt(order.id)}
                                                            variant="secondary"
                                                        >
                                                            Confirmer réception
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <span>Page {currentPage} sur {Math.ceil(resourceOrdersTotal / ordersPerPage)}</span>
                            <div className="flex space-x-2">
                                <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    Précédent
                                </Button>
                                <Button onClick={() => setCurrentPage(p => Math.min(Math.ceil(resourceOrdersTotal / ordersPerPage), p + 1))} disabled={currentPage === Math.ceil(resourceOrdersTotal / ordersPerPage)}>
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-right">
                    <Button onClick={onClose}>Fermer</Button>
                </div>
            </Card>
        </div>
    );
};

export default ResourceManagementModal;