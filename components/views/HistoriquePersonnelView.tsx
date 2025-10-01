import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Personnel, PersonnelHistory, Role } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

interface HistoriqueItem {
  personnelId: string;
  personnelName: string;
  division: Role;
  affectation: string;
  startDate: string;
  endDate: string | null;
  isCurrentAssignment: boolean;
}

const HistoriquePersonnelView: React.FC = () => {
  const { personnel, fetchPersonnel, personnelLoading, personnelError } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState<Role | ''>('');
  const [sortBy, setSortBy] = useState<'name' | 'division' | 'startDate'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    console.log('HistoriquePersonnelView: fetching personnel');
    fetchPersonnel();
  }, [fetchPersonnel]);

  // Logs de débogage
  console.log('HistoriquePersonnelView - Personnel data:', personnel);
  console.log('HistoriquePersonnelView - Personnel loading:', personnelLoading);
  console.log('HistoriquePersonnelView - Personnel error:', personnelError);

  // Transformer les données du personnel en historique plat
  const historiqueItems: HistoriqueItem[] = personnel.flatMap(p => 
    (p.history || []).map((h: PersonnelHistory) => ({
      personnelId: p.id,
      personnelName: p.name,
      division: h.division,
      affectation: h.affectation,
      startDate: h.startDate,
      endDate: h.endDate,
      isCurrentAssignment: h.endDate === null
    }))
  );

  // Filtrage et tri
  const filteredHistorique = historiqueItems
    .filter(item => {
      const matchesSearch = item.personnelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.affectation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = !filterDivision || item.division === filterDivision;
      return matchesSearch && matchesDivision;
    })
    .sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'name':
          compareValue = a.personnelName.localeCompare(b.personnelName);
          break;
        case 'division':
          compareValue = a.division.localeCompare(b.division);
          break;
        case 'startDate':
          compareValue = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDurationText = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} an${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` et ${remainingMonths} mois` : ''}`;
    }
  };

  if (personnelLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Historique du Personnel</h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">Chargement...</div>
        </div>
      </div>
    );
  }

  if (personnelError) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Historique du Personnel</h1>
        <Card>
          <div className="text-center text-red-600 dark:text-red-400">
            Erreur: {personnelError}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Historique du Personnel</h1>

      {/* Filtres et contrôles */}
      <Card>
        <h2 className="text-xl font-bold mb-4">Filtres et Recherche</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Rechercher"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom ou affectation..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Division
            </label>
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value as Role | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Toutes les divisions</option>
              {Object.values(Role).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'division' | 'startDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="startDate">Date de début</option>
              <option value="name">Nom</option>
              <option value="division">Division</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ordre
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Total des entrées</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {filteredHistorique.length}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold mb-2">Affectations actuelles</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {filteredHistorique.filter(h => h.isCurrentAssignment).length}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold mb-2">Personnel actif</h3>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {new Set(filteredHistorique.filter(h => h.isCurrentAssignment).map(h => h.personnelId)).size}
          </p>
        </Card>
      </div>

      {/* Tableau de l'historique */}
      <Card>
        <h2 className="text-xl font-bold mb-4">
          Historique Complet ({filteredHistorique.length} entrées)
        </h2>
        
        {filteredHistorique.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucun historique trouvé avec les filtres actuels.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Nom du Personnel</th>
                  <th className="px-6 py-3">Division</th>
                  <th className="px-6 py-3">Affectation</th>
                  <th className="px-6 py-3">Date de début</th>
                  <th className="px-6 py-3">Date de fin</th>
                  <th className="px-6 py-3">Durée</th>
                  <th className="px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistorique.map((item, index) => (
                  <tr key={`${item.personnelId}-${item.startDate}-${index}`} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {item.personnelName}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{item.division}</Badge>
                    </td>
                    <td className="px-6 py-4">{item.affectation}</td>
                    <td className="px-6 py-4">{formatDate(item.startDate)}</td>
                    <td className="px-6 py-4">
                      {item.endDate ? formatDate(item.endDate) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getDurationText(item.startDate, item.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      {item.isCurrentAssignment ? (
                        <Badge variant="success">Actuel</Badge>
                      ) : (
                        <Badge variant="secondary">Terminé</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HistoriquePersonnelView;