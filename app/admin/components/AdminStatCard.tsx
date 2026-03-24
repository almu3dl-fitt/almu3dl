type AdminStatCardProps = {
  label: string
  value: string
  helper?: string
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
}

export default function AdminStatCard({
  label,
  value,
  helper,
  tone = 'default',
}: AdminStatCardProps) {
  const className = tone === 'default'
    ? 'admin-stat-card'
    : `admin-stat-card is-${tone}`

  return (
    <div className={className}>
      <span className="admin-stat-label">{label}</span>
      <strong className="admin-stat-value">{value}</strong>
      {helper ? <span className="admin-stat-helper">{helper}</span> : null}
    </div>
  )
}
