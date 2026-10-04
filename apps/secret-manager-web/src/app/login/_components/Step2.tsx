'use client';
import { Button, InputOTP, InputOTPGroup, InputOTPSlot } from '@org/ui';
import * as yup from 'yup';
import { Formik, Form, ErrorMessage } from 'formik';
import { api } from '../../utils/axiosInstance';
import axios from 'axios';
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
      if (axios.isAxiosError(error)) {
        const errorResponse = error.response;
        showToaster({
          type: 'error',
          title: errorResponse?.data.message,
        });
      }
    }
  };

  return (
    <Formik
      initialValues={{ otp: '' }}
      validationSchema={otpSchema}
      onSubmit={(values) => {
        verifyOtp(values.otp);
      }}
    >
      {({ errors, touched, isValid, dirty, values, setFieldValue }) => {
        return (
          <Form className="space-y-4">
            <div className="space-y-2">
              <p className="text-xl text-center">Enter recieved OTP code</p>
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
              disabled={values.otp.length !== 6}
              type="submit"
              className="w-full py-4"
            >
              Login
            </Button>
          </Form>
        );
      }}
    </Formik>
  );
};
