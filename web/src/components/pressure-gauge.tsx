"use client"

interface PressureGaugeProps {
  value: number
  isEmergency: boolean
}

export default function PressureGauge({ value, isEmergency }: PressureGaugeProps) {
  // Calculate rotation based on pressure (0-100 range maps to -45 to 225 degrees)
  const rotation = (value / 100) * 270 - 45

  // Determine color based on pressure
  const getNeedleColor = () => {
    if (value < 30) return "needle-blue"
    if (value < 70) return "needle-green"
    if (value < 90) return "needle-yellow"
    return "needle-red"
  }

  return (
    <div className="pressure-gauge">
      {/* Gauge background */}
      <div className="gauge-background">
        {/* Pressure markings */}
        {[0, 20, 40, 60, 80, 100].map((mark) => {
          const markRotation = (mark / 100) * 270 - 45
          return (
            <div key={mark} className="pressure-marking" style={{ transform: `rotate(${markRotation}deg)` }}>
              <div className="marking-line"></div>
              <div className="marking-text" style={{ transform: `rotate(${-markRotation}deg)` }}>
                {mark}
              </div>
            </div>
          )
        })}

        {/* Needle */}
        <div className={`pressure-needle ${getNeedleColor()}`} style={{ transform: `rotate(${rotation}deg)` }}>
          <div className={`needle-cap ${getNeedleColor()}`}></div>
        </div>

        {/* Center cap */}
        <div className="dial-center"></div>

        {/* Emergency indicator */}
        {isEmergency && <div className="emergency-overlay"></div>}
      </div>
    </div>
  )
}
