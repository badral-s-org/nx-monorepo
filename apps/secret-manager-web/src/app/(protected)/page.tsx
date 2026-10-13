'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2, Folder, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Label } from '@org/ui';
import { api } from '../utils/axiosInstance';
import axios from 'axios';
import { showToaster } from '../utils/toasters';
import Link from 'next/link';

type Secret = {
  id: number;
  key: string;
};

type Group = {
  id: number;
  name: string;
  secrets: Secret[];
};

export default function Index() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [fetchingGroups, setFetchingGroups] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      setFetchingGroups(true);

      const response = await api.get('/secrets/get-secrets');
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch groups');
      }

      setGroups(result.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToaster({
          type: 'error',
          title: error.response?.data?.message || 'Failed to fetch groups',
        });
      } else {
        toast.error('Failed to fetch groups');
      }
    } finally {
      setFetchingGroups(false);
    }
  }, []);

  useEffect(() => {
    void fetchGroups();
  }, [fetchGroups]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/secrets/create-group', {
        groupName: trimmedName,
      });

      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || 'Failed to create group');
      }

      toast.success('Group created successfully');
      setName('');

      // Refresh the list after creating a group.
      await fetchGroups();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToaster({
          type: 'error',
          title: error.response?.data?.message || 'Failed to create group',
        });
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2">
        {/* Create group form */}
        <section className="h-fit rounded-xl border bg-background p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create a group
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Organize your secrets into a group.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                placeholder="e.g. Production API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create group
                </>
              )}
            </Button>
          </form>
        </section>

        {/* Groups list */}
        <section className="rounded-xl border bg-background p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Your groups
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {groups.length} {groups.length === 1 ? 'group' : 'groups'} total
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchGroups()}
              disabled={fetchingGroups}
            >
              {fetchingGroups ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>

          {fetchingGroups ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Folder className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No groups yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first group to organize your secrets.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <Link
                    href={`/secrets?groupId=${group.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <div className="rounded-lg bg-muted p-2">
                      <Folder className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium">{group.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <KeyRound className="h-3.5 w-3.5" />
                        {group.secrets?.length ?? 0}{' '}
                        {(group.secrets?.length ?? 0) === 1
                          ? 'secret'
                          : 'secrets'}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
