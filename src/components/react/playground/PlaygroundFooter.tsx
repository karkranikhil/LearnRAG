export default function PlaygroundFooter() {
  return (
    <footer
      style={{
        padding: '1.25rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(22,19,30,0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: '#636363',
          lineHeight: 1.6,
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '0.875rem' }}>📘</span>
        <p style={{ margin: 0 }}>
          <strong style={{ color: '#8b8b8b' }}>Educational playground</strong> — Interactive visualization of RAG pipeline stages inspired by Salesforce Data Cloud concepts.
          Not an official Salesforce product or simulator. Real implementations differ in naming, services, and behavior.
        </p>
      </div>
    </footer>
  );
}
