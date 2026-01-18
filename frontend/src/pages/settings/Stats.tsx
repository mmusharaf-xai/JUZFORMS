import React, { useEffect, useState } from 'react';
import { statsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Stats as StatsType } from '@/types';
import { FileText, Send, Database } from 'lucide-react';

const Stats: React.FC = () => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsApi.getStats();
        setStats(response.data.stats);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Forms Created',
      value: stats?.forms_created || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Form Submissions',
      value: stats?.forms_submitted || 0,
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Databases Created',
      value: stats?.databases_created || 0,
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Statistics</h1>
          <p className="text-gray-500">Overview of your account activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Stats;
