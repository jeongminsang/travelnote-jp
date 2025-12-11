"use client";

import { pdf, Font } from "@react-pdf/renderer";
import React from "react";
import TravelPDF from "./pdfGenerator";
import type { ScheduleState } from "./types";

// 폰트가 로드될 때까지 대기하는 헬퍼 함수
const waitForFont = async (fontFamily: string, maxAttempts = 10): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (Font.getRegisteredFontFamilies().includes(fontFamily)) {
      // 폰트가 등록되었지만 실제로 로드되었는지 확인하기 위해 짧은 대기
      await new Promise((resolve) => setTimeout(resolve, 100));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  console.warn(`폰트 ${fontFamily} 로딩을 기다리는 중...`);
};

export const generateAndDownloadPDF = async (schedule: ScheduleState) => {
  try {
    // 폰트가 로드될 때까지 대기
    await waitForFont("NotoSansKR");
    
    const doc = React.createElement(TravelPDF, { schedule });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(doc as any).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `일본-여행-일정표-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF 생성 실패:", error);
    throw new Error("PDF 생성에 실패했습니다. 다시 시도해주세요.");
  }
};

