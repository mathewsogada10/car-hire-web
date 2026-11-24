import { useEffect, useId, useRef, useState } from "react";
import { displayMoney } from "../../utilities/money";
import { financialSeries } from "./monthly-report";
import type { FinancialMonth, FinancialSeriesKey } from "./monthly-report";

export function FinancialLineChart({
  months,
  selectedSeries,
  onSelectedSeriesChange,
}: {
  months: FinancialMonth[];
  selectedSeries: FinancialSeriesKey[];
  onSelectedSeriesChange: (selected: FinancialSeriesKey[]) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const id = useId();
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, entry.contentRect.width)),
    );
    resize.observe(element);
    return () => resize.disconnect();
  }, []);
  const visibleSeries = financialSeries.filter((series) =>
    selectedSeries.includes(series.key),
  );
  const values = months.flatMap((month) =>
    visibleSeries.map((series) => month[series.key]),
  );
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values) || 100;
  const left = 64,
    right = width - 18,
    top = 20,
    bottom = 240;
  const x = (index: number) =>
    months.length === 1
      ? (left + right) / 2
      : left + ((right - left) * index) / (months.length - 1);
  const y = (value: number) =>
    bottom - ((value - low) / (high - low)) * (bottom - top);
  const labelCount = Math.min(months.length, width < 500 ? 3 : 6);
  const labelIndices = new Set(
    Array.from({ length: labelCount }, (_, index) =>
      Math.round((index * (months.length - 1)) / Math.max(1, labelCount - 1)),
    ),
  );
  const axis = new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return (
    <div className="financial-chart" ref={container}>
      <ul className="chart-legend" aria-label="Chart series">
        {financialSeries.map((series) => (
          <li key={series.key} className={series.className}>
            <label>
              <input
                type="checkbox"
                aria-label={series.label}
                checked={selectedSeries.includes(series.key)}
                onChange={(event) =>
                  onSelectedSeriesChange(
                    event.target.checked
                      ? [...selectedSeries, series.key]
                      : selectedSeries.filter((key) => key !== series.key),
                  )
                }
              />
              <span>
                {series.label} (
                {series.dash === undefined
                  ? "solid"
                  : series.key === "expensesPaidMinor"
                    ? "dashed"
                    : "dotted"}
                )
              </span>
            </label>
          </li>
        ))}
      </ul>
      {visibleSeries.length === 0 ? (
        <p role="status">Select at least one line to display the chart.</p>
      ) : (
        <svg
          role="img"
          aria-labelledby={`${id}-title ${id}-description`}
          viewBox={`0 0 ${width} 290`}
        >
          <title id={`${id}-title`}>Monthly financial trend</title>
          <desc id={`${id}-description`}>
            {visibleSeries.map((series) => series.label).join(", ")} by month.
            Exact amounts are in the table below. Amounts in KES.
          </desc>
          <text x="0" y="12" className="chart-axis">
            KES
          </text>
          {[0, 1, 2, 3, 4].map((tick) => {
            const value = low + ((high - low) * tick) / 4;
            return (
              <g key={tick}>
                <line
                  x1={left}
                  x2={right}
                  y1={y(value)}
                  y2={y(value)}
                  className="chart-grid"
                />
                <text
                  x={left - 8}
                  y={y(value) + 4}
                  textAnchor="end"
                  className="chart-axis"
                >
                  {axis.format(value / 100)}
                </text>
              </g>
            );
          })}
          <line
            x1={left}
            x2={right}
            y1={y(0)}
            y2={y(0)}
            className="chart-zero"
          />
          {visibleSeries.map((series) => (
            <g key={series.key} className={series.className}>
              <polyline
                data-testid={`trend-${series.key}`}
                points={months
                  .map((month, index) => `${x(index)},${y(month[series.key])}`)
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={series.dash}
              />
              {months.map((month, index) => (
                <circle
                  key={month.month}
                  cx={x(index)}
                  cy={y(month[series.key])}
                  r="3"
                  fill="currentColor"
                >
                  <title>
                    {month.month}: {series.label}{" "}
                    {displayMoney(month[series.key])}
                  </title>
                </circle>
              ))}
            </g>
          ))}
          {months.map(
            (month, index) =>
              labelIndices.has(index) && (
                <text
                  key={month.month}
                  x={x(index)}
                  y="270"
                  textAnchor={
                    index === 0
                      ? "start"
                      : index === months.length - 1
                        ? "end"
                        : "middle"
                  }
                  className="chart-axis"
                >
                  {month.month}
                </text>
              ),
          )}
        </svg>
      )}
    </div>
  );
}
