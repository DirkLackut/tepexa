interface Props {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral'
  className?: string
}

const variantMap: Record<string, string> = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  accent: 'badge-accent',
  neutral: 'badge-neutral',
}

export default function Badge({ children, variant = 'primary', className = '' }: Props) {
  return (
    <span className={`badge ${variantMap[variant]} ${className}`}>
      {children}
    </span>
  )
}
