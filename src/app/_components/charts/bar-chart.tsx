'use client';

import { useEffect, useRef } from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  className?: string;
}

export function BarChart({ data, height = 200, color = '#6366f1', className }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive setup
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = height;
    }

    const width = canvas.width;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxValue = Math.max(...data.map((d) => d.value), 10);
    const barWidth = chartWidth / data.length - 10;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw bars
    data.forEach((item, i) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding + i * (barWidth + 10);
      const y = height - padding - barHeight;

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}80`); // Add transparency
      
      ctx.fillStyle = gradient;
      
      // Rounded top
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.quadraticCurveTo(x, y, x + 4, y);
      ctx.lineTo(x + barWidth - 4, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + 4);
      ctx.lineTo(x + barWidth, height - padding);
      ctx.lineTo(x, height - padding);
      ctx.fill();

      // Draw label
      ctx.fillStyle = '#94a3b8'; // text-secondary
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - padding + 15);

      // Draw value on top of bar if hover/active (simplified for now to always show if space permits)
      if (barHeight > 20) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(item.value.toString(), x + barWidth / 2, y + 15);
      }
    });

  }, [data, height, color]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
}
