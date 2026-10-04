'use client';
import { Button, Card, CardContent } from '@org/ui';
import React, { useState } from 'react';
import { Step1 } from './_components/Step1';
import { Step2 } from './_components/Step2';
import { ArrowLeft } from 'lucide-react';

const Page = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');

  const COMPONENT_MAP: Record<number, React.ReactNode> = {
    1: <Step1 setStep={setStep} setEmail={setEmail} />,
    2: <Step2 email={email} />,
  };

  const back = () => {
    window.location.href = '/login';
  };

  return (
    <div className="mt-14">
      <div className="flex justify-center gap-6">
        <Button
          onClick={back}
          variant={'outline'}
          className="px-4 py-4 hover:cursor-pointer"
        >
          <ArrowLeft />
        </Button>
        <p className="text-center text-2xl font-bold">Secret manager login</p>
      </div>
      <Card className="max-w-120 mx-auto mt-4">
        <CardContent>{COMPONENT_MAP[step]}</CardContent>
      </Card>
    </div>
  );
};

export default Page;
