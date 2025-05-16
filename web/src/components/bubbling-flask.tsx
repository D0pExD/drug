"use client"

import { useEffect, useRef } from "react"

interface BubblingFlaskProps {
  intensity: number
  isOverheating: boolean
  isEmergency: boolean
}

export default function BubblingFlask({ intensity, isOverheating, isEmergency }: BubblingFlaskProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubbles = useRef<Array<{ x: number; y: number; size: number; speed: number }>>([])
  const animationRef = useRef<number>(0)

  // Initialize and animate bubbles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Initialize bubbles
    bubbles.current = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 20,
      size: 2 + Math.random() * 6,
      speed: 0.5 + Math.random() * 1.5,
    }))

    // Animation function
    const animate = () => {
      if (!canvas || !ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw flask
      drawFlask(ctx, canvas.width, canvas.height, intensity)

      // Update and draw bubbles
      const bubbleCount = Math.floor((intensity / 100) * 20) + 1
      const activeBubbles = bubbles.current.slice(0, bubbleCount)

      activeBubbles.forEach((bubble) => {
        // Update bubble position
        bubble.y -= bubble.speed * (intensity / 50)

        // Reset bubble if it goes off screen
        if (bubble.y < canvas.height * 0.3) {
          bubble.y = canvas.height + Math.random() * 10
          bubble.x = canvas.width * 0.3 + Math.random() * (canvas.width * 0.4)
          bubble.size = 2 + Math.random() * 6
        }

        // Draw bubble
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
        ctx.fillStyle = isOverheating ? "rgba(239, 68, 68, 0.6)" : "rgba(59, 130, 246, 0.6)"
        ctx.fill()
      })

      // Draw steam if overheating
      if (isOverheating && !isEmergency) {
        drawSteam(ctx, canvas.width, canvas.height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [intensity, isOverheating, isEmergency])

  // Draw the flask
  const drawFlask = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const flaskWidth = width * 0.7
    const flaskHeight = height * 0.8
    const neckWidth = flaskWidth * 0.3
    const neckHeight = flaskHeight * 0.3
    const bodyHeight = flaskHeight - neckHeight

    const x = (width - flaskWidth) / 2
    const y = height - flaskHeight

    // Draw flask outline
    ctx.beginPath()
    ctx.moveTo(x + (flaskWidth - neckWidth) / 2, y)
    ctx.lineTo(x + (flaskWidth - neckWidth) / 2, y + neckHeight)
    ctx.lineTo(x, y + neckHeight + bodyHeight * 0.3)
    ctx.lineTo(x, y + flaskHeight)
    ctx.lineTo(x + flaskWidth, y + flaskHeight)
    ctx.lineTo(x + flaskWidth, y + neckHeight + bodyHeight * 0.3)
    ctx.lineTo(x + (flaskWidth + neckWidth) / 2, y + neckHeight)
    ctx.lineTo(x + (flaskWidth + neckWidth) / 2, y)
    ctx.closePath()
    ctx.strokeStyle = "#71717a"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw liquid
    const liquidHeight = (bodyHeight * intensity) / 100 + neckHeight
    const liquidLevel = y + flaskHeight - liquidHeight

    ctx.beginPath()
    ctx.moveTo(x, y + flaskHeight)
    ctx.lineTo(x, y + neckHeight + bodyHeight * 0.3)
    ctx.lineTo(x + (flaskWidth - neckWidth) / 2, y + neckHeight)

    if (liquidLevel < y + neckHeight) {
      // Liquid in neck
      ctx.lineTo(x + (flaskWidth - neckWidth) / 2, liquidLevel)
      ctx.lineTo(x + (flaskWidth + neckWidth) / 2, liquidLevel)
      ctx.lineTo(x + (flaskWidth + neckWidth) / 2, y + neckHeight)
    } else {
      // Liquid below neck
      ctx.lineTo(x + (flaskWidth - neckWidth) / 2, y + neckHeight)
      ctx.lineTo(x + (flaskWidth + neckWidth) / 2, y + neckHeight)
    }

    ctx.lineTo(x + flaskWidth, y + neckHeight + bodyHeight * 0.3)
    ctx.lineTo(x + flaskWidth, y + flaskHeight)
    ctx.closePath()

    // Liquid color based on intensity and overheating
    let liquidColor
    if (isEmergency) {
      liquidColor = "rgba(100, 100, 100, 0.7)" // Gray for emergency shutdown
    } else if (isOverheating) {
      liquidColor = `rgba(239, 68, 68, ${0.5 + intensity / 200})` // Red for overheating
    } else if (intensity > 80) {
      liquidColor = `rgba(234, 179, 8, ${0.5 + intensity / 200})` // Yellow for high intensity
    } else {
      liquidColor = `rgba(59, 130, 246, ${0.5 + intensity / 200})` // Blue for normal
    }

    ctx.fillStyle = liquidColor
    ctx.fill()
  }

  // Draw steam effect
  const drawSteam = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const topY = height * 0.2

    // Create gradient for steam
    const gradient = ctx.createLinearGradient(centerX, topY, centerX, 0)
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)")
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)")

    // Draw steam particles
    for (let i = 0; i < 5; i++) {
      const offsetX = Math.sin(Date.now() / 1000 + i) * 10
      const size = 5 + Math.sin(Date.now() / 500 + i) * 3
      const y = topY - i * 10 - Math.sin(Date.now() / 700 + i) * 5

      ctx.beginPath()
      ctx.arc(centerX + offsetX, y, size, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    }
  }

  return (
    <div className={`flask-container ${isOverheating ? "shake" : ""}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
