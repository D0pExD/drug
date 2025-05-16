"use client"

import { useEffect, useCallback } from 'react'

interface FiveMMessage {
  type: string
  data?: any
}

// Default data to send if not provided
const DEFAULT_UI_DATA = {
  temperature: 0,
  pressure: 0,
  timeLeft: 0,
  emergency: false,
  cancelled: false
};

// Hook for FiveM NUI communication
export function useFiveM() {
  // Function to send message to FiveM client
  const sendMessage = useCallback((event: string, data: any = {}) => {
    // Check if we're in FiveM context
    if ('window' in global && 'fetch' in window) {
      try {
        // This special domain is used by FiveM for NUI communication
        fetch(`https://drug/${event}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify(data),
        })
        console.log(`[NUI] Sent "${event}" to FiveM:`, data)
      } catch (error) {
        console.error('[NUI] Error sending message to FiveM:', error)
      }
    } else {
      console.log(`[NUI DEV] Would send "${event}" to FiveM:`, data)
    }
  }, [])

  // Setup event listener for messages from FiveM
  useEffect(() => {
    const handleMessage = (event: MessageEvent<FiveMMessage>) => {
      const { data } = event
      
      // Only handle messages from our resource
      if (data && typeof data === 'object') {
        console.log('[NUI] Received message from FiveM:', data)
      }
    }

    window.addEventListener('message', handleMessage)
    
    // Notify FiveM that UI is ready - but doesn't make it visible
    sendMessage('uiReady')
    
    // Handle ESC key to cancel minigame is now handled in the main component
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [sendMessage])

  // Close UI and send final data to client
  const closeUI = useCallback((data: any = {}) => {
    // Ensure all expected properties are included
    const completeData = {
      ...DEFAULT_UI_DATA,
      ...data,
      timestamp: Date.now() // Add timestamp to ensure message is seen as unique
    };
    
    console.log('[NUI] Closing UI with data:', completeData)
    
    // First send message to FiveM with the state
    sendMessage('closeUI', completeData)
    
    // Then dispatch local message to ensure UI updates
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'closeUI',
          ...completeData
        }
      })
    );
  }, [sendMessage])

  // Notify client that the minigame is complete
  const completeMinigame = useCallback((success: boolean, temperature: number, pressure: number, timeLeft: number = 0, emergency: boolean = false) => {
    const completeData = {
      success,
      temperature,
      pressure,
      timeLeft,
      emergency,
      timestamp: Date.now() // Add timestamp to ensure message is seen as unique
    };
    
    console.log('[NUI] Completing minigame:', completeData)
    sendMessage('minigameComplete', completeData)
  }, [sendMessage])

  return {
    sendMessage,
    closeUI,
    completeMinigame
  }
} 