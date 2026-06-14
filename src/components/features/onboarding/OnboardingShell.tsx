'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { WelcomeStep } from './WelcomeStep'
import { CaptureLoopStep } from './CaptureLoopStep'

interface OnboardingShellProps {
  userName: string
}

export function OnboardingShell({ userName }: OnboardingShellProps) {
  const [step, setStep] = useState<1 | 2>(1)

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <WelcomeStep
            key="welcome"
            userName={userName}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <CaptureLoopStep key="capture" />
        )}
      </AnimatePresence>
    </div>
  )
}
