type Metric = {
  label: string;
  tone: "active" | "draft" | "inactive" | "total";
  value: string;
};

type StreamsToolbarProps = {
  metrics: readonly Metric[];
  onCreateStream: () => void;
};

export function StreamsToolbar({ metrics, onCreateStream }: StreamsToolbarProps) {
  return (
    <>
      <header className="content-header">
        <div>
          <h1 className="content-title">Streams</h1>
          <p className="content-subtitle">
            Manage catalog records, review read-only details, and maintain stream CRUD data through the backoffice API.
          </p>
        </div>
        <button className="primary-button" onClick={onCreateStream} type="button">
          + Create Stream
        </button>
      </header>

      <section aria-label="Stream metrics" className="metrics-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-header">
              <span aria-hidden="true" className="metric-dot" data-tone={metric.tone} />
              <span>{metric.label}</span>
            </div>
            <p className="metric-value">{metric.value}</p>
          </article>
        ))}
      </section>
    </>
  );
}
