import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Form, FormSubmission } from '@/types';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';

const FormSubmissions: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [formResponse, submissionsResponse] = await Promise.all([
          formsApi.getForm(id),
          formsApi.getFormSubmissions(id),
        ]);
        setForm(formResponse.data.form);
        setSubmissions(submissionsResponse.data.submissions);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const exportToCsv = () => {
    if (!form || submissions.length === 0) return;

    const headers = [t('formSubmissions.submittedAt'), ...form.fields.map((f) => f.label)];
    const rows = submissions.map((sub) => {
      const row = [format(new Date(sub.created_at), 'yyyy-MM-dd HH:mm:ss')];
      form.fields.forEach((field) => {
        const value = sub.data[field.id];
        row.push(typeof value === 'object' ? JSON.stringify(value) : String(value || ''));
      });
      return row;
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.name}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/forms')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            <h1 className="text-xl font-bold">{form?.name} - {t('formSubmissions.title')}</h1>
          </div>
          {submissions.length > 0 && (
            <Button variant="outline" onClick={exportToCsv}>
              <Download className="h-4 w-4 mr-2" />
              {t('formSubmissions.exportCsv')}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('formSubmissions.title')} ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {t('formSubmissions.noSubmissions')}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('formSubmissions.submittedAt')}</TableHead>
                      {form?.fields.map((field) => (
                        <TableHead key={field.id}>{field.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          {format(new Date(submission.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        {form?.fields.map((field) => (
                          <TableCell key={field.id}>
                            {typeof submission.data[field.id] === 'object'
                              ? JSON.stringify(submission.data[field.id])
                              : String(submission.data[field.id] || '-')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FormSubmissions;
