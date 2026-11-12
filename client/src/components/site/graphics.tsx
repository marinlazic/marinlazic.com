// Line graphics for the redesign: the season chart, the sample report and
// the four moving service graphics. All drawn in ink on oat with one signal
// colour. The motion is CSS (keyframes in index.css) and stops when the
// visitor has reduced motion switched on.
import type { CSSProperties, ReactNode } from "react";

const INK = "#141413";
const MUTE = "#5E5D59";
const OAT = "#F0EEE6";
const STONE = "#E6E3DA";
const LINE = "#DDDBD0";
const SIGNAL = "#FF5A36";
const SANS = "Inter, system-ui, sans-serif";

type Pt = [number, number];

// A smooth line through the points (Catmull-Rom, written as cubic curves).
function smooth(p: Pt[]) {
  const k = 1 / 6;
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    d += ` C${(b[0] + (c[0] - a[0]) * k).toFixed(1)} ${(b[1] + (c[1] - a[1]) * k).toFixed(1)},${(c[0] - (e[0] - b[0]) * k).toFixed(1)} ${(c[1] - (e[1] - b[1]) * k).toFixed(1)},${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return d;
}

// ─── The season chart: athletes peak on purpose, a work year does not ───
export function SeasonChart() {
  const X0 = 40, X1 = 1180, Y0 = 380, Y1 = 70, T0 = 2023.0, T1 = 2028.8;
  const x = (t: number) => X0 + ((t - T0) / (T1 - T0)) * (X1 - X0);
  const y = (v: number) => Y0 - v * (Y0 - Y1);
  const past: Pt[] = [
    [2023.0, 0.34], [2023.3, 0.6], [2023.55, 0.96], [2023.72, 0.34], [2023.95, 0.62], [2024.12, 0.92], [2024.24, 0.5],
    [2024.42, 0.72], [2024.6, 1], [2024.8, 0.24], [2025.1, 0.5], [2025.35, 0.74], [2025.55, 0.95], [2025.74, 0.3],
  ];
  const future: Pt[] = [
    [2025.74, 0.3], [2026.15, 0.52], [2026.5, 0.42], [2027.0, 0.64], [2027.35, 0.5], [2027.9, 0.78], [2028.2, 0.7], [2028.55, 1],
  ];
  const peaks: [number, number, string, string][] = [
    [2023.55, 0.96, "Fukuoka", "2023"],
    [2024.12, 0.92, "Doha", "2024"],
    [2024.6, 1, "Paris", "2024"],
    [2025.55, 0.95, "Singapore", "2025"],
    [2028.55, 1, "LA", "2028"],
  ];
  const you: Pt[] = [];
  for (let i = 0; i <= 57; i++) {
    you.push([T0 + i * 0.1, 0.86 + 0.022 * Math.sin(i * 1.7) + 0.014 * Math.sin(i * 4.1)]);
  }
  const px = (pts: Pt[]) => pts.map(([t, v]) => [x(t), y(v)] as Pt);
  const years = [2023, 2024, 2025, 2026, 2027, 2028];
  return (
    <svg
      viewBox="0 0 1220 430"
      role="img"
      aria-label="Chart. Athlete training load rises to a peak at Fukuoka 2023, Doha 2024, Paris 2024 and Singapore 2025, drops after each one, and builds toward LA 2028. A work year stays near the top all year with no off season."
      className="block w-full h-auto"
    >
      {years.map(yr => (
        <g key={yr}>
          <line x1={x(yr)} x2={x(yr)} y1={Y1 - 30} y2={Y0 + 14} stroke={LINE} strokeWidth={1} />
          <text x={x(yr) + 8} y={Y0 + 36} fontFamily={SANS} fontSize={13} fill={MUTE}>
            {yr}
          </text>
        </g>
      ))}
      <line x1={X0} x2={X1} y1={Y0 + 14} y2={Y0 + 14} stroke={INK} strokeWidth={1} />
      <path d={smooth(px(you))} fill="none" stroke={SIGNAL} strokeWidth={3} strokeLinecap="round" />
      <path d={smooth(px(future))} fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="3 9" strokeLinecap="round" />
      <path d={smooth(px(past))} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      {peaks.map(([t, v, name, yr]) => (
        <g key={name}>
          <circle cx={x(t)} cy={y(v)} r={6.5} fill={OAT} stroke={INK} strokeWidth={3} />
          <text x={x(t) + 13} y={y(v) - 9} fontFamily={SANS} fontSize={14} fontWeight={600} fill={INK}>
            {name}
          </text>
          <text x={x(t) + 13} y={y(v) + 8} fontFamily={SANS} fontSize={12} fill={MUTE}>
            {yr}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── The sample report: radar and category bars ───
export const SAMPLE_SCORES: { name: string; short: string; score: number }[] = [
  { name: "Sleep", short: "Sleep", score: 58 },
  { name: "Stress and mental", short: "Stress", score: 44 },
  { name: "Training", short: "Training", score: 82 },
  { name: "Injuries and health", short: "Injuries", score: 70 },
  { name: "Nutrition and energy", short: "Nutrition", score: 63 },
  { name: "Recovery", short: "Recovery", score: 39 },
];

export function SampleRadar({ maxWidth = 400 }: { maxWidth?: number }) {
  const cx = 170, cy = 150, R = 100;
  const pt = (i: number, r: number): Pt => [
    cx + r * Math.cos(((-90 + i * 60) * Math.PI) / 180),
    cy + r * Math.sin(((-90 + i * 60) * Math.PI) / 180),
  ];
  const ring = (f: number) => SAMPLE_SCORES.map((_, i) => pt(i, R * f).map(n => n.toFixed(1)).join(",")).join(" ");
  const pts = SAMPLE_SCORES.map((s, i) => pt(i, (R * s.score) / 100));
  const lowest = SAMPLE_SCORES.reduce((lo, s, i) => (s.score < SAMPLE_SCORES[lo].score ? i : lo), 0);
  return (
    <svg
      viewBox="0 0 340 300"
      role="img"
      aria-label="Sample radar chart of six scores. Training is highest at 82 and recovery is lowest at 39."
      className="block w-full h-auto mx-auto"
      style={{ maxWidth }}
    >
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={ring(f)} fill="none" stroke={f < 1 ? LINE : "#C9C6BA"} strokeWidth={1} />
      ))}
      {SAMPLE_SCORES.map((s, i) => {
        const [ex, ey] = pt(i, R);
        const [lx, ly] = pt(i, R + 18);
        const anchor = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
        const dy = i === 0 ? -2 : i === 3 ? 12 : 4;
        return (
          <g key={s.short}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={LINE} strokeWidth={1} />
            <text x={lx} y={ly + dy} textAnchor={anchor} fontFamily={SANS} fontSize={12} fontWeight={500} fill={INK}>
              {s.short}
            </text>
          </g>
        );
      })}
      <polygon
        points={pts.map(p => p.map(n => n.toFixed(1)).join(",")).join(" ")}
        fill="rgba(20,20,19,0.08)"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {pts.map(([a, b], i) => (
        <circle key={i} cx={a} cy={b} r={i === lowest ? 6 : 4} fill={i === lowest ? SIGNAL : INK} />
      ))}
    </svg>
  );
}

export function SampleBars() {
  const lowest = Math.min(...SAMPLE_SCORES.map(s => s.score));
  return (
    <div>
      {SAMPLE_SCORES.map(s => (
        <div key={s.name} className="flex items-center gap-3 py-[9px] text-sm leading-snug">
          <span className="flex-[0_0_148px] text-ink">{s.name}</span>
          <span className="flex-1 h-1.5 rounded-full bg-line block">
            <span
              className="block h-1.5 rounded-full"
              style={{ width: `${s.score}%`, background: s.score === lowest ? SIGNAL : INK }}
            />
          </span>
          <span className="flex-[0_0_26px] text-right font-semibold text-ink">{s.score}</span>
        </div>
      ))}
    </div>
  );
}

// ─── The four service graphics ───
function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 500"
      role="img"
      aria-label={label}
      className="mg block w-full h-auto aspect-[4/5] rounded-lg bg-oat"
    >
      {children}
    </svg>
  );
}

function T({
  x,
  y,
  children,
  anchor = "middle",
  size = 12,
  fill = MUTE,
  weight = 500,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  size?: number;
  fill?: string;
  weight?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={SANS} fontSize={size} fontWeight={weight} fill={fill}>
      {children}
    </text>
  );
}

// A week: training and recovery fit around the work blocks. A marker sweeps across the days.
export function WeekGraphic() {
  const x0 = 28, cw = 44, gap = 6;
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const work: Record<number, [number, number]> = { 0: [150, 180], 1: [150, 180], 2: [132, 216], 3: [150, 180], 4: [150, 150] };
  const train: [number, number, number][] = [[0, 100, 40], [2, 360, 42], [4, 100, 40], [5, 176, 60]];
  const rec: Record<number, [number, number]> = { 1: [360, 30], 3: [360, 30], 6: [190, 46] };
  const col = (i: number) => x0 + i * (cw + gap);
  return (
    <Frame label="Animated diagram of one week. Training and recovery blocks fit around the work blocks on each day.">
      {days.map((d, i) => (
        <g key={i}>
          <T x={col(i) + cw / 2} y={72}>{d}</T>
          <rect x={col(i)} y={88} width={cw} height={330} rx={6} fill="none" stroke={LINE} strokeWidth={1.5} />
          {work[i] && <rect x={col(i) + 5} y={work[i][0]} width={cw - 10} height={work[i][1]} rx={5} fill={LINE} />}
          {rec[i] && (
            <rect x={col(i) + 5} y={rec[i][0]} width={cw - 10} height={rec[i][1]} rx={5} fill="none" stroke={INK} strokeWidth={2} />
          )}
        </g>
      ))}
      {train.map(([i, yy, hh], n) => (
        <rect
          key={i}
          x={col(i) + 5}
          y={yy}
          width={cw - 10}
          height={hh}
          rx={5}
          fill={INK}
          style={{ animation: `mgDrop 8s ease-in-out ${(n * 0.55).toFixed(2)}s infinite backwards` }}
        />
      ))}
      <g style={{ animation: "mgSweep 8s linear infinite" }}>
        <line x1={x0 + cw / 2} x2={x0 + cw / 2} y1={84} y2={422} stroke={SIGNAL} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={x0 + cw / 2} cy={84} r={5} fill={SIGNAL} />
      </g>
      <rect x={46} y={448} width={14} height={14} rx={3} fill={INK} />
      <T x={68} y={459} anchor="start" fill={INK}>Training</T>
      <rect x={150} y={448} width={14} height={14} rx={3} fill="none" stroke={INK} strokeWidth={2} />
      <T x={172} y={459} anchor="start" fill={INK}>Recovery</T>
      <rect x={260} y={448} width={14} height={14} rx={3} fill={LINE} />
      <T x={282} y={459} anchor="start" fill={INK}>Work</T>
    </Frame>
  );
}

// Build, peak, recover: the line draws itself and the peak pulses.
export function WaveGraphic() {
  const d = smooth([[40, 372], [92, 318], [140, 196], [178, 344], [220, 290], [268, 132], [306, 352], [360, 316]]);
  const pulse: CSSProperties = { transformBox: "fill-box", transformOrigin: "center", animation: "mgPulse 2.4s ease-out infinite" };
  return (
    <Frame label="Animated line that builds to a peak and drops into recovery, twice.">
      {[40, 120, 200, 280, 360].map(gx => (
        <line key={gx} x1={gx} x2={gx} y1={96} y2={410} stroke={LINE} strokeWidth={1} />
      ))}
      <line x1={40} x2={360} y1={410} y2={410} stroke={INK} strokeWidth={1} />
      <path d={d} fill="none" stroke={LINE} strokeWidth={3} strokeLinecap="round" />
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={INK}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 1, strokeDashoffset: 0, animation: "mgDraw 7s ease-in-out infinite" }}
      />
      <circle cx={140} cy={196} r={6.5} fill={OAT} stroke={INK} strokeWidth={3} />
      <circle cx={268} cy={132} r={7} fill="none" stroke={SIGNAL} strokeWidth={2.5} style={pulse} />
      <circle cx={268} cy={132} r={7} fill={SIGNAL} />
      <T x={96} y={436} size={13} fill={INK}>Build</T>
      <T x={268} y={106} size={13} fill={INK} weight={600}>Peak</T>
      <T x={312} y={436} size={13} fill={INK}>Recover</T>
    </Frame>
  );
}

// A group moving together, one coach in front.
export function TeamGraphic() {
  const dots: ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={76 + c * 62}
          cy={104 + r * 62}
          r={17}
          fill="none"
          stroke={INK}
          strokeWidth={2.5}
          style={{ animation: `mgBob 3.6s ease-in-out ${(c * 0.18 + r * 0.07).toFixed(2)}s infinite` }}
        />
      );
    }
  }
  return (
    <Frame label="Animated grid of 25 circles moving in a wave, with one coach in front.">
      {dots}
      <line x1={76} x2={324} y1={404} y2={404} stroke={LINE} strokeWidth={1.5} />
      <circle cx={200} cy={442} r={11} fill={SIGNAL} />
    </Frame>
  );
}

// A sleep window shifting day by day while a dot flies from Sydney to Paris.
export function TravelGraphic() {
  return (
    <Frame label="Animated diagram. A sleep window moves later each day while a dot travels from Sydney to Paris.">
      <T x={100} y={62} anchor="start">Sleep window</T>
      {[108, 150, 192, 234].map((bx, i) => {
        const yy = 92 + i * 38;
        return (
          <g key={i}>
            <T x={48} y={yy + 5} anchor="start" fill={INK}>{`Day ${i + 1}`}</T>
            <line x1={100} x2={352} y1={yy} y2={yy} stroke={LINE} strokeWidth={1.5} />
            <rect
              x={bx}
              y={yy - 7}
              width={92}
              height={14}
              rx={7}
              fill={INK}
              style={{ animation: `mgShift 7s ease-in-out ${(i * 0.6).toFixed(1)}s infinite backwards` }}
            />
          </g>
        );
      })}
      <circle cx={200} cy={640} r={300} fill={STONE} stroke={INK} strokeWidth={2} />
      <path d="M50 379 A220 220 0 0 1 350 379" fill="none" stroke={INK} strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" />
      <circle cx={50} cy={380} r={5.5} fill={INK} />
      <circle cx={350} cy={380} r={5.5} fill={INK} />
      <T x={50} y={408} fill={INK}>Sydney</T>
      <T x={350} y={408} fill={INK}>Paris</T>
      <g style={{ transformOrigin: "200px 540px", animation: "mgFly 7s ease-in-out infinite" }}>
        <circle cx={200} cy={320} r={8} fill={SIGNAL} />
      </g>
    </Frame>
  );
}
