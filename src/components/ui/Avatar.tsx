import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: number
  isLive?: boolean
  isPremium?: boolean
  className?: string
}

function getInitials(name?: string) {
  return name ? name.charAt(0).toUpperCase() : '?'
}

function getColor(name?: string) {
  const colors = [
    'from-purple-500 to-violet-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
  ]
  const idx = name ? name.charCodeAt(0) % colors.length : 0
  return colors[idx]
}

export default function Avatar({ src, name, size = 40, isLive, isPremium, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: size * 0.4 }

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || 'Avatar'}
          style={{ ...style, borderRadius: '50%', objectFit: 'cover' }}
          className="rounded-full"
        />
      ) : (
        <div
          style={style}
          className={cn(
            'rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white',
            getColor(name)
          )}
        >
          {getInitials(name)}
        </div>
      )}

      {isLive && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-live text-white text-[8px] font-black px-1 py-px rounded-full border border-bg-base leading-none"
        >
          LIVE
        </span>
      )}
      {isPremium && !isLive && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-purple-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full border border-bg-base flex items-center justify-center leading-none"
        >
          ★
        </span>
      )}
    </div>
  )
}
