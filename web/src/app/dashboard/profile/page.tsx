'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Shield, Mail, Phone, Calendar } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileLoading(true);
    try {
      await api.put('/users/profile', data);
      await loadUser();
      toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.response?.data?.error || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      toast({ title: 'Password changed', description: 'Your password has been changed successfully.' });
    } catch (err: any) {
      toast({
        title: 'Password change failed',
        description: err.response?.data?.error || 'Failed to change password.',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    SALES: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    FIELD: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    FINANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    CLIENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{user?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </div>
              <Badge variant="outline" className={roleColors[user?.role || '']}>
                <Shield className="h-3 w-3 mr-1" />
                {user?.role}
              </Badge>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {user?.phone || 'Not set'}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </CardTitle>
          <CardDescription>Update your name and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...profileForm.register('phone')} placeholder="+91XXXXXXXXXX" />
              {profileForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.phone.message}</p>
              )}
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
