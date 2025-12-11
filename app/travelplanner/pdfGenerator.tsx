import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ScheduleState, ScheduleItem } from "./types";
import { calculateTotalCost } from "./utils";
import { costCategories, EXCHANGE_RATE, DEFAULT_DAYS } from "./constants";
import { scheduleTypes } from "./constants";

// 한글 폰트 등록 (Noto Sans KR)
// @react-pdf/renderer는 클라이언트 사이드에서 실행되므로, 여기서 폰트를 등록합니다
// layout.tsx에서 미리 다운로드할 필요는 없습니다 - 클라이언트에서 자동으로 로드됩니다
// 폰트가 이미 등록되어 있는지 확인하고, 등록되지 않은 경우에만 등록
if (!Font.getRegisteredFontFamilies().includes("NotoSansKR")) {
  Font.register({
    family: "NotoSansKR",
    fonts: [
      {
        src: "https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.woff2",
        fontWeight: 700,
      },
    ],
  });
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "NotoSansKR",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 20,
  },
  daySection: {
    marginBottom: 30,
    pageBreakInside: "avoid",
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "2 solid #2563eb",
  },
  itemContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  itemTime: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 3,
  },
  itemLocation: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 3,
  },
  itemNote: {
    fontSize: 9,
    color: "#6b7280",
    // italic 제거 - 한글 폰트에 italic이 없을 수 있음
    marginBottom: 5,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingTop: 5,
    borderTop: "1 solid #e5e7eb",
  },
  costLabel: {
    fontSize: 9,
    color: "#6b7280",
  },
  costValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
  },
  totalCost: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2563eb",
  },
  emptyDay: {
    fontSize: 10,
    color: "#9ca3af",
    // italic 제거 - 한글 폰트에 italic이 없을 수 있음
    padding: 10,
    textAlign: "center",
  },
  summarySection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#eff6ff",
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#374151",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

const getTypeLabel = (type: string): string => {
  const typeOption = scheduleTypes.find((t) => t.key === type);
  return typeOption ? typeOption.label : type;
};

const getCostLabel = (category: string): string => {
  return costCategories[category]?.label || category;
};

interface TravelPDFProps {
  schedule: ScheduleState;
}

const TravelPDF: React.FC<TravelPDFProps> = ({ schedule }) => {
  // Calculate totals
  let totalJPY = 0;
  const dayTotals: Record<number, number> = {};
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
    dayTotals[day] = 0;
    items.forEach((item) => {
      const itemTotal = calculateTotalCost(item.costs);
      dayTotals[day] += itemTotal;
      totalJPY += itemTotal;

      Object.entries(item.costs).forEach(([cat, cost]) => {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + cost;
      });
    });
  });

  // PDF에서 특수 문자가 깨지지 않도록 숫자만 반환
  const formatKRW = (jpy: number) => {
    const krw = jpy * EXCHANGE_RATE;
    // 로케일을 'en-US'로 설정하여 숫자와 콤마만 표시
    // Math.floor로 정수 변환 후 포맷팅하여 깔끔하게 표시
    return Math.floor(krw).toLocaleString("en-US");
  };

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <Text style={styles.title}>일본 여행 일정표</Text>
        <Text style={styles.subtitle}>설레는 일본 여행 일정표</Text>

        {DEFAULT_DAYS.map((day) => {
          const items = schedule[day] || [];
          const dayTotal = dayTotals[day] || 0;

          return (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayTitle}>
                {day}일차{" "}
                {dayTotal > 0 && `(총 ${dayTotal.toLocaleString()} JPY)`}
              </Text>

              {items.length === 0 ? (
                <Text style={styles.emptyDay}>등록된 일정이 없습니다.</Text>
              ) : (
                items.map((item: ScheduleItem) => {
                  const itemTotal = calculateTotalCost(item.costs);
                  const hasCosts = itemTotal > 0;
                  const costEntries = Object.entries(item.costs).filter(
                    ([, cost]) => cost > 0
                  );

                  return (
                    <View key={item.id} style={styles.itemContainer}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemTime}>
                          {item.time || "시간 미정"}
                        </Text>
                        <Text style={styles.itemTime}>
                          [{getTypeLabel(item.type)}]
                        </Text>
                      </View>

                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {item.location && (
                        <Text style={styles.itemLocation}>
                          위치: {item.location}
                        </Text>
                      )}
                      {item.note && (
                        <Text style={styles.itemNote}>메모: {item.note}</Text>
                      )}

                      {hasCosts && (
                        <View style={styles.costRow}>
                          <View>
                            {costEntries.map(([category, cost]) => (
                              <View
                                key={category}
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  width: 200,
                                  marginBottom: 2,
                                }}
                              >
                                <Text style={styles.costLabel}>
                                  {getCostLabel(category)}:
                                </Text>
                                <Text style={styles.costValue}>
                                  {cost.toLocaleString()} JPY
                                </Text>
                              </View>
                            ))}
                          </View>
                          <Text style={styles.totalCost}>
                            소계: {itemTotal.toLocaleString()} JPY
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          );
        })}

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>총 예상 지출 요약</Text>
          {DEFAULT_DAYS.map((day) => {
            const dayTotal = dayTotals[day] || 0;
            if (dayTotal === 0) return null;
            return (
              <View key={day} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{day}일차:</Text>
                <Text style={styles.summaryValue}>
                  {dayTotal.toLocaleString()} JPY / {formatKRW(dayTotal)} KRW
                </Text>
              </View>
            );
          })}
          <View
            style={[
              styles.summaryRow,
              { marginTop: 10, paddingTop: 10, borderTop: "2 solid #2563eb" },
            ]}
          >
            <Text style={[styles.summaryLabel, { fontSize: 12 }]}>
              총 합계:
            </Text>
            <Text
              style={[styles.summaryValue, { fontSize: 12, color: "#2563eb" }]}
            >
              {totalJPY.toLocaleString()} JPY / {formatKRW(totalJPY)} KRW
            </Text>
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default TravelPDF;
