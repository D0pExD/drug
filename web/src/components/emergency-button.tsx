"use client"

import { useState } from "react"

interface EmergencyButtonProps {
  onActivate: () => void
}

export default function EmergencyButton({ onActivate }: EmergencyButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    setIsPressed(true)
    onActivate()

    // Reset button state after animation
    setTimeout(() => {
      setIsPressed(false)
    }, 1000)
  }

  return (
    <div className="emergency-button-container">
      <div className="emergency-ping"></div>
      <button onClick={handleClick} disabled={isPressed} className={`emergency-button ${isPressed ? "pressed" : ""}`}>
        <div className="button-ripple">
          <div className={`ripple-effect ${isPressed ? "active" : ""}`}></div>
        </div>

        <div className="button-content">
          <div className="button-indicator"></div>
          <span className="button-text">EMERGENCY SHUTDOWN</span>
        </div>
      </button>
    </div>
  )
}
