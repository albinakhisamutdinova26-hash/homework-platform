'use client'

interface Props {
  celebrating?: boolean
  size?: number
}

export default function MotivationalCat({ celebrating = false, size = 100 }: Props) {
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <img
        src="/barsik.png"
        alt="Барсик"
        className={`w-full h-full object-contain ${celebrating ? 'animate-bounce' : 'animate-floaty'}`}
        style={{ filter: 'drop-shadow(0 12px 14px rgba(109,59,235,.20))' }}
      />
      {celebrating && (
        <>
          <span className="absolute top-0 left-0 text-xl animate-spark">✨</span>
          <span className="absolute top-4 right-0 text-sm animate-spark-delay">⭐</span>
          <div
            className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl animate-popin"
            style={{ boxShadow: '0 8px 20px rgba(109,59,235,.22)' }}
          >
            🎉
          </div>
        </>
      )}
    </div>
  )
}
