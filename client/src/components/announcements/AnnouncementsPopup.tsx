import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Megaphone, Calendar, Users, AlertCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  description: string;
  content?: string;
  targetAudience: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  imageUrl?: string;
  fromDate: string;
  toDate: string;
  isActive: boolean;
  showOnQrCode: boolean;
  createdAt: string;
}

export function AnnouncementsPopup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>(() => {
    const stored = localStorage.getItem('dismissedAnnouncements');
    return stored ? JSON.parse(stored) : [];
  });

  // Get announcements based on user role
  const getAnnouncementsEndpoint = () => {
    if (!user?.role) return null;
    
    switch (user.role) {
      case 'admin':
        return '/api/admin/active-announcements';
      case 'so_center':
        return '/api/so-center/active-announcements';
      case 'teacher':
        return '/api/teacher/active-announcements';
      default:
        return `/api/announcements/${user.role}`;
    }
  };

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['active-announcements', user?.role],
    queryFn: async () => {
      const endpoint = getAnnouncementsEndpoint();
      if (!endpoint) return [];
      
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
    enabled: !!user?.role,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Filter out dismissed announcements and show only relevant ones
  const activeAnnouncements = announcements.filter((announcement: Announcement) => 
    !dismissedAnnouncements.includes(announcement.id) &&
    announcement.isActive &&
    new Date(announcement.fromDate) <= new Date() &&
    new Date(announcement.toDate) >= new Date() &&
    (
      announcement.targetAudience.includes('all') ||
      announcement.targetAudience.includes(user?.role || '') ||
      (user?.role === 'so_center' && announcement.targetAudience.includes('so_centers'))
    )
  );

  // Auto-open popup when there are new announcements
  useEffect(() => {
    if (activeAnnouncements.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [activeAnnouncements.length, isOpen]);

  const handleDismiss = (announcementId: string) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
    
    // Close popup if no more announcements
    if (activeAnnouncements.length === 1) {
      setIsOpen(false);
    }
  };

  const handleCloseAll = () => {
    const allIds = activeAnnouncements.map((a: Announcement) => a.id);
    const newDismissed = [...dismissedAnnouncements, ...allIds];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
    setIsOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading || activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            Active Announcements ({activeAnnouncements.length})
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseAll}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            Close All
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {activeAnnouncements.map((announcement: Announcement, index: number) => (
            <Card key={announcement.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`p-1 rounded ${getPriorityColor(announcement.priority)} flex items-center gap-1`}>
                      {getPriorityIcon(announcement.priority)}
                      <span className="text-xs font-medium capitalize">
                        {announcement.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(announcement.fromDate)} - {formatDate(announcement.toDate)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(announcement.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {announcement.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  {announcement.description}
                </p>

                {announcement.content && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>
                )}

                {announcement.imageUrl && (
                  <div className="rounded-md overflow-hidden">
                    <img
                      src={announcement.imageUrl}
                      alt="Announcement banner"
                      className="w-full h-auto max-h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>For: {announcement.targetAudience.join(', ')}</span>
                  </div>
                  <span>Posted: {formatDate(announcement.createdAt)}</span>
                </div>
              </CardContent>

              {index < activeAnnouncements.length - 1 && (
                <Separator className="my-4" />
              )}
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button onClick={handleCloseAll}>
            Dismiss All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}