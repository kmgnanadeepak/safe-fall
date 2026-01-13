import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface DataPoint {
  time: number;
  x: number;
  y: number;
  z: number;
}

interface SensorGraphProps {
  icon: LucideIcon;
  label: string;
  currentValues: { x: number; y: number; z: number };
  delay?: number;
}

const chartConfig = {
  x: {
    label: 'X',
    color: 'hsl(0, 84%, 60%)',
  },
  y: {
    label: 'Y',
    color: 'hsl(142, 76%, 36%)',
  },
  z: {
    label: 'Z',
    color: 'hsl(199, 89%, 48%)',
  },
};

export function SensorGraph({ icon: Icon, label, currentValues, delay = 0 }: SensorGraphProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const maxDataPoints = 30;

  useEffect(() => {
    setData((prevData) => {
      const newPoint = {
        time: Date.now(),
        x: currentValues.x,
        y: currentValues.y,
        z: currentValues.z,
      };
      
      const updatedData = [...prevData, newPoint];
      if (updatedData.length > maxDataPoints) {
        return updatedData.slice(-maxDataPoints);
      }
      return updatedData;
    });
  }, [currentValues]);

  // Format time for display
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    return `-${seconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card p-4"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
          <p className="text-xs text-muted-foreground">Real-time visualization</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-danger" /> X
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" /> Y
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-info" /> Z
          </span>
        </div>
      </div>
      
      <div className="h-40">
        <ChartContainer config={chartConfig}>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis 
              dataKey="time" 
              tickFormatter={formatTime}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              domain={['auto', 'auto']}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="x" 
              stroke="hsl(0, 84%, 60%)" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="z" 
              stroke="hsl(199, 89%, 48%)" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Current Values */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-danger">{currentValues.x.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">X-Axis</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-success">{currentValues.y.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Y-Axis</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-info">{currentValues.z.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Z-Axis</p>
        </div>
      </div>
    </motion.div>
  );
}
