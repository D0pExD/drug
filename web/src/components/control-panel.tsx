"use client"

import { Slider } from "@/components/ui/slider"


import { Switch } from "@/components/ui/switch"


import { useState } from "react"

interface ControlPanelProps {
  temperature: number
  setTemperature: (value: number) => void
  pressure: number
  setPressure: (value: number) => void
  isEmergency: boolean
}






export default function ControlPanel({
  temperature,
  setTemperature,
  pressure,
  setPressure,
  isEmergency,
}: ControlPanelProps) {
  const [heatingEnabled, setHeatingEnabled] = useState(true)
  const [coolingEnabled, setCoolingEnabled] = useState(true)







  // Handle temperature change with constraints
  const handleTemperatureChange = (value: number[]) => {
    if (!isEmergency) {
      setTemperature(value[0])
    }
  }

  // Handle pressure change with constraints
  const handlePressureChange = (value: number[]) => {
    if (!isEmergency) {
      setPressure(value[0])
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <div className="control-row">
          <label className="control-label">HEATING ELEMENT</label>
          <Switch
            checked={heatingEnabled}
            onCheckedChange={setHeatingEnabled}
            disabled={isEmergency}
            className="data-[state=checked]:bg-yellow-600"
          />
        </div>

        <div className="control-row">
          <label className="control-label">COOLING SYSTEM</label>
          <Switch
            checked={coolingEnabled}
            onCheckedChange={setCoolingEnabled}
            disabled={isEmergency}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </div>

      <div className="slider-container">
        <div className="slider-header">
          <label className="control-label">TEMPERATURE</label>
          <span className="slider-value">{temperature}°C</span>
        </div>
        <Slider
          value={[temperature]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleTemperatureChange}
          disabled={isEmergency || (!heatingEnabled && !coolingEnabled)}
          className={isEmergency ? "opacity-50" : ""}
        />
        <div className="slider-ticks">
          <span>0°C</span>
          <span>50°C</span>
          <span>100°C</span>
        </div>
      </div>

      <div className="slider-container">
        <div className="slider-header">
          <label className="control-label">PRESSURE</label>
          <span className="slider-value">{pressure} PSI</span>
        </div>
        <Slider
          value={[pressure]}
          min={0}
          max={100}
          step={1}
          onValueChange={handlePressureChange}
          disabled={isEmergency}
          className={isEmergency ? "opacity-50" : ""}
        />
        <div className="slider-ticks">
          <span>0 PSI</span>
          <span>50 PSI</span>
          <span>100 PSI</span>
        </div>
      </div>
    </div>
  )
}
