'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Label } from '@org/ui';
import { api } from '../utils/axiosInstance';
import axios from 'axios';
import { showToaster } from '../utils/toasters';

export default function Index() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setLoading(true);

      const response = api.post('/secrets/create-group', {
        groupName: name.trim(),
      });

      const result = (await response).data;

      if (!result.success) {
        throw new Error(result.message || 'Failed to create group');
      }

      toast.success('Group created successfully');
      setName('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorResponse = error.response;
        showToaster({
          type: 'error',
          title: errorResponse?.data.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
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
      </div>
    </main>
  );
}
