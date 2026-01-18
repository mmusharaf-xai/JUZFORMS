import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import type { Form } from '@/types';
import { Plus, Edit, Trash2, Eye, ExternalLink, FileText } from 'lucide-react';

const FormsListing: React.FC = () => {
  const { t } = useTranslation();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [formName, setFormName] = useState('');
  const [error, setError] = useState('');
  
  // Loading states for individual operations
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const navigate = useNavigate();

  const fetchForms = async () => {
    try {
      const response = await formsApi.getForms();
      setForms(response.data.forms);
    } catch (err) {
      console.error('Failed to fetch forms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreateForm = async () => {
    if (!formName.trim()) {
      setError(t('forms.formNameRequired'));
      return;
    }

    setIsCreating(true);
    try {
      const response = await formsApi.createForm({ name: formName });
      setIsCreateDialogOpen(false);
      setFormName('');
      setError('');
      navigate(`/forms/${response.data.form.id}/configure`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.failedToCreate'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditFormName = async () => {
    if (!formName.trim() || !selectedForm) {
      setError(t('forms.formNameRequired'));
      return;
    }

    setIsEditing(true);
    try {
      await formsApi.updateForm(selectedForm.id, { name: formName });
      setIsEditDialogOpen(false);
      setFormName('');
      setError('');
      fetchForms();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || t('errors.failedToUpdate'));
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteForm = async () => {
    if (!selectedForm) return;

    setIsDeleting(true);
    try {
      await formsApi.deleteForm(selectedForm.id);
      setIsDeleteDialogOpen(false);
      setSelectedForm(null);
      fetchForms();
    } catch (err) {
      console.error('Failed to delete form:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (form: Form) => {
    setSelectedForm(form);
    setFormName(form.name);
    setError('');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (form: Form) => {
    setSelectedForm(form);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('forms.title')}</h1>
            <p className="text-gray-500">{t('forms.subtitle')}</p>
          </div>
          <Button onClick={() => { setFormName(''); setError(''); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('forms.createForm')}
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
        ) : forms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{t('forms.noForms')}</p>
              <Button onClick={() => { setFormName(''); setError(''); setIsCreateDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('forms.createForm')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{form.name}</CardTitle>
                        <CardDescription>
                          {form.is_published ? (
                            <span className="text-green-600 font-medium">{t('forms.published')}</span>
                          ) : (
                            <span className="text-yellow-600 font-medium">{t('forms.draft')}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/forms/${form.id}/configure`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common.edit')}
                    </Button>
                    {form.is_published && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/form/${form.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {t('forms.view')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/forms/${form.id}/submissions`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('forms.submissions')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(form)}
                    >
                      {t('forms.rename')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => openDeleteDialog(form)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Form Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !isCreating && setIsCreateDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('forms.createNew')}</DialogTitle>
              <DialogDescription>{t('forms.uniqueNameHint')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                <Label htmlFor="formName">{t('forms.formName')}</Label>
                <Input
                  id="formName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('forms.enterFormName')}
                  onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreateForm()}
                  disabled={isCreating}
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateForm} disabled={isCreating}>
                {isCreating && <Spinner className="mr-2" size="sm" />}
                {isCreating ? t('common.loading') : t('common.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Form Name Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !isEditing && setIsEditDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('forms.renameForm')}</DialogTitle>
              <DialogDescription>{t('forms.uniqueNameHint')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                <Label htmlFor="editFormName">{t('forms.formName')}</Label>
                <Input
                  id="editFormName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('forms.enterFormName')}
                  onKeyDown={(e) => e.key === 'Enter' && !isEditing && handleEditFormName()}
                  disabled={isEditing}
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isEditing}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleEditFormName} disabled={isEditing}>
                {isEditing && <Spinner className="mr-2" size="sm" />}
                {isEditing ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !isDeleting && setIsDeleteDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('forms.deleteForm')}</DialogTitle>
              <DialogDescription className="pt-2">
                {t('forms.deleteFormConfirm', { name: selectedForm?.name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteForm} disabled={isDeleting}>
                {isDeleting && <Spinner className="mr-2" size="sm" />}
                {isDeleting ? t('common.loading') : t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default FormsListing;
