
import React, { useMemo } from 'react';
import { Dossier, DossierStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from './ui/Card';

interface KPIChartsProps {
  dossiers: Dossier[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const KPICharts: React.FC<KPIChartsProps> = ({ dossiers }) => {
  const kpis = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const paidDossiers = dossiers.filter(d => d.status === DossierStatus.PAYE && d.paymentDate);

    const totalToday = paidDossiers
      .filter(d => new Date(d.paymentDate!).toDateString() === new Date().toDateString())
      .reduce((sum, d) => sum + (d.amountDue || 0), 0);

    const totalWeek = paidDossiers
      .filter(d => new Date(d.paymentDate!) >= startOfWeek)
      .reduce((sum, d) => sum + (d.amountDue || 0), 0);
      
    const totalMonth = paidDossiers
      .filter(d => new Date(d.paymentDate!) >= startOfMonth)
      .reduce((sum, d) => sum + (d.amountDue || 0), 0);

    const statusCounts = dossiers.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, {} as Record<DossierStatus, number>);
    
    const pieChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const processingTimes = dossiers
        .filter(d => d.status === DossierStatus.PAYE && d.creationDate && d.paymentDate)
        .map(d => (new Date(d.paymentDate!).getTime() - new Date(d.creationDate).getTime()) / (1000 * 60 * 60 * 24)); // in days
    
    const avgProcessingTime = processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0;


    return { totalToday, totalWeek, totalMonth, pieChartData, avgProcessingTime };
  }, [dossiers]);

  const dailyData = useMemo(() => {
    const data: { [key: string]: number } = {};
    const paidDossiers = dossiers.filter(d => d.status === DossierStatus.PAYE && d.paymentDate);
    paidDossiers.forEach(d => {
        const date = new Date(d.paymentDate!).toLocaleDateString('fr-CA'); // YYYY-MM-DD
        data[date] = (data[date] || 0) + (d.amountDue || 0);
    });
    return Object.entries(data).map(([date, total]) => ({ date, total })).sort((a,b) => a.date.localeCompare(b.date)).slice(-30); // last 30 days
  }, [dossiers]);

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <h3 className="text-gray-500 dark:text-gray-400">Total perçu (Aujourd'hui)</h3>
                <p className="text-3xl font-bold">{kpis.totalToday.toLocaleString('fr-FR')} Ar</p>
            </Card>
            <Card>
                <h3 className="text-gray-500 dark:text-gray-400">Total perçu (Semaine)</h3>
                <p className="text-3xl font-bold">{kpis.totalWeek.toLocaleString('fr-FR')} Ar</p>
            </Card>
            <Card>
                <h3 className="text-gray-500 dark:text-gray-400">Total perçu (Mois)</h3>
                <p className="text-3xl font-bold">{kpis.totalMonth.toLocaleString('fr-FR')} Ar</p>
            </Card>
            <Card>
                <h3 className="text-gray-500 dark:text-gray-400">Temps de traitement moyen</h3>
                <p className="text-3xl font-bold">{kpis.avgProcessingTime.toFixed(1)} jours</p>
            </Card>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold mb-4">Répartition des dossiers par statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={kpis.pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                 {kpis.pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="font-bold mb-4">Montants perçus par jour (30 derniers jours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('fr-FR').format(value as number)} />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} Ar`} />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" name="Total Perçu" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default KPICharts;
