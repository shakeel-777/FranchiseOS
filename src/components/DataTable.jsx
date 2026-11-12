import { useState } from 'react';

// cols: [{ key, label, render?(value, row) }]
export default function DataTable({ cols, data, onRowClick, sortable = false }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  if (!data || !data.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p className="text-muted">No data found</p>
      </div>
    );
  }

  let rows = data;
  if (sortable && sort.key) {
    rows = [...data].sort((a, b) => {
      const aVal = a[sort.key], bVal = b[sort.key];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const aNum = typeof aVal === 'number' ? aVal : parseFloat(aVal);
      const bNum = typeof bVal === 'number' ? bVal : parseFloat(bVal);
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (!isNaN(aNum) && !isNaN(bNum) && String(aVal).trim() !== '' && String(bVal).trim() !== '') {
        return (aNum - bNum) * dir;
      }
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
  }

  function handleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                onClick={sortable ? () => handleSort(c.key) : undefined}
                style={sortable ? { cursor: 'pointer', userSelect: 'none' } : undefined}
              >
                {c.label}
                {sortable && sort.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {cols.map((c) => {
                const raw = row[c.key] !== undefined ? row[c.key] : '';
                return <td key={c.key}>{c.render ? c.render(raw, row) : raw}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
