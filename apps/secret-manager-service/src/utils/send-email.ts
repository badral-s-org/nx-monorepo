import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  content,
  subject,
}: {
  to: string;
  content: string;
  subject: string;
}) => {
  const { error } = await resend.emails.send({
    from: 'noreply@expense.tiim.mn',
    to: [to],
    subject: subject,
    html: content,
  });

  if (error) throw new Error((error as Error).message);
};
