interface WarningIndicatorProps {
  isActive: boolean
  message: string
}

export default function WarningIndicator({ isActive, message }: WarningIndicatorProps) {
  if (!isActive) return null



  
  return (
    <div className="warning-indicator">
      <div className="warning-dot"></div>
      <div className="warning-text">{message}</div>
    </div>
  )
}
