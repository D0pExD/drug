"use client"

import { useState, useEffect } from "react"

interface TemperatureDialProps {
  value: number
  isOverheating: boolean
  isEmergency: boolean
}

export default function TemperatureDial({ value, isOverheating, isEmergency }: TemperatureDialProps) {
  const [shake, setShake] = useState(false)

  // Calculate rotation based on temperature (0-100 range maps to 0-180 degrees)
  const rotation = (value / 100) * 180

  // Trigger shaking effect when overheating
  useEffect(() => {
    if (isOverheating && !isEmergency) {
      const interval = setInterval(() => {
        setShake((prev) => !prev)
      }, 200)

      return () => clearInterval(interval)
    } else {
      setShake(false)
    }
  }, [isOverheating, isEmergency])

  return (
    <div className={`temperature-dial ${shake ? "shake" : ""}`}>
      {/* Dial background */}
      <div className="dial-background">
        {/* Temperature markings */}
        {[0, 20, 40, 60, 80, 100].map((mark) => {
          const markRotation = (mark / 100) * 180 - 90
          return (
            <div key={mark} className="temperature-marking" style={{ transform: `rotate(${markRotation}deg)` }}>
              <div className="marking-line"></div>
              <div className="marking-text">{mark}°</div>
            </div>
          )
        })}

        {/* Color zones */}
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <path d="M50 10 A 40 40 0 0 1 90 50" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
          <path d="M90 50 A 40 40 0 0 1 70 85" fill="none" stroke="#eab308" strokeWidth="8" strokeLinecap="round" />
          <path d="M70 85 A 40 40 0 0 1 50 90" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
        </svg>

        {/* Needle */}
        <div className="temperature-needle" style={{ transform: `rotate(${rotation - 90}deg)` }}>
          <div className="needle-cap"></div>
        </div>

        {/* Center cap */}
        <div className="dial-center"></div>
      </div>

      {/* Warning indicator */}
      {isOverheating && <div className="warning-dot"></div>}
    </div>
  )
}
