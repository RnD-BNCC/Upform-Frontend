import { SpinnerGapIcon } from '@phosphor-icons/react'

type Props = {
  size?: number
  className?: string
}

export default function Spinner({ size = 14, className = '' }: Props) {
  return <SpinnerGapIcon size={size} className={`animate-spin ${className}`} />
}
