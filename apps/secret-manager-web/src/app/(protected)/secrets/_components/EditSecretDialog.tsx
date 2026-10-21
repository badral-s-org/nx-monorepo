import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@org/ui';
import { Dispatch, SetStateAction, useState } from 'react';
import { Secret } from '../types';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { api, getErrorMessage } from '../../../utils/axiosInstance';
import { showToaster } from '../../../utils/toasters';

type EditSecretDialogProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  secret: Secret;
  refetch: () => Promise<void>;
};

export const EditSecretDialog = ({
  open,
  setOpen,
  secret,
  refetch,
}: EditSecretDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [newSecret, setNewSecret] = useState({
    key: secret.key,
    value: secret.secret,
  });

  const [showValues, setShowValues] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/secrets/update-secret/${secret.id}`, {
        key: newSecret.key.trim(),
        value: newSecret.value,
      });
      showToaster({ type: 'success', title: 'Successfully updated' });
      setOpen(false);
      await refetch();
    } catch (error) {
      showToaster({
        type: 'error',
        title: getErrorMessage(error, 'Failed to update secret'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateSecret = (field: 'key' | 'value', value: string) => {
    setNewSecret((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Update secret</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor={`key-${secret.id}`}>Key</Label>
                <Input
                  id={`key-${secret.id}`}
                  placeholder="e.g. DATABASE_URL"
                  value={newSecret.key}
                  onChange={(event) => updateSecret('key', event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`value-${secret.id}`}>Value</Label>
                <div className="flex gap-2">
                  <Input
                    id={`value-${secret.id}`}
                    type={showValues ? 'text' : 'password'}
                    placeholder="Enter secret value"
                    value={newSecret.value}
                    onChange={(event) =>
                      updateSecret('value', event.target.value)
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
                    aria-label={showValues ? 'Hide values' : 'Show values'}
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Saving...' : `Save`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
