import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { authApi, statsApi, formsApi, databaseApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import type { Stats, Form, Database, DatabaseRow, DatabaseColumn } from '@/types';
import { FileText, Send, Database as DatabaseIcon, User, Lock, BarChart3, Archive, Filter, X, Plus } from 'lucide-react';

interface FilterState {
  column: string;
  operator: string;
  value: string;
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [archivesTab, setArchivesTab] = useState('forms');
  const [databasesArchivesTab, setDatabasesArchivesTab] = useState('databases');

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
  const [selectedAllForms, setSelectedAllForms] = useState(false);
  const [searchTermForms, setSearchTermForms] = useState('');
  const [isLoadingArchives, setIsLoadingArchives] = useState(false);
  const [currentPageForms, setCurrentPageForms] = useState(1);
  const [totalPagesForms, setTotalPagesForms] = useState(1);
  const [totalForms, setTotalForms] = useState(0);

  // Database Archives
  const [archivedDatabases, setArchivedDatabases] = useState<Database[]>([]);
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  const [selectedAllDatabases, setSelectedAllDatabases] = useState(false);
  const [searchTermDatabases, setSearchTermDatabases] = useState('');
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [currentPageDatabases, setCurrentPageDatabases] = useState(1);
  const [totalPagesDatabases, setTotalPagesDatabases] = useState(1);
  const [totalDatabases, setTotalDatabases] = useState(0);

  // Database Rows Archives
  const [databasesWithDeletedRows, setDatabasesWithDeletedRows] = useState<Database[]>([]);
  const [selectedRowsDatabase, setSelectedRowsDatabase] = useState<Database | null>(null);
  const [archivedRowsColumns, setArchivedRowsColumns] = useState<DatabaseColumn[]>([]);
  const [archivedRows, setArchivedRows] = useState<DatabaseRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedAllRows, setSelectedAllRows] = useState(false);
  const [searchTermRowsDatabases, setSearchTermRowsDatabases] = useState('');
  const [searchTermRows, setSearchTermRows] = useState('');
  const [filtersRows, setFiltersRows] = useState<FilterState[]>([]);
  const [tempFiltersRows, setTempFiltersRows] = useState<FilterState[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [isLoadingRowsDatabases, setIsLoadingRowsDatabases] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [currentPageRowsDatabases, setCurrentPageRowsDatabases] = useState(1);
  const [currentPageRows, setCurrentPageRows] = useState(1);
  const [totalPagesRowsDatabases, setTotalPagesRowsDatabases] = useState(1);
  const [totalPagesRows, setTotalPagesRows] = useState(1);
  const [totalRowsDatabases, setTotalRowsDatabases] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  // Archive action states (DRY principle)
  const [actionOpenedType, setActionOpenedType] = useState<'DELETE' | 'RESTORE' | null>(null);
  const [currentArchiveType, setCurrentArchiveType] = useState<'forms' | 'databases' | 'rows' | null>(null);
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
      setTotalPagesForms(response.data.pagination.pages);
      setTotalForms(response.data.pagination.total);
      setCurrentPageForms(page);

      // Reset selection state when search changes
      if (search !== searchTermForms) {
        setSelectedForms([]);
        setSelectedAllForms(false);
      }
    } catch (error) {
      console.error('Failed to load archived forms:', error);
      setArchivedForms([]);
      setTotalPagesForms(1);
      setTotalForms(0);
      setSelectedForms([]);
      setSelectedAllForms(false);
    } finally {
      setIsLoadingArchives(false);
    }
  };

  const loadArchivedDatabases = async (page = 1, search = '') => {
    setIsLoadingDatabases(true);
    try {
      const response = await databaseApi.getDeletedDatabases({
        search: search.trim(),
        page,
        limit: 10,
      });
      setArchivedDatabases(response.data.databases);
      setTotalPagesDatabases(response.data.pagination.pages);
      setTotalDatabases(response.data.pagination.total);
      setCurrentPageDatabases(page);

      // Reset selection state when search changes
      if (search !== searchTermDatabases) {
        setSelectedDatabases([]);
        setSelectedAllDatabases(false);
      }
    } catch (error) {
      console.error('Failed to load archived databases:', error);
      setArchivedDatabases([]);
      setTotalPagesDatabases(1);
      setTotalDatabases(0);
      setSelectedDatabases([]);
      setSelectedAllDatabases(false);
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const loadDatabasesWithDeletedRows = async (page = 1, search = '') => {
    setIsLoadingRowsDatabases(true);
    try {
      const response = await databaseApi.getDatabasesWithDeletedRows({
        search: search.trim(),
        page,
        limit: 10,
      });
      setDatabasesWithDeletedRows(response.data.databases);
      setTotalPagesRowsDatabases(response.data.pagination.pages);
      setTotalRowsDatabases(response.data.pagination.total);
      setCurrentPageRowsDatabases(page);
    } catch (error) {
      console.error('Failed to load databases with deleted rows:', error);
      setDatabasesWithDeletedRows([]);
      setTotalPagesRowsDatabases(1);
      setTotalRowsDatabases(0);
    } finally {
      setIsLoadingRowsDatabases(false);
    }
  };

  const loadArchivedRows = async (databaseId: string, page = 1, search = '', filtersToApply?: FilterState[]) => {
    setIsLoadingRows(true);
    try {
      const activeFilters = filtersToApply !== undefined ? filtersToApply : filtersRows;
      const response = await databaseApi.getDeletedRows(databaseId, {
        search: search.trim(),
        page,
        limit: 10,
        filters: activeFilters.length > 0 ? JSON.stringify(activeFilters) : undefined,
      });
      setArchivedRowsColumns(response.data.columns);
      setArchivedRows(response.data.rows);
      setTotalPagesRows(response.data.pagination.pages);
      setTotalRows(response.data.pagination.total);
      setCurrentPageRows(page);

      // Reset selection state when search or filters change
      if (search !== searchTermRows || JSON.stringify(filtersToApply || filtersRows) !== JSON.stringify(filtersRows)) {
        setSelectedRows([]);
        setSelectedAllRows(false);
      }
    } catch (error) {
      console.error('Failed to load archived rows:', error);
      setArchivedRowsColumns([]);
      setArchivedRows([]);
      setTotalPagesRows(1);
      setTotalRows(0);
      setSelectedRows([]);
      setSelectedAllRows(false);
    } finally {
      setIsLoadingRows(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'archives' && archivesTab === 'forms') {
      loadArchivedForms(1, searchTermForms);
    }
  }, [activeTab, archivesTab, user?.id]);

  React.useEffect(() => {
    if (activeTab === 'archives' && archivesTab === 'databases' && databasesArchivesTab === 'databases') {
      loadArchivedDatabases(1, searchTermDatabases);
    }
  }, [activeTab, archivesTab, databasesArchivesTab, user?.id]);

  React.useEffect(() => {
    if (activeTab === 'archives' && archivesTab === 'databases' && databasesArchivesTab === 'rows') {
      if (!selectedRowsDatabase) {
        loadDatabasesWithDeletedRows(1, searchTermRowsDatabases);
      }
    }
  }, [activeTab, archivesTab, databasesArchivesTab, user?.id, selectedRowsDatabase]);

  React.useEffect(() => {
    if (activeTab === 'archives' && archivesTab === 'databases' && databasesArchivesTab === 'rows' && selectedRowsDatabase) {
      loadArchivedRows(selectedRowsDatabase.id, 1, searchTermRows);
    }
  }, [activeTab, archivesTab, databasesArchivesTab, selectedRowsDatabase, user?.id]);

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
    form.name.toLowerCase().includes(searchTermForms.toLowerCase())
  );

  const handleSelectForm = (formId: string, checked: boolean) => {
    if (checked) {
      setSelectedForms(prev => [...prev, formId]);
      setSelectedAllForms(false); // If manually selecting, selectedAll becomes false
    } else {
      setSelectedForms(prev => prev.filter(id => id !== formId));
      setSelectedAllForms(false); // If manually deselecting, selectedAll becomes false
    }
  };

  const handleSelectAllForms = (checked: boolean) => {
    if (checked) {
      // When clicking "Select All" button, select ALL items globally
      setSelectedAllForms(true);
      setSelectedForms([]); // Clear individual selections when selecting all globally
    } else {
      // Deselect all
      setSelectedAllForms(false);
      setSelectedForms([]);
    }
  };

  const handleSelectDatabase = (dbId: string, checked: boolean) => {
    if (checked) {
      setSelectedDatabases(prev => [...prev, dbId]);
      setSelectedAllDatabases(false);
    } else {
      setSelectedDatabases(prev => prev.filter(id => id !== dbId));
      setSelectedAllDatabases(false);
    }
  };

  const handleSelectAllDatabases = (checked: boolean) => {
    if (checked) {
      setSelectedAllDatabases(true);
      setSelectedDatabases([]);
    } else {
      setSelectedAllDatabases(false);
      setSelectedDatabases([]);
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, rowId]);
      setSelectedAllRows(false);
    } else {
      setSelectedRows(prev => prev.filter(id => id !== rowId));
      setSelectedAllRows(false);
    }
  };

  const handleSelectAllRows = (checked: boolean) => {
    if (checked) {
      setSelectedAllRows(true);
      setSelectedRows([]);
    } else {
      setSelectedAllRows(false);
      setSelectedRows([]);
    }
  };

  const handleRestoreForms = () => {
    if (selectedForms.length > 0 || selectedAllForms) {
      setActionOpenedType('RESTORE');
    }
  };

  const handleDeleteForms = () => {
    if (selectedForms.length > 0 || selectedAllForms) {
      setActionOpenedType('DELETE');
    }
  };

  const handleRestoreDatabases = () => {
    if (selectedDatabases.length > 0 || selectedAllDatabases) {
      setActionOpenedType('RESTORE');
    }
  };

  const handleDeleteDatabases = () => {
    if (selectedDatabases.length > 0 || selectedAllDatabases) {
      setActionOpenedType('DELETE');
    }
  };

  const handleRestoreRows = () => {
    if ((selectedRows.length > 0 || selectedAllRows) && selectedRowsDatabase) {
      setActionOpenedType('RESTORE');
    }
  };

  const handleDeleteRows = () => {
    if ((selectedRows.length > 0 || selectedAllRows) && selectedRowsDatabase) {
      setActionOpenedType('DELETE');
    }
  };

  const confirmAction = async () => {
    if (!actionOpenedType || !currentArchiveType) return;

    setIsActionLoading(true);
    try {
      let payload: any = {
        search: '',
      };

      if (currentArchiveType === 'forms') {
        payload = {
          ids: selectedAllForms ? [] : selectedForms,
          selectedAll: selectedAllForms,
          search: searchTermForms.trim(),
        };

        if (actionOpenedType === 'RESTORE') {
          await formsApi.bulkRestoreForms(payload);
        } else if (actionOpenedType === 'DELETE') {
          await formsApi.bulkDeleteForms(payload);
        }

        // Reset selection state
        setSelectedForms([]);
        setSelectedAllForms(false);

        // Reload archived forms
        await loadArchivedForms(1, searchTermForms);
      } else if (currentArchiveType === 'databases') {
        payload = {
          ids: selectedAllDatabases ? [] : selectedDatabases,
          selectedAll: selectedAllDatabases,
          search: searchTermDatabases.trim(),
        };

        if (actionOpenedType === 'RESTORE') {
          await databaseApi.bulkRestoreDatabases(payload);
        } else if (actionOpenedType === 'DELETE') {
          await databaseApi.bulkDeleteDatabases(payload);
        }

        // Reset selection state
        setSelectedDatabases([]);
        setSelectedAllDatabases(false);

        // Reload archived databases
        await loadArchivedDatabases(1, searchTermDatabases);
      } else if (currentArchiveType === 'rows' && selectedRowsDatabase) {
        payload = {
          ids: selectedAllRows ? [] : selectedRows,
          selectedAll: selectedAllRows,
          search: searchTermRows.trim(),
          database_id: selectedRowsDatabase.id,
        };

        if (actionOpenedType === 'RESTORE') {
          await databaseApi.bulkRestoreRows(payload);
        } else if (actionOpenedType === 'DELETE') {
          await databaseApi.bulkDeleteRows(payload);
        }

        // Reset selection state
        setSelectedRows([]);
        setSelectedAllRows(false);

        // Reload archived rows for the selected database
        await loadArchivedRows(selectedRowsDatabase.id, 1, searchTermRows);

        // Also refresh the database listing to update counts
        await loadDatabasesWithDeletedRows(1, searchTermRowsDatabases);
      }

      setActionOpenedType(null);
      setCurrentArchiveType(null);
    } catch (error) {
      console.error(`Failed to ${actionOpenedType.toLowerCase()} ${currentArchiveType}:`, error);
      // Don't reset selection state on error so user can retry
    } finally {
      setIsActionLoading(false);
    }
  };

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'archives' && archivesTab === 'forms') {
        loadArchivedForms(1, searchTermForms);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTermForms]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'archives' && archivesTab === 'databases' && databasesArchivesTab === 'databases') {
        loadArchivedDatabases(1, searchTermDatabases);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTermDatabases]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'archives' && archivesTab === 'databases' && databasesArchivesTab === 'rows') {
        if (!selectedRowsDatabase) {
          loadDatabasesWithDeletedRows(1, searchTermRowsDatabases);
        } else {
          loadArchivedRows(selectedRowsDatabase.id, 1, searchTermRows, filtersRows);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTermRowsDatabases, searchTermRows, selectedRowsDatabase, filtersRows]);

  const handlePageChangeForms = (page: number) => {
    loadArchivedForms(page, searchTermForms);
  };

  const handlePageChangeDatabases = (page: number) => {
    loadArchivedDatabases(page, searchTermDatabases);
  };

  const handlePageChangeRowsDatabases = (page: number) => {
    loadDatabasesWithDeletedRows(page, searchTermRowsDatabases);
  };

  const handlePageChangeRows = (page: number) => {
    if (selectedRowsDatabase) {
      loadArchivedRows(selectedRowsDatabase.id, page, searchTermRows, filtersRows);
    }
  };

  // Get the effective selected count
  const getSelectedCountForms = () => {
    return selectedAllForms ? totalForms : selectedForms.length;
  };

  const getSelectedCountDatabases = () => {
    return selectedAllDatabases ? totalDatabases : selectedDatabases.length;
  };

  const getSelectedCountRows = () => {
    return selectedAllRows ? totalRows : selectedRows.length;
  };

  // Format cell value based on column type
  const formatCellValue = (value: unknown, type: string) => {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'JSON':
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      case 'DATE':
        try {
          return new Date(value as string).toLocaleDateString();
        } catch {
          return String(value);
        }
      case 'DATETIME':
        try {
          return new Date(value as string).toLocaleString();
        } catch {
          return String(value);
        }
      default:
        return String(value);
    }
  };

  // Filter functions
  const addFilterRow = () => {
    if (archivedRowsColumns.length > 0) {
      setTempFiltersRows([...tempFiltersRows, { column: archivedRowsColumns[0].name, operator: 'equals', value: '' }]);
    }
  };

  const updateTempFilterRow = (index: number, updates: Partial<FilterState>) => {
    const newFilters = [...tempFiltersRows];
    newFilters[index] = { ...newFilters[index], ...updates };
    setTempFiltersRows(newFilters);
  };

  const removeFilterRow = (index: number) => {
    setTempFiltersRows(tempFiltersRows.filter((_, i) => i !== index));
  };

  const applyFiltersRows = async () => {
    setIsApplyingFilters(true);
    try {
      setFiltersRows([...tempFiltersRows]);
      setIsFilterDrawerOpen(false);
      if (selectedRowsDatabase) {
        await loadArchivedRows(selectedRowsDatabase.id, 1, searchTermRows, tempFiltersRows);
      }
    } finally {
      setIsApplyingFilters(false);
    }
  };

  const clearFiltersRows = () => {
    setTempFiltersRows([]);
    setFiltersRows([]);
    setIsFilterDrawerOpen(false);
    if (selectedRowsDatabase) {
      loadArchivedRows(selectedRowsDatabase.id, 1, searchTermRows, []);
    }
  };

  const openFilterDrawer = () => {
    setTempFiltersRows([...filtersRows]);
    setIsFilterDrawerOpen(true);
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
      icon: DatabaseIcon,
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
                        value={searchTermForms}
                        onChange={(e) => setSearchTermForms(e.target.value)}
                        className="max-w-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleSelectAllForms(!selectedAllForms)}
                          disabled={archivedForms.length === 0}
                        >
                          {selectedAllForms ? t('archives.allSelected') : t('archives.selectAll')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSelectAllForms(false)}
                          disabled={selectedForms.length === 0 && !selectedAllForms}
                        >
                          {t('archives.deselectAll')}
                        </Button>
                        <Button
                          onClick={() => {
                            setCurrentArchiveType('forms');
                            handleRestoreForms();
                          }}
                          disabled={getSelectedCountForms() === 0 || isActionLoading}
                        >
                          {isActionLoading && actionOpenedType === 'RESTORE' && <Spinner className="mr-2" size="sm" />}
                          {isActionLoading && actionOpenedType === 'RESTORE' ? t('common.loading') : t('archives.restore')}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setCurrentArchiveType('forms');
                            handleDeleteForms();
                          }}
                          disabled={getSelectedCountForms() === 0 || isActionLoading}
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
                        {searchTermForms ? t('archives.noFormsMatch') : t('archives.noDeletedForms')}
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedAllForms || (archivedForms.length > 0 && archivedForms.every(form => selectedForms.includes(form.id)))}
                                  onCheckedChange={handleSelectAllForms}
                                />
                              </TableHead>
                              <TableHead>{t('common.name')}</TableHead>
                              <TableHead>{t('common.createdAt')}</TableHead>
                              <TableHead>{t('common.updatedAt')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredForms.map((form) => (
                              <TableRow key={form.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedAllForms || selectedForms.includes(form.id)}
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
                        {totalPagesForms > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                              {t('common.showing')} {(currentPageForms - 1) * 10 + 1}-{Math.min(currentPageForms * 10, totalForms)} {t('common.of')} {totalForms} {t('archives.forms')}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChangeForms(currentPageForms - 1)}
                                disabled={currentPageForms === 1 || isLoadingArchives}
                              >
                                {t('common.previous')}
                              </Button>

                              {/* Page numbers */}
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, totalPagesForms) }, (_, i) => {
                                  let pageNum;
                                  if (totalPagesForms <= 5) {
                                    pageNum = i + 1;
                                  } else if (currentPageForms <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentPageForms >= totalPagesForms - 2) {
                                    pageNum = totalPagesForms - 4 + i;
                                  } else {
                                    pageNum = currentPageForms - 2 + i;
                                  }

                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={currentPageForms === pageNum ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handlePageChangeForms(pageNum)}
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
                                onClick={() => handlePageChangeForms(currentPageForms + 1)}
                                disabled={currentPageForms === totalPagesForms || isLoadingArchives}
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
                <Tabs value={databasesArchivesTab} onValueChange={setDatabasesArchivesTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="databases">{t('archives.databases')}</TabsTrigger>
                    <TabsTrigger value="rows">{t('archives.rows')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="databases" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('archives.deletedDatabases')}</CardTitle>
                        <CardDescription>{t('archives.deletedDatabasesDesc')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                          <Input
                            placeholder={t('archives.searchDatabases')}
                            value={searchTermDatabases}
                            onChange={(e) => setSearchTermDatabases(e.target.value)}
                            className="max-w-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleSelectAllDatabases(!selectedAllDatabases)}
                              disabled={archivedDatabases.length === 0}
                            >
                              {selectedAllDatabases ? t('archives.allSelected') : t('archives.selectAll')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleSelectAllDatabases(false)}
                              disabled={selectedDatabases.length === 0 && !selectedAllDatabases}
                            >
                              {t('archives.deselectAll')}
                            </Button>
                            <Button
                              onClick={() => {
                                setCurrentArchiveType('databases');
                                handleRestoreDatabases();
                              }}
                              disabled={getSelectedCountDatabases() === 0 || isActionLoading}
                            >
                              {isActionLoading && actionOpenedType === 'RESTORE' && <Spinner className="mr-2" size="sm" />}
                              {isActionLoading && actionOpenedType === 'RESTORE' ? t('common.loading') : t('archives.restore')}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                setCurrentArchiveType('databases');
                                handleDeleteDatabases();
                              }}
                              disabled={getSelectedCountDatabases() === 0 || isActionLoading}
                            >
                              {isActionLoading && actionOpenedType === 'DELETE' && <Spinner className="mr-2" size="sm" />}
                              {isActionLoading && actionOpenedType === 'DELETE' ? t('common.loading') : t('archives.delete')}
                            </Button>
                          </div>
                        </div>

                        {isLoadingDatabases ? (
                          <div className="flex justify-center py-8">
                            <Spinner size="lg" />
                          </div>
                        ) : archivedDatabases.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {searchTermDatabases ? t('archives.noDatabasesMatch') : t('archives.noDeletedDatabases')}
                          </div>
                        ) : (
                          <>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">
                                    <Checkbox
                                      checked={selectedAllDatabases || (archivedDatabases.length > 0 && archivedDatabases.every(db => selectedDatabases.includes(db.id)))}
                                      onCheckedChange={handleSelectAllDatabases}
                                    />
                                  </TableHead>
                                  <TableHead>{t('common.name')}</TableHead>
                                  <TableHead>{t('common.createdAt')}</TableHead>
                                  <TableHead>{t('common.updatedAt')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {archivedDatabases.map((db) => (
                                  <TableRow key={db.id}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedAllDatabases || selectedDatabases.includes(db.id)}
                                        onCheckedChange={(checked) => handleSelectDatabase(db.id, checked as boolean)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">{db.name}</TableCell>
                                    <TableCell>{new Date(db.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(db.updated_at).toLocaleDateString()}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPagesDatabases > 1 && (
                              <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                  {t('common.showing')} {(currentPageDatabases - 1) * 10 + 1}-{Math.min(currentPageDatabases * 10, totalDatabases)} {t('common.of')} {totalDatabases} {t('archives.databases')}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChangeDatabases(currentPageDatabases - 1)}
                                    disabled={currentPageDatabases === 1 || isLoadingDatabases}
                                  >
                                    {t('common.previous')}
                                  </Button>

                                  {/* Page numbers */}
                                  <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPagesDatabases) }, (_, i) => {
                                      let pageNum;
                                      if (totalPagesDatabases <= 5) {
                                        pageNum = i + 1;
                                      } else if (currentPageDatabases <= 3) {
                                        pageNum = i + 1;
                                      } else if (currentPageDatabases >= totalPagesDatabases - 2) {
                                        pageNum = totalPagesDatabases - 4 + i;
                                      } else {
                                        pageNum = currentPageDatabases - 2 + i;
                                      }

                                      return (
                                        <Button
                                          key={pageNum}
                                          variant={currentPageDatabases === pageNum ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => handlePageChangeDatabases(pageNum)}
                                          disabled={isLoadingDatabases}
                                        >
                                          {pageNum}
                                        </Button>
                                      );
                                    })}
                                  </div>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChangeDatabases(currentPageDatabases + 1)}
                                    disabled={currentPageDatabases === totalPagesDatabases || isLoadingDatabases}
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

                  <TabsContent value="rows" className="mt-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>
                              {selectedRowsDatabase ? `${t('archives.deletedRows')} - ${selectedRowsDatabase.name}` : t('archives.databasesWithDeletedRows')}
                            </CardTitle>
                            <CardDescription>
                              {selectedRowsDatabase ? t('archives.deletedRowsDesc') : t('archives.databasesWithDeletedRowsDesc')}
                            </CardDescription>
                          </div>
                          {selectedRowsDatabase && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedRowsDatabase(null);
                                setSelectedRows([]);
                                setSelectedAllRows(false);
                                setSearchTermRows('');
                                setFiltersRows([]);
                                setTempFiltersRows([]);
                              }}
                            >
                              ← {t('common.back')}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {!selectedRowsDatabase ? (
                          // Show databases with deleted rows
                          <>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                              <Input
                                placeholder={t('archives.searchDatabases')}
                                value={searchTermRowsDatabases}
                                onChange={(e) => setSearchTermRowsDatabases(e.target.value)}
                                className="max-w-sm"
                              />
                            </div>

                            {isLoadingRowsDatabases ? (
                              <div className="flex justify-center py-8">
                                <Spinner size="lg" />
                              </div>
                            ) : databasesWithDeletedRows.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                {searchTermRowsDatabases ? t('archives.noDatabasesMatch') : t('archives.noDatabasesWithDeletedRows')}
                              </div>
                            ) : (
                              <>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>{t('common.name')}</TableHead>
                                      <TableHead>{t('archives.deletedRowsCount')}</TableHead>
                                      <TableHead>{t('common.createdAt')}</TableHead>
                                      <TableHead>{t('common.updatedAt')}</TableHead>
                                      <TableHead>{t('common.actions')}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {databasesWithDeletedRows.map((db) => (
                                      <TableRow key={db.id}>
                                        <TableCell className="font-medium">{db.name}</TableCell>
                                        <TableCell>{(db as any).deleted_rows_count || 0}</TableCell>
                                        <TableCell>{new Date(db.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(db.updated_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedRowsDatabase(db)}
                                          >
                                            {t('archives.viewDeletedRows')}
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>

                                {/* Pagination */}
                                {totalPagesRowsDatabases > 1 && (
                                  <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                      {t('common.showing')} {(currentPageRowsDatabases - 1) * 10 + 1}-{Math.min(currentPageRowsDatabases * 10, totalRowsDatabases)} {t('common.of')} {totalRowsDatabases} {t('archives.databases')}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChangeRowsDatabases(currentPageRowsDatabases - 1)}
                                        disabled={currentPageRowsDatabases === 1 || isLoadingRowsDatabases}
                                      >
                                        {t('common.previous')}
                                      </Button>

                                      {/* Page numbers */}
                                      <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, totalPagesRowsDatabases) }, (_, i) => {
                                          let pageNum;
                                          if (totalPagesRowsDatabases <= 5) {
                                            pageNum = i + 1;
                                          } else if (currentPageRowsDatabases <= 3) {
                                            pageNum = i + 1;
                                          } else if (currentPageRowsDatabases >= totalPagesRowsDatabases - 2) {
                                            pageNum = totalPagesRowsDatabases - 4 + i;
                                          } else {
                                            pageNum = currentPageRowsDatabases - 2 + i;
                                          }

                                          return (
                                            <Button
                                              key={pageNum}
                                              variant={currentPageRowsDatabases === pageNum ? "default" : "outline"}
                                              size="sm"
                                              onClick={() => handlePageChangeRowsDatabases(pageNum)}
                                              disabled={isLoadingRowsDatabases}
                                            >
                                              {pageNum}
                                            </Button>
                                          );
                                        })}
                                      </div>

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChangeRowsDatabases(currentPageRowsDatabases + 1)}
                                        disabled={currentPageRowsDatabases === totalPagesRowsDatabases || isLoadingRowsDatabases}
                                      >
                                        {t('common.next')}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          // Show deleted rows for selected database
                          <>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                              <Input
                                placeholder={t('archives.searchRows')}
                                value={searchTermRows}
                                onChange={(e) => setSearchTermRows(e.target.value)}
                                className="max-w-sm"
                              />
                              {selectedRowsDatabase && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant={filtersRows.length > 0 ? 'default' : 'outline'}
                                    onClick={openFilterDrawer}
                                  >
                                    <Filter className="h-4 w-4 mr-2" />
                                    {t('common.filters')} {filtersRows.length > 0 && `(${filtersRows.length})`}
                                  </Button>
                                  {filtersRows.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setFiltersRows([]);
                                        if (selectedRowsDatabase) {
                                          loadArchivedRows(selectedRowsDatabase.id, 1, searchTermRows, []);
                                        }
                                      }}
                                    >
                                      {t('common.clearAll')}
                                    </Button>
                                  )}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleSelectAllRows(!selectedAllRows)}
                                  disabled={archivedRows.length === 0}
                                >
                                  {selectedAllRows ? t('archives.allSelected') : t('archives.selectAll')}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleSelectAllRows(false)}
                                  disabled={selectedRows.length === 0 && !selectedAllRows}
                                >
                                  {t('archives.deselectAll')}
                                </Button>
                                <Button
                                  onClick={() => {
                                    setCurrentArchiveType('rows');
                                    handleRestoreRows();
                                  }}
                                  disabled={getSelectedCountRows() === 0 || isActionLoading}
                                >
                                  {isActionLoading && actionOpenedType === 'RESTORE' && <Spinner className="mr-2" size="sm" />}
                                  {isActionLoading && actionOpenedType === 'RESTORE' ? t('common.loading') : t('archives.restore')}
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    setCurrentArchiveType('rows');
                                    handleDeleteRows();
                                  }}
                                  disabled={getSelectedCountRows() === 0 || isActionLoading}
                                >
                                  {isActionLoading && actionOpenedType === 'DELETE' && <Spinner className="mr-2" size="sm" />}
                                  {isActionLoading && actionOpenedType === 'DELETE' ? t('common.loading') : t('archives.delete')}
                                </Button>
                              </div>
                            </div>

                            {isLoadingRows ? (
                              <div className="flex justify-center py-8">
                                <Spinner size="lg" />
                              </div>
                            ) : archivedRows.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                {searchTermRows ? t('archives.noRowsMatch') : t('archives.noDeletedRows')}
                              </div>
                            ) : (
                              <>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">
                                        <Checkbox
                                          checked={selectedAllRows || (archivedRows.length > 0 && archivedRows.every(row => selectedRows.includes(row.id)))}
                                          onCheckedChange={handleSelectAllRows}
                                        />
                                      </TableHead>
                                      {archivedRowsColumns.map((column) => (
                                        <TableHead key={column.id}>
                                          {column.name}
                                          {column.is_unique && <span className="text-xs text-muted-foreground ml-1">(unique)</span>}
                                        </TableHead>
                                      ))}
                                      <TableHead>{t('common.createdAt')}</TableHead>
                                      <TableHead>{t('common.updatedAt')}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {archivedRows.map((row) => (
                                      <TableRow key={row.id}>
                                        <TableCell>
                                          <Checkbox
                                            checked={selectedAllRows || selectedRows.includes(row.id)}
                                            onCheckedChange={(checked) => handleSelectRow(row.id, checked as boolean)}
                                          />
                                        </TableCell>
                                        {archivedRowsColumns.map((column) => (
                                          <TableCell key={column.id}>
                                            <div className="max-w-xs truncate">
                                              {formatCellValue(row.data[column.name], column.type)}
                                            </div>
                                          </TableCell>
                                        ))}
                                        <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(row.updated_at).toLocaleDateString()}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>

                                {/* Pagination */}
                                {totalPagesRows > 1 && (
                                  <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                      {t('common.showing')} {(currentPageRows - 1) * 10 + 1}-{Math.min(currentPageRows * 10, totalRows)} {t('common.of')} {totalRows} {t('archives.rows')}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChangeRows(currentPageRows - 1)}
                                        disabled={currentPageRows === 1 || isLoadingRows}
                                      >
                                        {t('common.previous')}
                                      </Button>

                                      {/* Page numbers */}
                                      <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, totalPagesRows) }, (_, i) => {
                                          let pageNum;
                                          if (totalPagesRows <= 5) {
                                            pageNum = i + 1;
                                          } else if (currentPageRows <= 3) {
                                            pageNum = i + 1;
                                          } else if (currentPageRows >= totalPagesRows - 2) {
                                            pageNum = totalPagesRows - 4 + i;
                                          } else {
                                            pageNum = currentPageRows - 2 + i;
                                          }

                                          return (
                                            <Button
                                              key={pageNum}
                                              variant={currentPageRows === pageNum ? "default" : "outline"}
                                              size="sm"
                                              onClick={() => handlePageChangeRows(pageNum)}
                                              disabled={isLoadingRows}
                                            >
                                              {pageNum}
                                            </Button>
                                          );
                                        })}
                                      </div>

                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChangeRows(currentPageRows + 1)}
                                        disabled={currentPageRows === totalPagesRows || isLoadingRows}
                                      >
                                        {t('common.next')}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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
        <Dialog open={actionOpenedType !== null} onOpenChange={(open) => !isActionLoading && !open && (setActionOpenedType(null), setCurrentArchiveType(null))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {currentArchiveType === 'forms' && (actionOpenedType === 'RESTORE' ? t('archives.restoreForms') : t('archives.deleteForms'))}
                {currentArchiveType === 'databases' && (actionOpenedType === 'RESTORE' ? t('archives.restoreDatabases') : t('archives.deleteDatabases'))}
                {currentArchiveType === 'rows' && (actionOpenedType === 'RESTORE' ? t('archives.restoreRows') : t('archives.deleteRows'))}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {currentArchiveType === 'forms' && (actionOpenedType === 'RESTORE'
                  ? t('archives.restoreFormsConfirm', { count: getSelectedCountForms() })
                  : t('archives.deleteFormsConfirm', { count: getSelectedCountForms() })
                )}
                {currentArchiveType === 'databases' && (actionOpenedType === 'RESTORE'
                  ? t('archives.restoreDatabasesConfirm', { count: getSelectedCountDatabases() })
                  : t('archives.deleteDatabasesConfirm', { count: getSelectedCountDatabases() })
                )}
                {currentArchiveType === 'rows' && (actionOpenedType === 'RESTORE'
                  ? t('archives.restoreRowsConfirm', { count: getSelectedCountRows() })
                  : t('archives.deleteRowsConfirm', { count: getSelectedCountRows() })
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setActionOpenedType(null);
                  setCurrentArchiveType(null);
                }}
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

        {/* Filter Drawer for Archived Rows */}
        <Drawer
          open={isFilterDrawerOpen}
          onOpenChange={setIsFilterDrawerOpen}
          title={t('common.filters')}
        >
          <DrawerContent>
            <div className="space-y-4">
              {tempFiltersRows.map((filter, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>{t('database.selectColumn')}</Label>
                    <Button variant="ghost" size="sm" onClick={() => removeFilterRow(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select
                    value={filter.column}
                    onChange={(e) => updateTempFilterRow(index, { column: e.target.value })}
                    options={archivedRowsColumns.map((c) => ({ value: c.name, label: c.name }))}
                  />
                  <Label>{t('database.selectOperator')}</Label>
                  <Select
                    value={filter.operator}
                    onChange={(e) => updateTempFilterRow(index, { operator: e.target.value })}
                    options={[
                      { value: 'equals', label: t('database.filterOperators.equals') },
                      { value: 'contains', label: t('database.filterOperators.contains') },
                      { value: 'starts_with', label: t('database.filterOperators.starts_with') },
                      { value: 'ends_with', label: t('database.filterOperators.ends_with') },
                    ]}
                  />
                  <Label>{t('database.enterValue')}</Label>
                  <Input
                    value={filter.value}
                    onChange={(e) => updateTempFilterRow(index, { value: e.target.value })}
                    placeholder={t('database.enterValue')}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFilterRow} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('database.addFilter')}
              </Button>
            </div>
          </DrawerContent>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setIsFilterDrawerOpen(false)} disabled={isApplyingFilters}>
              {t('common.cancel')}
            </Button>
            <Button onClick={applyFiltersRows} disabled={isApplyingFilters}>
              {isApplyingFilters ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  {t('database.applyFilters')}
                </>
              ) : (
                t('database.applyFilters')
              )}
            </Button>
          </DrawerFooter>
        </Drawer>
      </div>
    </Layout>
  );
};

export default Settings;
