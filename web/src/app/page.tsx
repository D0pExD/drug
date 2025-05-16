"use client"

import { useState, useEffect } from "react"
import TemperatureDial from "@/components/temperature-dial"
import PressureGauge from "@/components/pressure-gauge"
import WarningIndicator from "@/components/warning-indicator"
import ControlPanel from "@/components/control-panel"
import BubblingFlask from "@/components/bubbling-flask"
import EmergencyButton from "@/components/emergency-button"
import { useFiveM } from "@/hooks/use-fivem"
import "@/app/styles.css"

// Debug utility
const DEBUG = false
const debug = (label: string, ...data: any[]) => {
  if (DEBUG) {
    console.log(`[ChemicalLab][${label}]`, ...data)
  }
}

// Safe defaults for zones
const DEFAULT_SAFE_ZONES = {
  temperature: { min: 65, max: 80 },
  pressure: { min: 40, max: 60 }
};

export default function ChemicalLabUI() {
  const [temperature, setTemperature] = useState(75)
  const [pressure, setPressure] = useState(42)
  const [isOverheating, setIsOverheating] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false)
  const [reactionIntensity, setReactionIntensity] = useState(0)
  const [timeLeft, setTimeLeft] = useState(90)
  const [isActive, setIsActive] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [safeZones, setSafeZones] = useState(DEFAULT_SAFE_ZONES)

  // Use the FiveM communication hook
  const { closeUI, completeMinigame } = useFiveM()

  // Initial render debug
  useEffect(() => {
    debug('Mount', 'Component mounted')
    return () => debug('Unmount', 'Component unmounted')
  }, [])

  // Listen for messages from FiveM
  useEffect(() => {
    debug('Listeners', 'Setting up message event listener')
    
    const handleMessage = (event: MessageEvent) => {
      const { data } = event
      
      debug('Message', 'Received message event:', data)
      
      if (data && typeof data === 'object') {
        // Handle startMinigame message
        if (data.type === 'startMinigame') {
          debug('Minigame', 'Starting minigame with data:', data)
          
          // Set initial values from FiveM
          if (data.duration) {
            setTimeLeft(data.duration)
            debug('Time', `Setting duration to ${data.duration}`)
          }
          
          if (data.currentState) {
            debug('State', 'Setting initial state:', data.currentState)
            if (data.currentState.temperature) {
              setTemperature(data.currentState.temperature)
              debug('Temperature', `Initial temperature: ${data.currentState.temperature}`)
            }
            if (data.currentState.pressure) {
              setPressure(data.currentState.pressure)
              debug('Pressure', `Initial pressure: ${data.currentState.pressure}`)
            }
          }
          
          if (data.safeZones) {
            // Process the safeZones data to ensure it has the right structure
            const processedSafeZones = {
              temperature: { 
                min: 65, 
                max: 80 
              },
              pressure: { 
                min: 40, 
                max: 60 
              }
            };
            
            // Handle case where Temperature is capitalized
            if (data.safeZones.Temperature) {
              processedSafeZones.temperature = {
                min: data.safeZones.Temperature.min ?? DEFAULT_SAFE_ZONES.temperature.min,
                max: data.safeZones.Temperature.max ?? DEFAULT_SAFE_ZONES.temperature.max
              };
            } else if (data.safeZones.temperature) {
              processedSafeZones.temperature = {
                min: data.safeZones.temperature.min ?? DEFAULT_SAFE_ZONES.temperature.min,
                max: data.safeZones.temperature.max ?? DEFAULT_SAFE_ZONES.temperature.max
              };
            }
            
            // Handle case where Pressure is capitalized
            if (data.safeZones.Pressure) {
              processedSafeZones.pressure = {
                min: data.safeZones.Pressure.min ?? DEFAULT_SAFE_ZONES.pressure.min,
                max: data.safeZones.Pressure.max ?? DEFAULT_SAFE_ZONES.pressure.max
              };
            } else if (data.safeZones.pressure) {
              processedSafeZones.pressure = {
                min: data.safeZones.pressure.min ?? DEFAULT_SAFE_ZONES.pressure.min,
                max: data.safeZones.pressure.max ?? DEFAULT_SAFE_ZONES.pressure.max
              };
            }
            
            setSafeZones(processedSafeZones);
            debug('SafeZones', 'Setting processed safe zones:', processedSafeZones);
          }
          
          // Show the UI and start the minigame
          setIsVisible(true)
          setIsActive(true)
          debug('UI', 'UI is now visible and active')
        }
        // Handle closeUI message
        else if (data.type === 'closeUI') {
          debug('Close', 'Closing UI with data:', data);
          
          // If it's not already an emergency and this is a cancel request, 
          // send the current state back to the Lua script first
          if (!isEmergency && data.cancelled) {
            closeUI({ 
              cancelled: true,
              temperature: temperature,
              pressure: pressure,
              timeLeft: timeLeft
            });
          }
          
          // Then hide the UI
          setIsActive(false);
          setIsVisible(false);
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      debug('Listeners', 'Removing message event listener')
      window.removeEventListener('message', handleMessage)
    }
  }, [closeUI, temperature, pressure, timeLeft, isEmergency])

  // Add ESC key handler to close the UI
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        debug('Input', 'ESC key pressed, closing UI with current values');
        closeUI({ 
          cancelled: true,
          temperature: temperature,
          pressure: pressure,
          timeLeft: timeLeft
        });
        setIsActive(false);
        setIsVisible(false);
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [closeUI, isVisible, temperature, pressure, timeLeft]);

  // Update reaction intensity based on temperature
  useEffect(() => {
    const newIntensity = Math.min(100, Math.max(0, (temperature - 50) * 2))
    setReactionIntensity(newIntensity)
    
    const newOverheating = temperature > 90
    setIsOverheating(newOverheating)
    
    debug('Temperature', `Temperature changed to ${temperature}°C, intensity: ${newIntensity}, overheating: ${newOverheating}`)
  }, [temperature])
  
  // Timer effect for countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (isActive && timeLeft > 0) {
      debug('Timer', `Timer active with ${timeLeft}s remaining`)
      
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          
          if (newTime <= 0) {
            // Timer completed - check if temp and pressure are in safe zones
            const tempMin = safeZones?.temperature?.min ?? DEFAULT_SAFE_ZONES.temperature.min;
            const tempMax = safeZones?.temperature?.max ?? DEFAULT_SAFE_ZONES.temperature.max;
            const pressMin = safeZones?.pressure?.min ?? DEFAULT_SAFE_ZONES.pressure.min;
            const pressMax = safeZones?.pressure?.max ?? DEFAULT_SAFE_ZONES.pressure.max;
            
            const tempInSafeZone = temperature >= tempMin && temperature <= tempMax;
            const pressureInSafeZone = pressure >= pressMin && pressure <= pressMax;
            
            const success = tempInSafeZone && pressureInSafeZone
            
            debug('Completion', `Minigame completed: success=${success}, temp=${temperature}, pressure=${pressure}, emergency=${isEmergency}`)
            
            // Complete the minigame
            completeMinigame(success, temperature, pressure, 0, isEmergency)
            setIsActive(false)
            
            // Hide the UI after completion
            setTimeout(() => {
              setIsVisible(false)
              debug('UI', 'UI hidden after completion')
            }, 1500)
            
            if (timer) clearInterval(timer)
          }
          
          if (newTime % 10 === 0 || newTime <= 5) {
            debug('Timer', `Time remaining: ${newTime}s`)
          }
          
          return newTime
        })
      }, 1000)
    } else if (!isActive && timer) {
      debug('Timer', 'Timer stopped')
    }
    
    return () => {
      if (timer) {
        debug('Timer', 'Cleaning up timer')
        clearInterval(timer)
      }
    }
  }, [isActive, timeLeft, temperature, pressure, completeMinigame, isEmergency, safeZones])

  // Handle emergency shutdown
  const handleEmergencyShutdown = () => {
    debug('Emergency', 'Emergency shutdown triggered');
    
    setIsEmergency(true);
    setTemperature(30);
    setPressure(20);
    
    // Send emergency shutdown to FiveM
    debug('FiveM', 'Sending emergency completion to FiveM');
    completeMinigame(false, 30, 20, timeLeft, true);
    setIsActive(false);

    // Reset emergency state after 3 seconds and hide UI
    setTimeout(() => {
      setIsEmergency(false);
      debug('UI', 'Closing UI after emergency');
      closeUI({ 
        emergency: true,
        temperature: 30,
        pressure: 20,
        timeLeft: timeLeft
      });
      setIsVisible(false);
    }, 3000);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // If UI is not visible, don't render anything
  if (!isVisible) {
    return null
  }

  debug('Render', `Rendering with temp=${temperature}, pressure=${pressure}, active=${isActive}, time=${timeLeft}`)

  return (
    <main className="lab-container">
      {/* Stained overlay effect */}
      <div className="stained-overlay"></div>

      <div className="lab-content">
        <div className="flex flex-col gap-6">
          {/* Lab header with warning lights */}
          <header className="lab-header">
            <div className="flex items-center gap-3">
              <div className={`status-indicator ${isOverheating ? "status-warning" : "status-active"}`}></div>
              <h1 className="lab-title">CHEMICAL PROCESSING CONTROL</h1>
            </div>
            <div className="system-status">
              {isActive ? `TIME: ${formatTime(timeLeft)}` : isEmergency ? "SYSTEM SHUTDOWN" : "SYSTEM ACTIVE"}
            </div>
          </header>

          <div className="panel-grid">
            {/* Left panel - Temperature and Pressure */}
            <div className="lab-panel">
              <div className="text-center">
                <h2 className="panel-title">REACTOR TEMPERATURE</h2>
                <TemperatureDial value={temperature} isOverheating={isOverheating} isEmergency={isEmergency} />
                <div className="mt-4 font-mono text-xl">{temperature}°C</div>
                {isActive && (
                  <div className="safe-zone-indicator">
                    SAFE: {safeZones?.temperature?.min ?? DEFAULT_SAFE_ZONES.temperature.min}°C - {safeZones?.temperature?.max ?? DEFAULT_SAFE_ZONES.temperature.max}°C
                  </div>
                )}
              </div>

              <div className="text-center mt-6">
                <h2 className="panel-title">PRESSURE VALVE</h2>
                <PressureGauge value={pressure} isEmergency={isEmergency} />
                <div className="mt-4 font-mono text-xl">{pressure} PSI</div>
                {isActive && (
                  <div className="safe-zone-indicator">
                    SAFE: {safeZones?.pressure?.min ?? DEFAULT_SAFE_ZONES.pressure.min} - {safeZones?.pressure?.max ?? DEFAULT_SAFE_ZONES.pressure.max} PSI
                  </div>
                )}
              </div>
            </div>

            {/* Middle panel - Visual Indicators */}
            <div className="lab-panel">
              <h2 className="panel-title">REACTION MONITOR</h2>

              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <BubblingFlask intensity={reactionIntensity} isOverheating={isOverheating} isEmergency={isEmergency} />

                <WarningIndicator isActive={isOverheating} message="TEMPERATURE CRITICAL" />

                <div className="w-full mt-4">
                  <div className="section-title">REACTION INTENSITY</div>
                  <div className="w-full bg-zinc-700 h-4 rounded-sm overflow-hidden border border-zinc-600">
                    <div
                      className={`h-full ${
                        reactionIntensity > 80
                          ? "bg-red-500"
                          : reactionIntensity > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      } transition-all duration-500`}
                      style={{ width: `${reactionIntensity}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel - Controls */}
            <div className="lab-panel">
              <h2 className="panel-title">CONTROL PANEL</h2>

              <ControlPanel
                temperature={temperature}
                setTemperature={setTemperature}
                pressure={pressure}
                setPressure={setPressure}
                isEmergency={isEmergency}
              />

              <div className="mt-auto">
                <EmergencyButton onActivate={handleEmergencyShutdown} />
              </div>
            </div>
          </div>

          {/* Bottom status panel */}
          <div className="status-panel">
            <div className="status-row">
              <div>STATUS: {isOverheating ? "WARNING - TEMPERATURE EXCEEDS SAFE LEVELS" : "NORMAL OPERATION"}</div>
              <div className="status-date">
                {isActive ? 
                  `${temperature >= (safeZones?.temperature?.min ?? DEFAULT_SAFE_ZONES.temperature.min) && 
                     temperature <= (safeZones?.temperature?.max ?? DEFAULT_SAFE_ZONES.temperature.max) ? "✓" : "✗"} TEMP | 
                   ${pressure >= (safeZones?.pressure?.min ?? DEFAULT_SAFE_ZONES.pressure.min) && 
                     pressure <= (safeZones?.pressure?.max ?? DEFAULT_SAFE_ZONES.pressure.max) ? "✓" : "✗"} PRESSURE` : 
                  "LAST CALIBRATION: 05/15/2025"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
