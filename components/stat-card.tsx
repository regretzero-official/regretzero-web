type StatCardProps = {
  value: string;
  label: string;
  detail: string;
};

export function StatCard({ value, label, detail }: StatCardProps) {
  return (
    <article className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{detail}</p>
    </article>
  );
}
