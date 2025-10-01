
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Personnel, Role, PersonnelHistory } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';

const PersonnelManagement: React.FC = () => {
  const { personnel, addPersonnel, updatePersonnel, deletePersonnel } = useAppStore();
  const [newPersonnel, setNewPersonnel] = useState<{ name: string; division: Role; affectation: string }>({ name: '', division: Role.ACCUEIL, affectation: '' });
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  const handleAddPersonnel = () => {
    if (newPersonnel.name && newPersonnel.affectation) {
      const newPersonnelWithHistory: Omit<Personnel, 'id'> = {
        ...newPersonnel,
        history: [
          {
            ...newPersonnel,
            startDate: new Date().toISOString(),
            endDate: null,
          },
        ],
      };
      addPersonnel(newPersonnelWithHistory);
      setNewPersonnel({ name: '', division: Role.ACCUEIL, affectation: '' });
    }
  };

  const handleUpdatePersonnel = () => {
    if (editingPersonnel) {
      const now = new Date().toISOString();
      const latestHistory = editingPersonnel.history[editingPersonnel.history.length - 1];

      let newHistory: PersonnelHistory[] = [...editingPersonnel.history];

      if (latestHistory.division !== editingPersonnel.division || latestHistory.affectation !== editingPersonnel.affectation) {
        // End the current assignment
        newHistory[newHistory.length - 1] = { ...latestHistory, endDate: now };
        // Add the new assignment
        newHistory.push({
          division: editingPersonnel.division,
          affectation: editingPersonnel.affectation,
          startDate: now,
          endDate: null,
        });
      }
      
      const updatedPersonnel = {
        ...editingPersonnel,
        history: newHistory,
      };

      updatePersonnel(editingPersonnel.id, updatedPersonnel);
      setEditingPersonnel(null);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Gestion du Personnel</h1>
      <Card>
        <h2 className="text-xl font-bold mb-4">Ajouter un nouveau personnel</h2>
        <div className="flex space-x-4">
          <Input
            label="Nom"
            value={newPersonnel.name}
            onChange={(e) => setNewPersonnel({ ...newPersonnel, name: e.target.value })}
          />
          <Input
            label="Affectation"
            value={newPersonnel.affectation}
            onChange={(e) => setNewPersonnel({ ...newPersonnel, affectation: e.target.value })}
          />
          <select
            value={newPersonnel.division}
            onChange={(e) => setNewPersonnel({ ...newPersonnel, division: e.target.value as Role })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            {Object.values(Role).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <Button onClick={handleAddPersonnel}>Ajouter</Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold mb-4">Liste du personnel</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Nom</th>
                <th className="px-6 py-3">Division Actuelle</th>
                <th className="px-6 py-3">Affectation Actuelle</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4">{p.name}</td>
                  <td className="px-6 py-4">{p.division}</td>
                  <td className="px-6 py-4">{p.affectation}</td>
                  <td className="px-6 py-4 flex space-x-2">
                    <Button onClick={() => setEditingPersonnel(p)}>Modifier</Button>
                    <Button variant="danger" onClick={() => deletePersonnel(p.id)}>Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editingPersonnel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Modifier le personnel</h2>
            <div className="space-y-4">
              <Input
                label="Nom"
                value={editingPersonnel.name}
                onChange={(e) => setEditingPersonnel({ ...editingPersonnel, name: e.target.value })}
              />
              <Input
                label="Affectation"
                value={editingPersonnel.affectation}
                onChange={(e) => setEditingPersonnel({ ...editingPersonnel, affectation: e.target.value })}
              />
              <select
                value={editingPersonnel.division}
                onChange={(e) => setEditingPersonnel({ ...editingPersonnel, division: e.target.value as Role })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                {Object.values(Role).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="secondary" onClick={() => setEditingPersonnel(null)}>Annuler</Button>
              <Button onClick={handleUpdatePersonnel}>Enregistrer</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PersonnelManagement;
