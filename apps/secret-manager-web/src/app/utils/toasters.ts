import { toast } from 'sonner';

export const showToaster = ({
  type,
  title,
  description,
}: {
  type: 'error' | 'success';
  title: string;
  description?: string;
}) => {
  if (type === 'error') {
    return toast.error(title, { description });
  }
  return toast.success(title, { description });
};
