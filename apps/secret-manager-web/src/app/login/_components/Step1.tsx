'use client';
import { Button, Input } from '@org/ui';
import * as yup from 'yup';
import { Formik, Form, ErrorMessage } from 'formik';
import { api, getErrorMessage } from '../../utils/axiosInstance';
import { showToaster } from '../../utils/toasters';

type Step1Type = {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
};

export const Step1 = ({ setStep, setEmail }: Step1Type) => {
  const emailSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
  });

  const sendOtp = async (email: string) => {
    try {
      await api.post('/auth/send-otp', {
        email,
      });

      setStep((prev) => prev + 1);
      setEmail(email);
    } catch (error) {
      showToaster({
        type: 'error',
        title: getErrorMessage(error, 'Failed to send OTP code'),
      });
    }
  };

  return (
    <Formik
      initialValues={{ email: '' }}
      validationSchema={emailSchema}
      onSubmit={(values) => sendOtp(values.email.trim())}
    >
      {({ isValid, dirty, isSubmitting, values, setFieldValue }) => {
        return (
          <Form className="space-y-4">
            <div className="space-y-2">
              <p>Email</p>
              <Input
                name="email"
                type="email"
                value={values.email}
                onChange={(e) => setFieldValue('email', e.target.value)}
                placeholder="example@gmail.com"
              />
              <ErrorMessage
                className="text-red-500 text-xs"
                name="email"
                component="div"
              />
            </div>

            <Button
              type="submit"
              disabled={!isValid || !dirty || isSubmitting}
              className="w-full py-4 hover:cursor-pointer"
            >
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
};
