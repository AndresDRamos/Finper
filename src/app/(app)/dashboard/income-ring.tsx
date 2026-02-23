"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";

// ── Fuente para los data-labels numéricos del anillo ──────────────────────────
// Cambia este valor para experimentar: "Aptos Narrow", "Inter", "monospace", etc.
const DATA_LABEL_FONT = "Aptos Narrow, Arial Narrow, sans-serif";
// ──────────────────────────────────────────────────────────────────────────────

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};

const RING_DURATION = 250;

const PIE_STYLES = `
@keyframes pie-label-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pie-label-group {
  animation: pie-label-in 380ms cubic-bezier(0.34,1.56,0.64,1) both;
  animation-delay: ${RING_DURATION}ms;
}
@keyframes center-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.pie-center-label {
  animation: center-fade-in 500ms ease both;
  animation-delay: ${RING_DURATION}ms;
}
`;

type Segment = { name: string; value: number; color: string; href: string };

// Escala radios e índices según el ancho disponible
function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

function getLayout(w: number) {
  // Ancho disponible para cada etiqueta lateral (margen + línea guía + texto)
  const isXs = w < 320;
  const isSm = w < 400;

  const outerRadius = isXs ? 62 : isSm ? 72 : 88;
  const innerRadius = isXs ? 42 : isSm ? 50 : 60;
  // Margen horizontal = espacio para etiqueta. Debe caber: línea corta + texto corto
  const hMargin = isXs ? 52 : isSm ? 60 : 72;
  const vMargin = isXs ? 44 : isSm ? 48 : 52;
  const chartHeight = isXs ? 300 : isSm ? 340 : 390;

  // Tamaños de fuente
  const nameFontSize = isXs ? 11 : isSm ? 12 : 14;
  const valueFontSize = isXs ? 10 : isSm ? 11 : 12;

  // Longitud de las líneas guía
  const lineLen = isXs ? 18 : isSm ? 22 : 28;
  const hookLen = isXs ? 12 : isSm ? 14 : 18;

  return { outerRadius, innerRadius, hMargin, vMargin, chartHeight, nameFontSize, valueFontSize, lineLen, hookLen };
}

function CustomLabel({
  cx = 0, cy = 0, midAngle = 0, outerRadius = 0,
  name = "", value = 0, percent = 0, color,
  nameFontSize, valueFontSize, lineLen, hookLen,
}: {
  cx?: number; cy?: number; midAngle?: number; outerRadius?: number;
  name?: string; value?: number; percent?: number; color: string;
  nameFontSize: number; valueFontSize: number; lineLen: number; hookLen: number;
}) {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + lineLen) * cos;
  const my = cy + (outerRadius + lineLen) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * hookLen;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";
  const tx = ex + (cos >= 0 ? 4 : -4);

  if (percent < 0.03) return null;

  return (
    <g className="pie-label-group">
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={color}
        strokeWidth={1}
        fill="none"
        opacity={0.6}
      />
      <circle cx={ex} cy={ey} r={2} fill={color} />
      <text
        x={tx}
        y={ey - 6}
        textAnchor={textAnchor}
        fill={color}
        fontSize={nameFontSize}
        fontWeight={700}
        fontFamily="inherit"
      >
        {name}
      </text>
      <text
        x={tx}
        y={ey + 7}
        textAnchor={textAnchor}
        fill="#999"
        fontSize={valueFontSize}
        fontFamily={DATA_LABEL_FONT}
      >
        {fmtShort(value)} · {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
}

export function IncomeRing({
  segments,
  effectiveIncome,
  avgIncome,
}: {
  segments: Segment[];
  effectiveIncome: number;
  avgIncome: number | null;
}) {
  const router = useRouter();
  const { ref, width } = useContainerWidth();
  const showEmpty = segments.length === 0 || effectiveIncome === 0;
  const { outerRadius, innerRadius, hMargin, vMargin, chartHeight, nameFontSize, valueFontSize, lineLen, hookLen } = getLayout(width);

  return (
    <div ref={ref} className="w-full">
      <h2 className="text-xl font-semibold mb-1">Distribución de recursos</h2>

      {/* Divisor sutil */}
      <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-1" />

      {showEmpty ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm gap-2">
          <span className="text-4xl">📊</span>
          <p>Sin datos suficientes para mostrar el gráfico</p>
        </div>
      ) : (
        <>
          <style>{PIE_STYLES}</style>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart margin={{ top: vMargin, right: hMargin, bottom: vMargin, left: hMargin }}>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={1.5}
                dataKey="value"
                strokeWidth={0}
                labelLine={false}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={RING_DURATION}
                animationEasing="ease-out"
                label={(props) => (
                  <CustomLabel
                    {...props}
                    color={segments[props.index]?.color ?? "#888"}
                    nameFontSize={nameFontSize}
                    valueFontSize={valueFontSize}
                    lineLen={lineLen}
                    hookLen={hookLen}
                  />
                )}
                onClick={(_, index) => {
                  const seg = segments[index];
                  if (seg?.href) router.push(seg.href);
                }}
                style={{ cursor: "pointer" }}
              >
                {segments.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="none" />
                ))}
              </Pie>

              {/* Centro: ingreso */}
              <Pie
                data={[{ value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={0}
                dataKey="value"
                strokeWidth={0}
                fill="none"
                isAnimationActive={false}
              >
                <Label
                  content={({ viewBox }) => {
                    const { cx = 0, cy = 0 } = (viewBox as { cx?: number; cy?: number }) ?? {};
                    return (
                      <g
                        className="pie-center-label"
                        onClick={() => router.push("/transactions?tab=income")}
                        style={{ cursor: "pointer" }}
                      >
                        <circle cx={cx} cy={cy} r={innerRadius - 2} fill="transparent" />
                        <text
                          x={cx}
                          y={cy - 7}
                          textAnchor="middle"
                          fill="#ffffffaa"
                          fontSize={Math.max(9, nameFontSize - 2)}
                          fontFamily="inherit"
                        >
                          Ingreso
                        </text>
                        <text
                          x={cx}
                          y={cy + 10}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize={Math.max(13, nameFontSize + 2)}
                          fontWeight={700}
                          fontFamily={DATA_LABEL_FONT}
                        >
                          {fmtShort(effectiveIncome)}
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </>
      )}

      {effectiveIncome > 0 && (
        <p className="text-center text-xs text-muted-foreground -mt-3">
          {avgIncome !== null
            ? "Ingreso promedio · últimos 3 meses"
            : "Ingreso estimado manual · se ajustará con tus ingresos"}
        </p>
      )}
    </div>
  );
}
