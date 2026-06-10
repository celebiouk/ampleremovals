import { View, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";

interface MiniBarChartProps {
  data: { label: string; value: number }[];
  width: number;
  height?: number;
  colour?: string;
}

/**
 * Lightweight bar chart built on react-native-svg (already a dependency).
 * Avoids pulling in Victory Native / Skia on the React 19 / RN 0.81 stack.
 */
export function MiniBarChart({ data, width, height = 120, colour = "#7e22ce" }: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const gap = 8;
  const barW = data.length > 0 ? (width - gap * (data.length - 1)) / data.length : 0;
  const labelH = 18;
  const chartH = height - labelH;

  return (
    <View>
      <Svg width={width} height={chartH}>
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * (chartH - 4) : 0;
          const x = i * (barW + gap);
          const y = chartH - h;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 2)}
              rx={4}
              fill={colour}
              opacity={0.85}
            />
          );
        })}
      </Svg>
      <View style={{ width, flexDirection: "row" }}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={{ width: barW, marginRight: i < data.length - 1 ? gap : 0 }}
            className="text-center text-[10px] text-slate-400"
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
