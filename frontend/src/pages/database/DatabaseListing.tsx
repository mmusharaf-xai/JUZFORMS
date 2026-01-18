import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { databaseApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/types';
import { Plus, Edit, Trash2, Database as DatabaseIcon } from 'lucide-react';
import { format } from 'date-fns';

const DatabaseListing: React.FC = () => {
  const { t } = useTranslation();
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [databaseName, setDatabaseName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDatabases = async () => {
    try {
      const response = await databaseApi.getDatabases();
      setDatabases(response.data.databases);
    } catch (err) {
      console.error('Failed to fetch databases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleCreateDatabase = async () => {
    if (!databaseName.trim()) {
      setError(t('database.databaseNameRequired'));
      return;
    }

    try {
      await databaseApi.createDatabase({ name: databaseName });
      setIsCreateDialogOpen(false);
      setDatabaseName('');
      setError('');
      fetchDatabases();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.failedToCreate'));
    }
  };

  const handleEditDatabase = async () => {
    if (!databaseName.trim() || !selectedDatabase) {
      setError(t('database.databaseNameRequired'));
      return;
    }

    try {
      await databaseApi.updateDatabase(selectedDatabase.id, { name: databaseName });
      setIsEditDialogOpen(false);
      setDatabaseName('');
      setError('');
      fetchDatabases();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.failedToUpdate'));
    }
  };

  const handleDeleteDatabase = async () => {
    if (!selectedDatabase) return;

    try {
      await databaseApi.deleteDatabase(selectedDatabase.id);
      setIsDeleteDialogOpen(false);
      setSelectedDatabase(null);
      fetchDatabases();
    } catch (err) {
      console.error('Failed to delete database:', err);
    }
  };

  const openEditDialog = (database: Database) => {
    setSelectedDatabase(database);
    setDatabaseName(database.name);
    setError('');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (database: Database) => {
    setSelectedDatabase(database);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('database.title')}</h1>
            <p className="text-gray-500">{t('database.subtitle')}</p>
          </div>
          <Button onClick={() => { setDatabaseName(''); setError(''); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('database.createDatabase')}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : databases.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <DatabaseIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{t('database.noDatabases')}</p>
              <Button onClick={() => { setDatabaseName(''); setError(''); setIsCreateDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('database.createDatabase')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.map((database) => (
              <Card 
                key={database.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/databases/${database.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <DatabaseIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{database.name}</CardTitle>
                        <CardDescription>
                          Created {format(new Date(database.created_at), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(database);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t('forms.rename')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(database);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Database Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('database.createNew')}</DialogTitle>
              <DialogDescription>{t('database.uniqueNameHint')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="databaseName">{t('database.databaseName')}</Label>
                <Input
                  id="databaseName"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder={t('database.enterDatabaseName')}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateDatabase()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateDatabase}>{t('common.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Database Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('database.renameDatabase')}</DialogTitle>
              <DialogDescription>{t('database.uniqueNameHint')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="editDatabaseName">{t('database.databaseName')}</Label>
                <Input
                  id="editDatabaseName"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder={t('database.enterDatabaseName')}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditDatabase()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleEditDatabase}>{t('common.save')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('database.deleteDatabase')}</DialogTitle>
              <DialogDescription>
                {t('database.deleteDatabaseConfirm', { name: selectedDatabase?.name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteDatabase}>
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default DatabaseListing;
