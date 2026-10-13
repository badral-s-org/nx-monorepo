'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../utils/axiosInstance';
import { AddSecretsDialog } from './_components/AddSecretsDialog';

interface Secret {
  id: number;
  groupId: number;
  key: string;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

interface SecretGroup {
  id: number;
  name: string;
  secrets: Secret[];
}

const Page = () => {
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');

  const [group, setGroup] = useState<SecretGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!groupId) {
      setError('Group ID is missing.');
      setLoading(false);
      return;
    }

    const fetchGroup = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get(`/secrets/get-secrets/${groupId}`);
        const group: SecretGroup = response.data.data;

        if (!group) {
          setError('Group not found.');
          return;
        }

        setGroup(group);
      } catch {
        setError('Failed to load secrets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    void fetchGroup();
  }, [groupId]);

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  if (!group) return null;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <AddSecretsDialog />
    </main>
  );
};

export default Page;
