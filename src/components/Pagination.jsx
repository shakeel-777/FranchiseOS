export default function Pagination({ page, total, onChange }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="pagination">
      {pages.map((p) => (
        <button key={p} className={`pg-btn${p === page ? ' active' : ''}`} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}
