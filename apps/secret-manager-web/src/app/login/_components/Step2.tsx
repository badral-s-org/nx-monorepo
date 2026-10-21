'use client';
import { Button, InputOTP, InputOTPGroup, InputOTPSlot } from '@org/ui';
import * as yup from 'yup';
import { Formik, Form, ErrorMessage } from 'formik';
import { api, getErrorMessage } from '../../utils/axiosInstance';
import { showToaster } from '../../utils/toasters';

export const Step2 = ({ email }: { email: string }) => {
  const otpSchema = yup.object({
    otp: yup
      .string()
      .length(6, 'Enter six digits OTP')
      .required('OTP is required'),
  });

  const verifyOtp = async (otp: string) => {
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
      });

      if (response.data.success) {
        showToaster({
          type: 'success',
          title: response.data.message,
        });
        window.location.href = '/';
      }
    } catch (error) {
      showToaster({
        type: 'error',
        title: getErrorMessage(error, 'Failed to verify OTP code'),
      });
    }
  };

  return (
    <Formik
      initialValues={{ otp: '' }}
      validationSchema={otpSchema}
      onSubmit={(values) => verifyOtp(values.otp)}
    >
      {({ isSubmitting, values, setFieldValue }) => {
        return (
          <Form className="space-y-4">
            <div className="space-y-2">
              <p className="text-xl text-center">
                Enter the OTP code sent to {email}
              </p>
              <InputOTP
                className="w-full"
                name="otp"
                maxLength={6}
                value={values.otp}
                onChange={(value) => setFieldValue('otp', value)}
              >
                <InputOTPGroup className="w-full justify-center">
                  <InputOTPSlot index={0} className="size-12" />
                  <InputOTPSlot index={1} className="size-12" />
                  <InputOTPSlot index={2} className="size-12" />
                  <InputOTPSlot index={3} className="size-12" />
                  <InputOTPSlot index={4} className="size-12" />
                  <InputOTPSlot index={5} className="size-12" />
                </InputOTPGroup>
              </InputOTP>
              <ErrorMessage
                name="otp"
                className="text-red-500"
                component="div"
              />
            </div>

            <Button
              disabled={values.otp.length !== 6 || isSubmitting}
              type="submit"
              className="w-full py-4"
            >
              {isSubmitting ? 'Verifying...' : 'Login'}
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
};
