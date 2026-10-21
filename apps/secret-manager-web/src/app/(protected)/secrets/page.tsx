import { Suspense } from 'react';
import { AddSecretsDialog } from './_components/AddSecretsDialog';

// The group is loaded on the client from the `groupId` search param.
const Page = () => {
  return (
    <Suspense fallback={<main className="p-6">Loading secrets...</main>}>
      <AddSecretsDialog />
    </Suspense>
  );
};

export default Page;
