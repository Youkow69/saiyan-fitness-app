import { useEffect, useState } from 'react'

const COLORS = ['#FFD700', '#FF8C00', '#FF4500', '#37b7ff', '#32CD32', '#9B59B6', '#FF5F76']

interface Piece {
  id: number
  left: number
  delay: number
  color: string
  size: number
}

export function Confetti({ duration = 3000 }: { duration?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const arr: Piece[] = []
    for (let i = 0; i < 40; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
      })
    }
    setPieces(arr)
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!visible) return null

  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
