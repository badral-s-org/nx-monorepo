'use client';
import Link from 'next/link';
import { KeyRound, LogOut } from 'lucide-react';
import { Button } from '@org/ui';
import { useAuth } from '../providers/AuthProvider';

export const AppHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <KeyRound className="h-5 w-5" />
          Secret Manager
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm text-muted-foreground">
            {user.email}
          </span>
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};
