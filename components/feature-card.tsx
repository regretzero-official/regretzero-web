type FeatureCardProps = {
  index: string;
  title: string;
  description: string;
};

export function FeatureCard({
  index,
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="feature-card">
      <span className="feature-index">{index}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
