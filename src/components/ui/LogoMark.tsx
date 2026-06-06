import type { SVGProps } from 'react'

interface LogoMarkProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function LogoMark({ size = 32, ...props }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id="mark-gradient"
          x1="20" y1="1"
          x2="20" y2="39"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stopColor="#F0B464" />
          <stop offset="42%"  stopColor="#E85840" />
          <stop offset="100%" stopColor="#C23828" />
        </linearGradient>
      </defs>
      {/*
        4-pointed sparkle (faísca).
        Quadratic bezier — inner radius r≈6 at 45° gives moderate concavity.
        Outer tips: N(20,1) E(39,20) S(20,39) W(1,20).
        Concave control points: (24.24,15.76) (24.24,24.24) (15.76,24.24) (15.76,15.76)
      */}
      <path
        d="M20,1 Q24.24,15.76 39,20 Q24.24,24.24 20,39 Q15.76,24.24 1,20 Q15.76,15.76 20,1 Z"
        fill="url(#mark-gradient)"
      />
    </svg>
  )
}
