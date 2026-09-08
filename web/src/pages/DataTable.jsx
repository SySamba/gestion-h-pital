import React, { useEffect, useState } from 'react';

export default function DataTable({ title, fetchFn, data, columns, actions }) {
  const [rows, setRows] = useState(data || []);
  const [loading, setLoading] = useState(!data && !!fetchFn);
  const [error, setError] = useState('');

  const load = () => {
    if (!fetchFn) return;
    setLoading(true);
    fetchFn()
      .then((r) => setRows(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (data) {
      setRows(data);
      setLoading(false);
    } else if (fetchFn) {
      load();
    }
  }, [data, fetchFn]);

  return (
    <div>
      {(title || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {title ? <h1 className="page-title">{title}</h1> : <div />}
          {actions}
        </div>
      )}
      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
      <div className="card">
        {loading ? (
          <p className="empty">Chargement...</p>
        ) : rows.length === 0 ? (
          <p className="empty">Aucune donnée</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function Badge({ status, label }) {
  if (!status) return null;
  const text = label || status.replace(/_/g, ' ');
  return <span className={`badge badge-${status}`}>{text}</span>;
}
