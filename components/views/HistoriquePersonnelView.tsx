import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import Card from '../ui/Card';

const HistoriquePersonnelView: React.FC = () => {
  const { personnel } = useAppStore();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Historique du Personnel</h1>
      {personnel.map(p => (
        <Card key={p.id}>
          <h2 className="text-xl font-bold mb-4">{p.name}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Division</th>
                  <th className="px-6 py-3">Affectation</th>
                  <th className="px-6 py-3">Date de début</th>
                  <th className="px-6 py-3">Date de fin</th>
                </tr>
              </thead>
              <tbody>
                {p.history.map((h, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">{h.division}</td>
                    <td className="px-6 py-4">{h.affectation}</td>
                    <td className="px-6 py-4">{new Date(h.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{h.endDate ? new Date(h.endDate).toLocaleDateString() : 'En cours'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default HistoriquePersonnelView;
