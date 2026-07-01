import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/services/api';

interface LogRow {
  id: string;
  userId: string | null;
  userEmail: string | null;
  message: string;
  reply: string;
  toolCalls: string;
  options: string;
  products: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

const safeParse = (s: string): any[] => { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };

const ConciergeLogs: React.FC = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res: any = await apiClient.get(`/admin/concierge-logs?page=${p}&limit=25`);
      const d = res?.data ?? res;
      setRows(d.items || []);
      setTotalPages(d.totalPages || 1);
      setTotal(d.total || 0);
      setPage(d.page || p);
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Link to="/admin/dashboard" className="hover:underline">Admin</Link><span>/</span><span>AI Concierge Logs</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Concierge Logs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{total} conversations · every prompt, reply, tool call and result</p>
          </div>
          <button onClick={() => load(page)} className="px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            {loading ? '…' : 'Refresh'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium">User</th>
                  <th className="text-left px-4 py-2.5 font-medium">Prompt</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tools</th>
                  <th className="text-left px-4 py-2.5 font-medium">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((r) => {
                  const tools = safeParse(r.toolCalls);
                  const opts = safeParse(r.options); const prods = safeParse(r.products);
                  const isOpen = expanded === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr onClick={() => setExpanded(isOpen ? null : r.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 align-top">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 text-xs">{r.userEmail || r.userId?.slice(0, 8) || '—'}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-xs truncate">{r.message}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {tools.map((t: any, i: number) => (
                              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.ok ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{t.name}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{opts.length} svc · {prods.length} prod</td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-gray-50/70 dark:bg-gray-900/30">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="space-y-3 text-xs">
                              <div><span className="font-semibold text-gray-500">Prompt:</span> <span className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{r.message}</span></div>
                              <div><span className="font-semibold text-gray-500">Reply:</span> <span className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{r.reply}</span></div>
                              <div><span className="font-semibold text-gray-500">Tool calls:</span>
                                <pre className="mt-1 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto">{JSON.stringify(tools, null, 2)}</pre>
                              </div>
                              {(opts.length > 0 || prods.length > 0) && (
                                <div><span className="font-semibold text-gray-500">Results:</span>
                                  <pre className="mt-1 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto">{JSON.stringify({ options: opts, products: prods }, null, 2)}</pre>
                                </div>
                              )}
                              {r.lat != null && <div className="text-gray-400">location: {r.lat}, {r.lng}</div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {rows.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No conversations yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <button disabled={page <= 1 || loading} onClick={() => load(page - 1)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40">← Prev</button>
          <span className="text-gray-500">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages || loading} onClick={() => load(page + 1)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40">Next →</button>
        </div>
      </div>
    </div>
  );
};

export default ConciergeLogs;
