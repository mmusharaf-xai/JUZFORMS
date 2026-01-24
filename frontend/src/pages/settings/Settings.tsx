import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { authApi, statsApi, formsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Stats, Form } from '@/types';
import { FileText, Send, Database, User, Lock, BarChart3, Archive } from 'lucide-react';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [archivesTab, setArchivesTab] = useState('forms');

  // Stats
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete account
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Archives
  const [archivedForms, setArchivedForms] = useState<Form[]>([]);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingArchives, setIsLoadingArchives] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalForms, setTotalForms] = useState(0);

  // Archive action states (DRY principle)
  const [actionOpenedType, setActionOpenedType] = useState<'DELETE' | 'RESTORE' | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'stats') {
      statsApi.getStats().then((res) => {
        setStats(res.data.stats);
        setStatsLoading(false);
      }).catch(() => {
        setStatsLoading(false);
      });
    }
  }, [activeTab, user?.id]);

  const loadArchivedForms = async (page = 1, search = '') => {
    setIsLoadingArchives(true);
    try {
      const response = await formsApi.getDeletedForms({
        search: search.trim(),
        page,
        limit: 10,
      });
      setArchivedForms(response.data.forms);
      setTotalPages(response.data.pagination.pages);
      setTotalForms(response.data.pagination.total);
      setCurrentPage(page);

      // Reset selection state when search changes or loading new data
      if (search !== searchTerm) {
        setSelectedForms([]);
        setSelectedAll(false);
      }
    } catch (error) {
      console.error('Failed to load archived forms:', error);
      setArchivedForms([]);
      setTotalPages(1);
      setTotalForms(0);
      setSelectedForms([]);
      setSelectedAll(false);
    } finally {
      setIsLoadingArchives(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'archives' && archivesTab === 'forms') {
      loadArchivedForms(1, searchTerm);
    }
  }, [activeTab, archivesTab, user?.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsUpdatingProfile(true);

    try {
      const response = await authApi.updateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
      });
      updateUser(response.data.user);
      setProfileSuccess(t('settings.profileUpdated'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setProfileError(error.response?.data?.error || t('errors.failedToUpdate'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(t('auth.passwordMismatch'));
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError(t('auth.passwordMinLength'));
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await authApi.updateProfile({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordSuccess(t('settings.passwordUpdated'));
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setPasswordError(error.response?.data?.error || t('errors.failedToUpdate'));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      return;
    }

    setIsDeleting(true);

    try {
      await authApi.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Archives handlers
  const filteredForms = archivedForms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectForm = (formId: string, checked: boolean) => {
    if (checked) {
      setSelectedForms(prev => {
        const newSelected = [...prev, formId];
        // Check if all items across all pages are now selected
        if (newSelected.length === totalForms) {
          setSelectedAll(true);
        }
        return newSelected;
      });
    } else {
      setSelectedForms(prev => {
        const newSelected = prev.filter(id => id !== formId);
        // If we deselected anything, selectedAll becomes false
        setSelectedAll(false);
        return newSelected;
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (archivedForms.length === totalForms) {
        // If all forms are visible on current page, select all globally
        setSelectedAll(true);
        setSelectedForms(archivedForms.map(form => form.id));
      } else {
        // Just select all visible forms on current page
        setSelectedForms(prev => {
          const currentPageIds = archivedForms.map(form => form.id);
          const newSelected = [...new Set([...prev, ...currentPageIds])];
          // Don't set selectedAll to true if there are more pages
          return newSelected;
        });
      }
    } else {
      // Deselect all visible forms on current page
      setSelectedForms(prev => prev.filter(id => !archivedForms.some(form => form.id === id)));
      setSelectedAll(false);
    }
  };

  const handleRestore = () => {
    if (selectedForms.length > 0) {
      setActionOpenedType('RESTORE');
    }
  };

  const handleDelete = () => {
    if (selectedForms.length > 0) {
      setActionOpenedType('DELETE');
    }
  };

  const confirmAction = async () => {
    if (!actionOpenedType) return;

    setIsActionLoading(true);
    try {
      let formIdsToProcess: string[];

      if (selectedAll) {
        // If all forms are selected, we need to get all form IDs matching the current search
        // For now, fetch all pages to get all IDs (this could be optimized with a backend endpoint)
        const allFormIds: string[] = [];
        let page = 1;
        let hasMorePages = true;

        while (hasMorePages) {
          const response = await formsApi.getDeletedForms({
            search: searchTerm.trim(),
            page,
            limit: 100, // Fetch more per page to minimize requests
          });

          allFormIds.push(...response.data.forms.map((form: Form) => form.id));
          hasMorePages = page < response.data.pagination.pages;
          page++;
        }

        formIdsToProcess = allFormIds;
      } else {
        formIdsToProcess = selectedForms;
      }

      if (actionOpenedType === 'RESTORE') {
        await Promise.all(formIdsToProcess.map(id => formsApi.restoreForm(id)));
      } else if (actionOpenedType === 'DELETE') {
        await Promise.all(formIdsToProcess.map(id => formsApi.permanentDeleteForm(id)));
      }

      // Reset selection state
      setSelectedForms([]);
      setSelectedAll(false);
      setActionOpenedType(null);

      // Reload archived forms with current search and page
      await loadArchivedForms(currentPage, searchTerm);
    } catch (error) {
      console.error(`Failed to ${actionOpenedType.toLowerCase()} forms:`, error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'archives' && archivesTab === 'forms') {
        loadArchivedForms(1, searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    loadArchivedForms(page, searchTerm);
  };

  // Get the effective selected count (either selected forms or all forms if selectedAll)
  const getSelectedCount = () => {
    return selectedAll ? totalForms : selectedForms.length;
  };

  const statCards = [
    {
      title: t('stats.formsCreated'),
      value: stats?.forms_created || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('stats.formSubmissions'),
      value: stats?.forms_submitted || 0,
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('stats.databasesCreated'),
      value: stats?.databases_created || 0,
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-gray-500">{t('settings.subtitle')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.profile')}</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.password')}</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.stats')}</span>
            </TabsTrigger>
            <TabsTrigger value="archives" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.archives')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profileInfo')}</CardTitle>
                <CardDescription>{t('settings.profileInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {profileError && (
                    <Alert variant="destructive">
                      <AlertDescription>{profileError}</AlertDescription>
                    </Alert>
                  )}
                  {profileSuccess && (
                    <Alert variant="success">
                      <AlertDescription>{profileSuccess}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                      <Input
                        id="firstName"
                        value={profileForm.first_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, first_name: e.target.value })
                        }
                        placeholder={t('auth.firstName')}
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                      <Input
                        id="lastName"
                        value={profileForm.last_name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, last_name: e.target.value })
                        }
                        placeholder={t('auth.lastName')}
                        className="h-11"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input 
                      id="email"
                      value={user?.email || ''} 
                      disabled 
                      className="h-11 bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">{t('settings.emailCannotChange')}</p>
                  </div>
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile && <Spinner className="mr-2" size="sm" />}
                    {isUpdatingProfile ? t('settings.savingChanges') : t('settings.saveChanges')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone Card - Delete Account */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">{t('settings.dangerZone')}</CardTitle>
                <CardDescription>
                  {t('settings.dangerZoneDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{t('settings.deleteAccount')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.deleteAccountDesc')}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="shrink-0"
                  >
                    {t('settings.deleteAccount')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.changePassword')}</CardTitle>
                <CardDescription>{t('settings.changePasswordDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  {passwordSuccess && (
                    <Alert variant="success">
                      <AlertDescription>{passwordSuccess}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('auth.currentPassword')}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.old_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, old_password: e.target.value })
                      }
                      placeholder={t('auth.currentPassword')}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                      placeholder={t('auth.newPassword')}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                      }
                      placeholder={t('auth.confirmPassword')}
                      className="h-11"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword && <Spinner className="mr-2" size="sm" />}
                    {isUpdatingPassword ? t('settings.updatingPassword') : t('settings.updatePassword')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statsLoading ? (
                [1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                statCards.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.title}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
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
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="archives" className="mt-6">
            <Tabs value={archivesTab} onValueChange={setArchivesTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="forms">{t('archives.forms')}</TabsTrigger>
                <TabsTrigger value="databases">{t('archives.databases')}</TabsTrigger>
              </TabsList>

              <TabsContent value="forms" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('archives.deletedForms')}</CardTitle>
                    <CardDescription>{t('archives.deletedFormsDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <Input
                        placeholder={t('archives.searchForms')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleSelectAll(true)}
                          disabled={archivedForms.length === 0}
                        >
                          {selectedAll ? t('archives.allSelected') : t('archives.selectAll')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSelectAll(false)}
                          disabled={selectedForms.length === 0 && !selectedAll}
                        >
                          {t('archives.deselectAll')}
                        </Button>
                        <Button
                          onClick={handleRestore}
                          disabled={getSelectedCount() === 0 || isActionLoading}
                        >
                          {isActionLoading && actionOpenedType === 'RESTORE' && <Spinner className="mr-2" size="sm" />}
                          {isActionLoading && actionOpenedType === 'RESTORE' ? t('common.loading') : t('archives.restore')}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={getSelectedCount() === 0 || isActionLoading}
                        >
                          {isActionLoading && actionOpenedType === 'DELETE' && <Spinner className="mr-2" size="sm" />}
                          {isActionLoading && actionOpenedType === 'DELETE' ? t('common.loading') : t('archives.delete')}
                        </Button>
                      </div>
                    </div>

                    {isLoadingArchives ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                      </div>
                    ) : archivedForms.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchTerm ? t('archives.noFormsMatch') : t('archives.noDeletedForms')}
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedAll || (archivedForms.length > 0 && archivedForms.every(form => selectedForms.includes(form.id)))}
                                  onCheckedChange={handleSelectAll}
                                />
                              </TableHead>
                              <TableHead>{t('common.name')}</TableHead>
                              <TableHead>{t('common.createdAt')}</TableHead>
                              <TableHead>{t('common.updatedAt')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {archivedForms.map((form) => (
                              <TableRow key={form.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedAll || selectedForms.includes(form.id)}
                                    onCheckedChange={(checked) => handleSelectForm(form.id, checked as boolean)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{form.name}</TableCell>
                                <TableCell>{new Date(form.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(form.updated_at).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                              {t('common.showing')} {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalForms)} {t('common.of')} {totalForms} {t('archives.forms')}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isLoadingArchives}
                              >
                                {t('common.previous')}
                              </Button>

                              {/* Page numbers */}
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNum;
                                  if (totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                  } else {
                                    pageNum = currentPage - 2 + i;
                                  }

                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={currentPage === pageNum ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handlePageChange(pageNum)}
                                      disabled={isLoadingArchives}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || isLoadingArchives}
                              >
                                {t('common.next')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="databases" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('archives.deletedDatabases')}</CardTitle>
                    <CardDescription>{t('archives.deletedDatabasesDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      {t('archives.noDeletedDatabases')}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Delete Account Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !isDeleting && setIsDeleteDialogOpen(open)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('settings.deleteAccount')}</DialogTitle>
              <DialogDescription className="pt-2">
                {t('settings.deleteAccountConfirm')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deleteConfirmation">{t('settings.typeDeleteConfirm')}</Label>
                <Input
                  id="deleteConfirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="h-11"
                  disabled={isDeleting}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
              >
                {isDeleting && <Spinner className="mr-2" size="sm" />}
                {isDeleting ? t('settings.deleting') : t('settings.deleteAccount')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Action Confirmation Dialog */}
        <Dialog open={actionOpenedType !== null} onOpenChange={(open) => !isActionLoading && !open && setActionOpenedType(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionOpenedType === 'RESTORE' ? t('archives.restoreForms') : t('archives.deleteForms')}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {actionOpenedType === 'RESTORE'
                  ? t('archives.restoreFormsConfirm', { count: getSelectedCount() })
                  : t('archives.deleteFormsConfirm', { count: getSelectedCount() })
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setActionOpenedType(null)}
                disabled={isActionLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant={actionOpenedType === 'DELETE' ? 'destructive' : 'default'}
                onClick={confirmAction}
                disabled={isActionLoading}
              >
                {isActionLoading && <Spinner className="mr-2" size="sm" />}
                {isActionLoading
                  ? t('common.loading')
                  : actionOpenedType === 'RESTORE'
                    ? t('archives.restore')
                    : t('archives.delete')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Settings;
