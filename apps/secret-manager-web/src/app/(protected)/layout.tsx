import { AppHeader } from '../components/AppHeader';
import { AuthProvider } from '../providers/AuthProvider';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppHeader />
      {children}
    </AuthProvider>
  );
}
