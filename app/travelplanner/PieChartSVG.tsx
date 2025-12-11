import { ChartData } from "./types";

export const PieChartSVG = ({
  data,
  size = 180,
  totalJPY,
}: {
  data: ChartData[];
  size?: number;
  totalJPY: number;
}) => {
  const center = size / 2;
  const radius = size / 2;

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    if (startAngle === endAngle) return "";
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "L",
      x,
      y,
      "Z",
    ].join(" ");
  };

  let textStartAngle = 0;

  return (
    <div className='flex justify-center mb-6'>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d) => {
          const angle = d.percentage * 3.6;
          const endAngle = textStartAngle + angle;
          const pathData = describeArc(
            center,
            center,
            radius,
            textStartAngle,
            endAngle
          );
          textStartAngle = endAngle;
          return (
            <path
              key={d.key}
              d={pathData}
              fill={d.color}
              className='transition-transform duration-300 hover:opacity-80'
            />
          );
        })}
        {(() => {
          let currentAngle = 0;
          return data.map((d) => {
            const angle = d.percentage * 3.6;
            const midAngle = currentAngle + angle / 2;
            currentAngle += angle;
            if (d.percentage > 5) {
              const textPosition = polarToCartesian(
                center,
                center,
                radius * 0.7,
                midAngle
              );
              return (
                <text
                  key={`text-${d.key}`}
                  x={textPosition.x}
                  y={textPosition.y}
                  fill='white'
                  fontSize='10'
                  fontWeight='bold'
                  textAnchor='middle'
                  dominantBaseline='middle'
                  className='pointer-events-none'
                >
                  {d.percentage.toFixed(1)}%
                </text>
              );
            }
            return null;
          });
        })()}
        {totalJPY === 0 && (
          <text
            x={center}
            y={center}
            fill='#9ca3af'
            fontSize='14'
            textAnchor='middle'
            dominantBaseline='middle'
          >
            데이터 없음
          </text>
        )}
      </svg>
    </div>
  );
};
