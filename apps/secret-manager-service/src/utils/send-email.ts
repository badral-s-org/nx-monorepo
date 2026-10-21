import { Resend } from 'resend';
import type { Bindings } from '../types';

export const sendEmail = async (
  env: Bindings,
  {
    to,
    content,
    subject,
  }: {
    to: string;
    content: string;
    subject: string;
  },
) => {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [to],
    subject,
    html: content,
  });

  if (error) throw new Error(`Failed to send email: ${error.message}`);
};
