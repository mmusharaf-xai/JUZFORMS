import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { authApi, statsApi } from '@/lib/api';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import type { Stats } from '@/types';
import { FileText, Send, Database, User, Lock, BarChart3 } from 'lucide-react';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

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

  React.useEffect(() => {
    if (activeTab === 'stats') {
      statsApi.getStats().then((res) => {
        setStats(res.data.stats);
        setStatsLoading(false);
      }).catch(() => {
        setStatsLoading(false);
      });
    }
  }, [activeTab]);

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
          <TabsList className="grid w-full grid-cols-3">
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
      </div>
    </Layout>
  );
};

export default Settings;
