'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, Eye, EyeOff, Loader2, Edit, Copy } from 'lucide-react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@org/ui';
import { api, getErrorMessage } from '../../../utils/axiosInstance';
import { Secret, SecretGroup } from '../types';
import { EditSecretDialog } from './EditSecretDialog';
import { showToaster } from '../../../utils/toasters';

interface SecretEntry {
  id: string;
  key: string;
  value: string;
}

const createEntry = (): SecretEntry => ({
  id: crypto.randomUUID(),
  key: '',
  value: '',
});

export const AddSecretsDialog = () => {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');

  const [group, setGroup] = useState<SecretGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [secret, setSecret] = useState<Secret | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [entries, setEntries] = useState<SecretEntry[]>([createEntry()]);
  const [showValues, setShowValues] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [toDeleteSecrets, setToDeleteSecrets] = useState<Set<number>>(
    new Set(),
  );
  const [deleting, setDeleting] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<number>>(
    new Set(),
  );

  const fetchGroup = useCallback(async () => {
    try {
      setError('');

      const response = await api.get(`/secrets/get-secrets/${groupId}`);
      const group: SecretGroup = response.data.data;

      if (!group) {
        setError('Group not found.');
        return;
      }

      setGroup(group);
    } catch (error) {
      setError(
        getErrorMessage(error, 'Failed to load secrets. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) {
      setError('Group ID is missing.');
      setLoading(false);
      return;
    }

    void fetchGroup();
  }, [groupId, fetchGroup]);

  const normalizedKeys = entries.map((entry) => entry.key.trim().toLowerCase());

  const duplicateIds = new Set(
    entries
      .filter(
        (entry, index) =>
          (entry.key.trim() !== '' &&
            normalizedKeys.indexOf(normalizedKeys[index]) !== index) ||
          (entry.key.trim() !== '' &&
            normalizedKeys.lastIndexOf(normalizedKeys[index]) !== index),
      )
      .map((entry) => entry.id),
  );

  const updateEntry = (id: string, field: 'key' | 'value', value: string) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );

    setSubmitError('');
  };

  const addEntry = () => {
    setEntries((current) => [...current, createEntry()]);
  };

  const removeEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const resetDialog = () => {
    setEntries([createEntry()]);
    setSubmitError('');
    setShowValues(false);
  };

  const handleEdit = (value: Secret) => {
    setSecret(value);
    setOpenEditDialog(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!group) return;

    const hasEmptyFields = entries.some(
      (entry) => !entry.key.trim() || !entry.value.trim(),
    );

    if (hasEmptyFields) {
      setSubmitError('Every secret must have a key and a value.');
      return;
    }

    const keys = entries.map((entry) => entry.key.trim().toLowerCase());

    if (new Set(keys).size !== keys.length) {
      setSubmitError('Secret keys must be unique.');
      return;
    }

    // Prevent duplicates with secrets already in this group.
    const existingKeys = new Set(
      group.secrets.map((secret) => secret.key.trim().toLowerCase()),
    );

    if (keys.some((key) => existingKeys.has(key))) {
      setSubmitError(
        'A secret with one of these keys already exists in this group.',
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      // Batch API: the backend must accept an array of secrets.
      await api.post('/secrets/put-secrets', {
        groupId: group.id,
        secrets: entries.map((entry) => ({
          key: entry.key.trim(),
          secret: entry.value,
        })),
      });

      await fetchGroup();

      showToaster({ type: 'success', title: 'Successfully added' });
      setDialogOpen(false);
      resetDialog();
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, 'Failed to add secrets. Please try again.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="p-6">Loading secrets...</main>;
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  if (!group) return null;

  const toggleInSet = (set: Set<number>, id: number) => {
    const newSet = new Set(set);

    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }

    return newSet;
  };

  const handleToDeleteSecrets = (secret: Secret) => {
    setToDeleteSecrets((current) => toggleInSet(current, secret.id));
  };

  const toggleReveal = (secret: Secret) => {
    setRevealedSecrets((current) => toggleInSet(current, secret.id));
  };

  const copySecret = async (secret: Secret) => {
    try {
      await navigator.clipboard.writeText(secret.secret);
      showToaster({ type: 'success', title: `Copied ${secret.key}` });
    } catch {
      showToaster({ type: 'error', title: 'Failed to copy to clipboard' });
    }
  };

  const deleteSecrets = async () => {
    try {
      setDeleting(true);

      await api.delete('/secrets/delete-secrets', {
        data: {
          secrets: [...toDeleteSecrets],
        },
      });

      showToaster({ type: 'success', title: 'Successfully deleted' });
      setToDeleteSecrets(new Set());
    } catch (error) {
      showToaster({
        type: 'error',
        title: getErrorMessage(error, 'Failed to delete secrets'),
      });
    } finally {
      setDeleting(false);
      await fetchGroup();
    }
  };
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.secrets.length}{' '}
            {group.secrets.length === 1 ? 'secret' : 'secrets'}
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <DialogTrigger
            className={
              'flex gap-2 items-center bg-black text-white rounded-md px-2 hover:cursor-pointer hover:bg-black/70 py-1'
            }
          >
            <Plus className="h-4 w-4" />
            <span>Add Secrets</span>
          </DialogTrigger>

          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add secrets</DialogTitle>
              <DialogDescription>
                Add one or more key/value pairs to {group.name}. Each key must
                be unique within this group.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="space-y-3 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Secret {index + 1}
                      </p>

                      {entries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(entry.id)}
                          aria-label={`Remove secret ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`key-${entry.id}`}>Key</Label>
                      <Input
                        id={`key-${entry.id}`}
                        placeholder="e.g. DATABASE_URL"
                        value={entry.key}
                        onChange={(event) =>
                          updateEntry(entry.id, 'key', event.target.value)
                        }
                        aria-invalid={duplicateIds.has(entry.id)}
                        required
                      />

                      {duplicateIds.has(entry.id) && (
                        <p className="text-sm text-destructive">
                          This key is duplicated.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`value-${entry.id}`}>Value</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`value-${entry.id}`}
                          type={showValues ? 'text' : 'password'}
                          placeholder="Enter secret value"
                          value={entry.value}
                          onChange={(event) =>
                            updateEntry(entry.id, 'value', event.target.value)
                          }
                          autoComplete="off"
                          required
                          className="min-w-0"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setShowValues((current) => !current)}
                          aria-label={
                            showValues ? 'Hide values' : 'Show values'
                          }
                        >
                          {showValues ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addEntry}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add another secret
              </Button>

              {submitError && (
                <p role="alert" className="text-sm text-destructive">
                  {submitError}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={submitting || duplicateIds.size > 0}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {submitting
                    ? 'Saving...'
                    : `Save ${entries.length} secret${entries.length === 1 ? '' : 's'}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>
      {toDeleteSecrets.size > 0 && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => void deleteSecrets()}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete {toDeleteSecrets.size} selected
          </Button>
        </div>
      )}

      {group.secrets.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="font-semibold">No secrets yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a secret to this group to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Secret</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {group.secrets.map((secret) => (
                <tr key={secret.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    <Checkbox
                      checked={toDeleteSecrets.has(secret.id)}
                      onCheckedChange={() => handleToDeleteSecrets(secret)}
                      aria-label={`Select ${secret.key}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{secret.key}</td>
                  <td className="max-w-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="min-w-0 flex-1 break-all font-mono">
                        {revealedSecrets.has(secret.id)
                          ? secret.secret
                          : '••••••••'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleReveal(secret)}
                        aria-label={
                          revealedSecrets.has(secret.id)
                            ? `Hide ${secret.key}`
                            : `Show ${secret.key}`
                        }
                      >
                        {revealedSecrets.has(secret.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void copySecret(secret)}
                        aria-label={`Copy ${secret.key}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(secret.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => handleEdit(secret)}
                      className="hover:cursor-pointer"
                      aria-label={`Edit ${secret.key}`}
                    >
                      <Edit />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {secret && (
        <EditSecretDialog
          key={secret.id}
          refetch={fetchGroup}
          open={openEditDialog}
          secret={secret}
          setOpen={setOpenEditDialog}
        />
      )}
    </main>
  );
};
