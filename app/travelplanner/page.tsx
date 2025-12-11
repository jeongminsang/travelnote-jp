"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { BarChart3, Plus, X, Coffee, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ScheduleCard from "./ScheduleCard";
import NewScheduleForm from "./NewScheduleForm";
import type {
  ScheduleItem,
  ScheduleRow,
  ScheduleState,
  ScheduleTypeKey,
} from "./types";
import {
  calculateTotalCost,
  createDefaultNewItem,
  createEmptyScheduleState,
  mapRowToItem,
  parseTime,
  sanitizeCosts,
  sortItemsByTime,
  timeToDbValue,
  toKRW,
} from "./utils";
import Dashboard from "./Dashboard";
import ChecklistView from "./ChecklistView";
import { generateAndDownloadPDF } from "./pdfUtils";

export default function ScheduleApp() {
  const supabase = useMemo(() => createClient(), []);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [showChecklist, setShowChecklist] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<ScheduleItem>(() =>
    createDefaultNewItem(1)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScheduleItem>>({});
  const [schedule, setSchedule] = useState<ScheduleState>(() =>
    createEmptyScheduleState()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const formatKRW = (value: number) => toKRW(value, 9.45);

  const upsertItemInState = useCallback((item: ScheduleItem) => {
    setSchedule((prev) => {
      const nextState: ScheduleState = { ...prev };
      const targetDay = item.day;
      const dayItems = [...(nextState[targetDay] || [])];
      const idx = dayItems.findIndex((entry) => entry.id === item.id);
      if (idx >= 0) {
        dayItems[idx] = item;
      } else {
        dayItems.push(item);
      }
      nextState[targetDay] = sortItemsByTime(dayItems);
      return nextState;
    });
  }, []);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) {
      console.error("일정 불러오기 실패", error);
      setLoadError("일정을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      setIsLoading(false);
      return;
    }
    const nextState = createEmptyScheduleState();
    const rows = (data ?? []) as ScheduleRow[];
    rows.forEach((row) => {
      const item = mapRowToItem(row);
      if (!nextState[item.day]) {
        nextState[item.day] = [];
      }
      nextState[item.day].push(item);
    });
    Object.keys(nextState).forEach((day) => {
      const numericDay = Number(day);
      nextState[numericDay] = sortItemsByTime(nextState[numericDay]);
    });
    setSchedule(nextState);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // --- 일정 추가/수정 로직 ---

  const addNewItem = useCallback(async () => {
    if (!newItem.title.trim()) {
      setMutationError("제목을 입력해주세요.");
      return;
    }
    const startTimeValue = timeToDbValue(newItem.startTime);
    if (!startTimeValue) {
      setMutationError("시작 시간을 입력해주세요.");
      return;
    }

    const normalizedCosts = sanitizeCosts(newItem.costs);
    const totalCost = calculateTotalCost(normalizedCosts);

    setIsCreating(true);
    setMutationError(null);

    try {
      const { data, error } = await supabase
        .from("schedules")
        .insert({
          day: newItem.day || activeDay,
          start_time: startTimeValue,
          end_time: timeToDbValue(newItem.endTime),
          type: newItem.type,
          title: newItem.title.trim(),
          location: newItem.location ? newItem.location.trim() : null,
          location_url: newItem.location_url
            ? newItem.location_url.trim()
            : null,
          note: newItem.note ? newItem.note.trim() : null,
          cost: totalCost,
          is_completed: false,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const insertedItem = mapRowToItem(data as ScheduleRow);
        upsertItemInState(insertedItem);
      }

      setNewItem(createDefaultNewItem(newItem.day || activeDay));
      setIsAdding(false);
    } catch (error) {
      console.error("새 일정 추가 실패", error);
      setMutationError(
        "일정을 추가하지 못했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsCreating(false);
    }
  }, [newItem, activeDay, supabase, upsertItemInState]);

  const handleNewItemChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setMutationError(null);
      setNewItem((prev) => ({
        ...prev,
        [name]: name === "day" ? parseInt(value, 10) : value,
      }));
    },
    []
  );

  const handleNewItemCostChange = useCallback(
    (category: string, value: string) => {
      const numValue = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(numValue)) return;

      setMutationError(null);
      setNewItem((prev) => ({
        ...prev,
        costs: {
          ...prev.costs,
          [category]: numValue,
        },
      }));
    },
    []
  );

  const handleNewItemTypeChange = useCallback((type: ScheduleTypeKey) => {
    setMutationError(null);
    setNewItem((prev) => ({ ...prev, type }));
  }, []);

  const handleCloseNewItemForm = useCallback(() => {
    setIsAdding(false);
    setMutationError(null);
  }, []);

  const toggleComplete = async (item: ScheduleItem) => {
    const nextStatus = !item.isCompleted;
    setMutationError(null);
    try {
      const { error } = await supabase
        .from("schedules")
        .update({ is_completed: nextStatus })
        .eq("id", item.id);
      if (error) {
        throw error;
      }
      upsertItemInState({ ...item, isCompleted: nextStatus });
    } catch (error) {
      console.error("완료 상태 업데이트 실패", error);
      setMutationError("체크 상태를 업데이트하지 못했습니다.");
    }
  };

  const startEditing = (item: ScheduleItem) => {
    setMutationError(null);
    const fallback = parseTime(item.time);
    setEditingId(item.id);
    setEditForm({
      ...item,
      startTime: item.startTime || fallback.start,
      endTime: item.endTime || fallback.end,
      costs: { ...item.costs },
    });
  };

  const cancelEditing = () => {
    setMutationError(null);
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = async () => {
    if (!editingId) return;
    if (!editForm.title?.trim()) {
      setMutationError("제목을 입력해주세요.");
      return;
    }
    const startTimeValue = timeToDbValue(editForm.startTime);
    if (!startTimeValue) {
      setMutationError("시작 시간을 입력해주세요.");
      return;
    }

    const normalizedCosts = sanitizeCosts(editForm.costs || undefined);
    const totalCost = calculateTotalCost(normalizedCosts);
    if (!editForm.type) {
      setMutationError("유형을 선택해주세요.");
      return;
    }

    // 현재 편집 중인 아이템 찾기
    const currentItem = Object.values(schedule)
      .flat()
      .find((item) => item.id === editingId);

    const newDay = editForm.day ?? currentItem?.day ?? activeDay;

    setIsUpdating(true);
    setMutationError(null);

    try {
      const { data, error } = await supabase
        .from("schedules")
        .update({
          day: newDay,
          start_time: startTimeValue,
          end_time: timeToDbValue(editForm.endTime),
          type: editForm.type,
          title: editForm.title.trim(),
          location: editForm.location ? editForm.location.trim() : null,
          location_url: editForm.location_url
            ? editForm.location_url.trim()
            : null,
          note: editForm.note ? editForm.note.trim() : null,
          cost: totalCost,
        })
        .eq("id", editingId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const updatedItem = mapRowToItem(data as ScheduleRow);
        upsertItemInState(updatedItem);
        // 일차가 변경된 경우 해당 일차로 이동
        if (newDay !== activeDay) {
          setActiveDay(newDay);
        }
      }

      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("일정 수정 실패", error);
      setMutationError("일정 수정에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setMutationError(null);
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCostChange = (category: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numValue)) return;

    setMutationError(null);
    setEditForm((prev) => ({
      ...prev,
      costs: {
        ...(prev.costs || {
          transport: 0,
          food: 0,
          entrance: 0,
          shopping_sujin: 0,
          shopping_seona: 0,
          etc: 0,
        }),
        [category]: numValue,
      },
    }));
  };

  const deleteItem = useCallback(
    async (item: ScheduleItem) => {
      setIsDeleting(true);
      setMutationError(null);

      try {
        const { error } = await supabase
          .from("schedules")
          .delete()
          .eq("id", item.id);

        if (error) {
          throw error;
        }

        // State에서 아이템 제거
        setSchedule((prev) => {
          const nextState: ScheduleState = { ...prev };
          const dayItems = [...(nextState[item.day] || [])];
          const filteredItems = dayItems.filter(
            (entry) => entry.id !== item.id
          );
          nextState[item.day] = filteredItems;
          return nextState;
        });

        // 편집 중이던 아이템이 삭제된 경우 편집 상태 초기화
        if (editingId === item.id) {
          setEditingId(null);
          setEditForm({});
        }
      } catch (error) {
        console.error("일정 삭제 실패", error);
        setMutationError(
          "일정을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요."
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [supabase, editingId]
  );

  const currentSchedule = schedule[activeDay] || [];
  const renderLoading = (
    <div className='flex-1 flex items-center justify-center text-gray-400 text-sm'>
      일정을 불러오는 중입니다...
    </div>
  );

  return (
    <div className='w-full max-w-2xl mx-auto bg-gray-50 min-h-screen flex flex-col font-sans overflow-x-hidden'>
      {/* Add Item Form Modal */}
      <NewScheduleForm
        isOpen={isAdding}
        activeDay={activeDay}
        item={newItem}
        isCreating={isCreating}
        mutationError={mutationError}
        onClose={handleCloseNewItemForm}
        onChange={handleNewItemChange}
        onTypeChange={handleNewItemTypeChange}
        onCostChange={handleNewItemCostChange}
        onSubmit={addNewItem}
      />

      {/* Sticky Header Container */}
      <div className='sticky top-0 z-30 bg-white'>
        {/* Header */}
        <header className='px-4 py-4 shadow-sm'>
          <div className='flex justify-between items-center mb-1'>
            <div>
              <h1 className='text-2xl font-bold text-gray-800'>일본 여행 🇯🇵</h1>
              <p className='text-gray-500 text-xs'>신나는 일본 여행 일정표</p>
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => {
                  setShowDashboard(false);
                  setShowChecklist(!showChecklist);
                }}
                className={`p-2 rounded-full transition-colors ${
                  showChecklist
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title='체크리스트'
              >
                {showChecklist ? <X size={20} /> : <ClipboardList size={20} />}
              </button>
              <button
                onClick={() => {
                  setShowChecklist(false);
                  setShowDashboard(!showDashboard);
                }}
                className={`p-2 rounded-full transition-colors ${
                  showDashboard
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title='예산 대시보드'
              >
                {showDashboard ? <X size={20} /> : <BarChart3 size={20} />}
              </button>
            </div>
          </div>
        </header>

        {/* Day Tabs - Only show in Schedule List View */}
        {!showDashboard && !showChecklist && (
          <div className='flex bg-white border-b border-gray-100 overflow-x-auto hide-scrollbar'>
            {[1, 2, 3, 4].map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative min-w-[80px] ${
                  activeDay === day
                    ? "text-blue-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {day}일차
                {activeDay === day && (
                  <div className='absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full' />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {loadError && (
        <div className='mx-4 mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 flex items-center justify-between gap-3'>
          <span>{loadError}</span>
          <button
            onClick={fetchSchedules}
            className='text-xs font-semibold text-red-600 underline-offset-2 hover:underline'
          >
            다시 시도
          </button>
        </div>
      )}

      {mutationError && !isAdding && (
        <div className='mx-4 mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3'>
          {mutationError}
        </div>
      )}

      {/* Main Content Area */}
      {showChecklist ? (
        // Checklist View
        <Suspense
          fallback={
            <div className='flex items-center justify-center h-64 text-gray-400 text-sm'>
              체크리스트를 불러오는 중입니다...
            </div>
          }
        >
          <ChecklistView />
        </Suspense>
      ) : showDashboard ? (
        // Dashboard View
        isLoading ? (
          renderLoading
        ) : (
          <Dashboard
            schedule={schedule}
            formatKRW={formatKRW}
            onDownloadPDF={async () => {
              try {
                await generateAndDownloadPDF(schedule);
              } catch (error) {
                setMutationError(
                  error instanceof Error
                    ? error.message
                    : "PDF 생성에 실패했습니다."
                );
              }
            }}
          />
        )
      ) : // Schedule List View
      isLoading ? (
        renderLoading
      ) : (
        <>
          {/* Schedule List */}
          <div className='flex-1 p-3 pb-20'>
            {currentSchedule.length > 0 ? (
              <div className='relative'>
                <div className='absolute left-[19px]  top-4 bottom-4 w-0.5 bg-gray-200' />
                {currentSchedule.map((item) => (
                  <ScheduleCard
                    key={item.id}
                    item={item}
                    isEditing={editingId === item.id}
                    isUpdating={isUpdating}
                    editForm={editingId === item.id ? editForm : {}}
                    onToggleComplete={toggleComplete}
                    onStartEditing={startEditing}
                    onCancelEditing={cancelEditing}
                    onSaveEditing={saveEditing}
                    onInputChange={handleInputChange}
                    onCostChange={handleCostChange}
                    onDelete={deleteItem}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-64 text-gray-400'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                  <Coffee size={32} />
                </div>
                <p className='font-medium'>
                  {activeDay}일차에 등록된 일정이 없습니다.
                </p>
                <p className='text-sm'>
                  아래 버튼을 눌러 새 일정을 추가해보세요!
                </p>
              </div>
            )}
          </div>
          {/* Floating Action Button (FAB) for Adding Schedule */}
          <div className='fixed bottom-6 right-6 z-40'>
            <button
              onClick={() => {
                setIsAdding(true);
                setNewItem(createDefaultNewItem(activeDay)); // 새 일정 버튼 누를 때마다 폼 초기화
                setMutationError(null);
              }}
              className='bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors transform hover:scale-105 active:scale-95'
              title={`${activeDay}일차 일정 추가`}
            >
              <Plus size={24} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
