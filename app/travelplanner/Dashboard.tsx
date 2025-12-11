"use client";

import {
  Wallet,
  TrendingUp,
  PieChart as PieChartIcon,
  Download,
} from "lucide-react";
import { PieChartSVG } from "./PieChartSVG";
import { costCategories } from "./constants";
import type { ScheduleState, ChartData } from "./types";
import { calculateTotalCost } from "./utils";
import { DEFAULT_DAYS } from "./constants";

interface DashboardProps {
  schedule: ScheduleState;
  formatKRW: (value: number) => string;
  onDownloadPDF: () => void;
}

interface DashboardStats {
  totalJPY: number;
  dayTotals: Record<number, number>;
  categoryTotals: Record<string, number>;
  chartData: ChartData[];
}

export default function Dashboard({
  schedule,
  formatKRW,
  onDownloadPDF,
}: DashboardProps) {
  // Calculate stats
  let totalJPY = 0;
  const dayTotals: Record<number, number> = DEFAULT_DAYS.reduce((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {} as Record<number, number>);
  const categoryTotals: Record<string, number> = {
    transport: 0,
    food: 0,
    entrance: 0,
    shopping_sujin: 0,
    shopping_seona: 0,
    etc: 0,
  };

  Object.entries(schedule).forEach(([dayStr, items]) => {
    const day = parseInt(dayStr, 10);
    if (!dayTotals[day]) {
      dayTotals[day] = 0;
    }
    items.forEach((item) => {
      const itemTotal = calculateTotalCost(item.costs);
      dayTotals[day] += itemTotal;
      totalJPY += itemTotal;

      Object.entries(item.costs).forEach(([cat, cost]) => {
        categoryTotals[cat] += cost;
      });
    });
  });

  const chartData: ChartData[] = Object.entries(categoryTotals)
    .map(([key, value]) => ({
      key,
      label: costCategories[key].label,
      value,
      color: costCategories[key].hexColor,
      percentage: totalJPY > 0 ? (value / totalJPY) * 100 : 0,
    }))
    .filter((d) => d.value > 0);

  const stats: DashboardStats = {
    totalJPY,
    dayTotals,
    categoryTotals,
    chartData,
  };

  return (
    <div className='flex-1 p-4 animate-in fade-in slide-in-from-bottom-4 duration-300'>
      <div className='bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-6'>
        <div className='flex items-center gap-2 mb-2 opacity-90'>
          <Wallet size={18} />
          <span className='text-sm font-medium'>총 예상 지출</span>
        </div>
        <div className='text-3xl font-bold mb-1'>
          {stats.totalJPY.toLocaleString()}{" "}
          <span className='text-lg font-normal opacity-80'>JPY</span>
        </div>
        <div className='text-blue-100 text-sm font-medium'>
          ≈ {formatKRW(stats.totalJPY)} KRW
        </div>
      </div>

      <div className='bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6'>
        <div className='flex items-center gap-2 mb-4'>
          <TrendingUp size={18} className='text-gray-500' />
          <h3 className='font-bold text-gray-800'>일자별 지출</h3>
        </div>
        <div className='space-y-4'>
          {DEFAULT_DAYS.map((day) => {
            const dayCost = stats.dayTotals[day];
            const percentage =
              stats.totalJPY > 0 ? (dayCost / stats.totalJPY) * 100 : 0;

            return (
              <div key={day} className='relative'>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='font-medium text-gray-600'>{day}일차</span>
                  <span className='font-bold text-gray-800'>
                    {dayCost.toLocaleString()} JPY
                  </span>
                </div>
                <div className='w-full bg-gray-100 rounded-full h-2.5 overflow-hidden'>
                  <div
                    className='bg-blue-500 h-2.5 rounded-full transition-all duration-500'
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className='text-right text-[10px] text-gray-400 mt-0.5'>
                  ₩{formatKRW(dayCost)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className='bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6'>
        <div className='flex items-center gap-2 mb-4'>
          <PieChartIcon size={18} className='text-gray-500' />
          <h3 className='font-bold text-gray-800'>카테고리별 지출 분석</h3>
        </div>
        <PieChartSVG data={stats.chartData} totalJPY={stats.totalJPY} />
        <div className='space-y-3 pt-3 border-t border-gray-100'>
          {stats.chartData.map((d) => {
            const config = costCategories[d.key];
            return (
              <div
                key={d.key}
                className='flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div
                    className='w-4 h-4 rounded-full'
                    style={{ backgroundColor: d.color }}
                  />
                  <div>
                    <div className='text-xs text-gray-500'>
                      {config.label} ({d.percentage.toFixed(1)}%)
                    </div>
                    <div className='text-sm font-bold text-gray-800'>
                      {d.value.toLocaleString()} JPY
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-[10px] text-gray-400'>
                    ₩{formatKRW(d.value)}
                  </div>
                </div>
              </div>
            );
          })}
          {stats.totalJPY === 0 && (
            <div className='text-center text-gray-400 py-4 text-sm'>
              지출 내역이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* PDF 다운로드 버튼 */}
      <div className='bg-white rounded-xl p-5 shadow-sm border border-gray-100'>
        <button
          onClick={onDownloadPDF}
          className='w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Download size={18} />
          <span>PDF로 일정 다운로드</span>
        </button>
      </div>
    </div>
  );
}
