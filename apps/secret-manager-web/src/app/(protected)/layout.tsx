import { AuthProvider } from '../providers/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <AuthProvider>{children}</AuthProvider>
    </div>
  );
}
