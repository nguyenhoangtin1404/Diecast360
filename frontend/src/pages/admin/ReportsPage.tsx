import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

type RangeValue = '7d' | '30d' | '90d';

type ReportSummary = {
  stock_in_units: number;
  stock_out_units: number;
  adjustment_net_units: number;
  movement_units: number;
  preorder_created_count: number;
  preorder_paid_count: number;
  preorder_created_revenue: number;
  preorder_paid_revenue: number;
  facebook_post_count: number;
  current_stock_units: number;
  active_preorder_count: number;
};

type ReportTrendPoint = {
  bucket_start: string;
  inventory_movement_units: number;
  preorder_created_count: number;
  preorder_paid_count: number;
  preorder_revenue: number;
  facebook_post_count: number;
};

const RANGE_OPTIONS: Array<{ value: RangeValue; label: string }> = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
];

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export const ReportsPage = () => {
  const [range, setRange] = useState<RangeValue>('7d');

  const summaryQuery = useQuery({
    queryKey: ['reports-summary', range],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/summary?range=${range}`);
      return response.data as { range: RangeValue; summary: ReportSummary };
    },
  });

  const trendsQuery = useQuery({
    queryKey: ['reports-trends', range],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/trends?range=${range}&bucket=day`);
      return response.data as { series: ReportTrendPoint[] };
    },
  });

  const summary = summaryQuery.data?.summary;
  const trends = useMemo(
    () => trendsQuery.data?.series ?? [],
    [trendsQuery.data?.series],
  );
  const maxRevenue = useMemo(() => {
    const values = trends.map((item) => item.preorder_revenue);
    return values.length > 0 ? Math.max(1, Math.max(...values)) : 1;
  }, [trends]);
  const trendMap = useMemo(() => {
    const map = new Map<string, ReportTrendPoint>();
    for (const point of trends) {
      map.set(toDateKey(new Date(point.bucket_start)), point);
    }
    return map;
  }, [trends]);
  const calendarDays = useMemo(() => buildCalendarDays(trends), [trends]);
  const [manualSelectedDateKey, setManualSelectedDateKey] = useState<string | null>(null);
  const defaultSelectedDateKey =
    trends.length > 0
      ? toDateKey(new Date(trends[trends.length - 1].bucket_start))
      : null;
  const selectedDateKey =
    manualSelectedDateKey && trendMap.has(manualSelectedDateKey)
      ? manualSelectedDateKey
      : defaultSelectedDateKey;
  const selectedPoint = selectedDateKey ? trendMap.get(selectedDateKey) ?? null : null;

  const isLoading = summaryQuery.isLoading || trendsQuery.isLoading;
  const isError = summaryQuery.isError || trendsQuery.isError;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 pt-5 pb-8 box-border max-md:px-3 max-md:pt-4 max-md:pb-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-[1.75rem] md:leading-snug">
              Báo cáo và thống kê
            </h1>
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  range === option.value
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setRange(option.value)}
                data-testid={`reports-range-${option.value}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500" data-testid="reports-loading">
          Đang tải dữ liệu báo cáo...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm font-medium text-rose-700" data-testid="reports-error">
          Không thể tải dữ liệu báo cáo. Vui lòng thử lại.
        </div>
      )}

      {!isLoading && !isError && summary && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="reports-summary-grid">
            <MetricCard title="Tồn hiện tại" value={summary.current_stock_units.toString()} />
            <MetricCard title="Pre-order đang mở" value={summary.active_preorder_count.toString()} />
            <MetricCard title="Đơn tạo mới" value={summary.preorder_created_count.toString()} />
            <MetricCard title="Đơn đã thanh toán" value={summary.preorder_paid_count.toString()} />
            <MetricCard title="Doanh thu tạo đơn" value={currency.format(summary.preorder_created_revenue)} />
            <MetricCard title="Doanh thu đã thanh toán" value={currency.format(summary.preorder_paid_revenue)} />
            <MetricCard title="Lượt đăng Facebook" value={summary.facebook_post_count.toString()} />
            <MetricCard title="Tổng biến động kho" value={summary.movement_units.toString()} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Xu hướng theo ngày</h2>
            {trends.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500" data-testid="reports-empty">
                Chưa có dữ liệu trong khoảng thời gian đã chọn.
              </p>
            ) : (
              <div className="mt-4 space-y-4" data-testid="reports-trend-list">
                <div className="grid gap-3 md:grid-cols-2">
                  <TrendSparklineCard
                    title="Biến động kho"
                    colorClass="text-indigo-600"
                    values={trends.map((point) => point.inventory_movement_units)}
                    labels={trends.map((point) =>
                      new Date(point.bucket_start).toLocaleDateString('vi-VN'),
                    )}
                    formatValue={(value) => `${value} đơn vị`}
                  />
                  <TrendSparklineCard
                    title="Doanh thu pre-order"
                    colorClass="text-emerald-600"
                    values={trends.map((point) => point.preorder_revenue)}
                    labels={trends.map((point) =>
                      new Date(point.bucket_start).toLocaleDateString('vi-VN'),
                    )}
                    formatValue={(value) => currency.format(value)}
                  />
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      const point = day.inRange ? trendMap.get(day.dateKey) ?? null : null;
                      const intensity = point
                        ? Math.max(0.18, point.preorder_revenue / maxRevenue)
                        : 0;
                      const isSelected = selectedDateKey === day.dateKey;

                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          className={`h-20 rounded-lg border p-2 text-left transition ${
                            day.inRange
                              ? 'border-slate-200 hover:border-indigo-300'
                              : 'border-transparent bg-slate-50 text-slate-300'
                          } ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
                          style={
                            point
                              ? {
                                  backgroundColor: `rgba(99, 102, 241, ${Number.isFinite(intensity) ? intensity : 0.18})`,
                                }
                              : undefined
                          }
                          onClick={() => day.inRange && setManualSelectedDateKey(day.dateKey)}
                          disabled={!day.inRange}
                        >
                          <div className={`text-xs font-semibold ${day.inRange ? 'text-slate-900' : 'text-slate-500'}`}>
                            {day.day}
                          </div>
                          {point && (
                            <div className="mt-1 space-y-0.5 text-[10px] text-slate-900">
                              <div>{point.preorder_created_count} đơn</div>
                              <div>{compactCurrency(point.preorder_revenue)}</div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedPoint && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-800">
                      Chi tiết ngày {new Date(selectedPoint.bucket_start).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                        <span className="text-slate-600">Đơn đã tạo</span>
                        <span className="font-semibold text-slate-900">{selectedPoint.preorder_created_count}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                        <span className="text-slate-600">Doanh thu</span>
                        <span className="font-semibold text-slate-900">{currency.format(selectedPoint.preorder_revenue)}</span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

function MetricCard(props: { title: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-testid="reports-metric-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{props.title}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{props.value}</p>
    </article>
  );
}

function toDateKey(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function buildCalendarDays(trends: ReportTrendPoint[]): Array<{
  dateKey: string;
  day: number;
  inRange: boolean;
}> {
  if (trends.length === 0) return [];
  const first = new Date(trends[0].bucket_start);
  const last = new Date(trends[trends.length - 1].bucket_start);
  const start = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
  const end = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 0));

  const startDay = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - startDay);
  const endDay = (end.getUTCDay() + 6) % 7;
  end.setUTCDate(end.getUTCDate() + (6 - endDay));

  const days: Array<{ dateKey: string; day: number; inRange: boolean }> = [];
  const trendKeys = new Set(trends.map((item) => toDateKey(new Date(item.bucket_start))));
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = toDateKey(cursor);
    days.push({
      dateKey: key,
      day: cursor.getUTCDate(),
      inRange: trendKeys.has(key),
    });
  }
  return days;
}

function compactCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}t`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return `${Math.round(value)}`;
}

function TrendSparklineCard(props: {
  title: string;
  values: number[];
  labels: string[];
  colorClass: string;
  formatValue: (value: number) => string;
}) {
  const max = props.values.length > 0 ? Math.max(...props.values) : 0;
  const min = props.values.length > 0 ? Math.min(...props.values) : 0;
  const spread = Math.max(1, max - min);
  const width = 100;
  const height = 36;
  const points = props.values
    .map((value, index) => {
      const x = props.values.length <= 1 ? 0 : (index / (props.values.length - 1)) * width;
      const normalized = (value - min) / spread;
      const y = height - normalized * height;
      return `${x},${Number.isFinite(y) ? y : height}`;
    })
    .join(' ');
  const latest = props.values[props.values.length - 1] ?? 0;
  const latestLabel = props.labels[props.labels.length - 1] ?? '-';

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{props.title}</h3>
        <span className={`text-sm font-semibold ${props.colorClass}`}>{props.formatValue(latest)}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className={props.colorClass}
        />
      </svg>
      <p className="mt-2 text-xs text-slate-500">Cập nhật gần nhất: {latestLabel}</p>
    </article>
  );
}
