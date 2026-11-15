interface Props {
  label: string
  value: string | number
  unit?: string
  icon?: string
  iconBg?: string
}

export default function StatCard({ label, value, unit, icon, iconBg }: Props) {
  return (
    <div className="stat-card animate-fadein">
      {icon && (
        <div
          className="stat-card-icon"
          style={{ background: iconBg ?? 'rgba(232,82,26,0.1)' }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">
        {value}
        {unit && <span className="stat-card-unit">{unit}</span>}
      </div>
    </div>
  )
}
