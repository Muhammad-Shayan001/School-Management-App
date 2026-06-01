'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { useAuthStore } from '@/app/_lib/store/auth-store';
import { getCustomGroups, createCustomGroup, deleteCustomGroup } from '@/app/_lib/actions/groups';
import { toast } from 'sonner';

export function CustomGroupsManager() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  useEffect(() => {
    if (user?.school_id) {
      loadGroups();
    }
  }, [user?.school_id]);

  const loadGroups = async () => {
    if (!user?.school_id) return;
    setIsLoading(true);
    const { success, data } = await getCustomGroups(user.school_id);
    if (success && data) {
      setGroups(data);
    }
    setIsLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (!user?.school_id) {
      toast.error('School information not available');
      return;
    }

    setIsCreating(true);
    const result = await createCustomGroup(user.school_id, newGroupName, newGroupDesc);
    
    if (result.success) {
      toast.success(`Group "${newGroupName}" created successfully`, {
        style: { borderRadius: '1.5rem', fontWeight: 'bold' }
      });
      setNewGroupName('');
      setNewGroupDesc('');
      await loadGroups();
    } else {
      toast.error(result.error || 'Failed to create group');
    }
    setIsCreating(false);
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? Students with this group will not be affected, but new assignments won't be possible.`)) {
      return;
    }

    setIsDeleting(groupId);
    const result = await deleteCustomGroup(groupId);
    
    if (result.success) {
      toast.success(`Group "${groupName}" deleted successfully`);
      await loadGroups();
    } else {
      toast.error(result.error || 'Failed to delete group');
    }
    setIsDeleting(null);
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="glass-card p-6 border border-border/50 rounded-[2.5rem] space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
          Student Groups Manager
        </h2>
        <p className="text-sm text-text-tertiary mt-1">
          Manage additional student groups (e.g., Medical, Humanities). Standard groups (Science, Commerce, Engineering) are always available.
        </p>
      </div>

      <div className="border-t border-border/30 pt-6">
        <h3 className="text-sm font-bold text-text-primary mb-4">Add New Group</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Group name (e.g. Medical, Humanities)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
            disabled={isCreating}
          />
          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !newGroupName.trim()}
            className="gap-2 whitespace-nowrap"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Group
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="border-t border-border/30 pt-6">
        <h3 className="text-sm font-bold text-text-primary mb-4">Custom Groups</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-text-tertiary/40 mx-auto mb-2" />
            <p className="text-sm text-text-tertiary">No custom groups yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="p-4 rounded-2xl bg-white border border-border/30 hover:border-border/60 hover:shadow-md transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-text-primary">{group.group_name}</p>
                  {group.description && (
                    <p className="text-xs text-text-tertiary mt-1">{group.description}</p>
                  )}
                  <p className="text-[10px] text-text-tertiary/60 mt-2 opacity-70">
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteGroup(group.id, group.group_name)}
                  disabled={isDeleting === group.id}
                  className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200/50"
                >
                  {isDeleting === group.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-bold mb-1">Note:</p>
          <p>Students in Class 11 & 12 can select from: <strong>Science, Commerce, Engineering, Other</strong>, or any custom groups you create below.</p>
          <p className="mt-2 text-[13px]"><strong>Custom Groups:</strong> Add specialized groups (Medical, Humanities, etc.) that admins manage and students can select from.</p>
        </div>
      </div>
    </div>
  );
}
