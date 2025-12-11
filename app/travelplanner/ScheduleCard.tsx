import { useState } from "react";
import type React from "react";
import {
  CheckCircle2,
  ArrowRight,
  Wallet,
  Save,
  X,
  Pencil,
  Clock,
  MapPin,
  Trash2,
  Loader2,
} from "lucide-react";
import type { ScheduleItem } from "./types";
import { scheduleTypes, EXCHANGE_RATE } from "./constants";
import { calculateTotalCost, getTypeStyles, toKRW } from "./utils";
import { twMerge } from "tailwind-merge";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface ScheduleCardProps {
  item: ScheduleItem;
  isEditing: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  editForm: Partial<ScheduleItem>;
  onToggleComplete: (item: ScheduleItem) => void;
  onStartEditing: (item: ScheduleItem) => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onDelete: (item: ScheduleItem) => void;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onCostChange: (category: string, value: string) => void;
}

export default function ScheduleCard({
  item,
  isEditing,
  isUpdating,
  isDeleting,
  editForm,
  onToggleComplete,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDelete,
  onInputChange,
  onCostChange,
}: ScheduleCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const styles = getTypeStyles(item.type);
  const Icon = styles.icon;
  const isCompleted = item.isCompleted;
  const totalCost = calculateTotalCost(item.costs);
  const formValues = editForm || {};

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(item);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleToggleComplete = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggleComplete(item);
    } finally {
      // 약간의 딜레이를 주어 상태 변경이 UI에 반영되도록 함
      setTimeout(() => setIsToggling(false), 100);
    }
  };

  return (
    <>
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        itemTitle={item.title}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
      <div className='relative pl-10 mb-6 last:mb-0 group'>
        <div
          className={twMerge(
            "absolute left-0 top-1 w-10 h-10 rounded-full border-2 flex items-center justify-center bg-white z-10 transition-colors cursor-pointer hover:scale-105 active:scale-95",
            isCompleted
              ? "border-gray-300 text-gray-300"
              : `${styles.border} ${styles.color}`,
            isToggling && "opacity-50 cursor-wait"
          )}
          onClick={handleToggleComplete}
          aria-disabled={isToggling}
        >
          {isToggling ? (
            <Loader2 size={18} className='animate-spin' />
          ) : isCompleted ? (
            <CheckCircle2 size={20} />
          ) : (
            <Icon size={18} />
          )}
        </div>
        <div
          className={twMerge(
            "bg-white p-3 rounded-xl shadow-sm border border-gray-100 transition-all ml-1 sm:ml-1",
            isCompleted ? "opacity-50 grayscale" : "",
            isEditing ? "ring-2 ring-blue-500 border-transparent z-20" : ""
          )}
        >
          {isEditing ? (
            <div className='space-y-4'>
              <div className='flex justify-between items-center mb-1'>
                <span className='text-xs font-bold text-blue-600 uppercase tracking-wide'>
                  일정 수정
                </span>
              </div>

              <div className='space-y-2'>
                <div className='grid grid-cols-1 gap-2'>
                  <div>
                    <label className='text-xs text-gray-400 block mb-1'>
                      일차 선택
                    </label>
                    <select
                      name='day'
                      value={formValues.day || item.day}
                      onChange={onInputChange}
                      className='w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 bg-white text-gray-700'
                    >
                      {[1, 2, 3, 4].map((day) => (
                        <option key={day} value={day}>
                          {day}일차
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='text-xs text-gray-400 block mb-1'>
                      시간 설정
                    </label>
                    <div className='flex items-center gap-2'>
                      <input
                        type='time'
                        name='startTime'
                        value={formValues.startTime || ""}
                        onChange={onInputChange}
                        className='flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-center'
                      />
                      <ArrowRight size={14} className='text-gray-400' />
                      <input
                        type='time'
                        name='endTime'
                        value={formValues.endTime || ""}
                        onChange={onInputChange}
                        className='flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-center'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='text-xs text-gray-400 block mb-1'>
                      유형
                    </label>
                    <select
                      name='type'
                      value={formValues.type || scheduleTypes[0].key}
                      onChange={onInputChange}
                      className='w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 bg-white text-gray-700'
                    >
                      {scheduleTypes.map((type) => (
                        <option key={type.key} value={type.key}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className='text-xs text-gray-400 block mb-1'>
                    제목
                  </label>
                  <input
                    type='text'
                    name='title'
                    value={formValues.title || ""}
                    onChange={onInputChange}
                    className='w-full text-base font-bold bg-white text-gray-700 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500'
                  />
                </div>

                <div>
                  <label className='text-xs text-gray-400 block mb-1'>
                    장소
                  </label>
                  <input
                    type='text'
                    name='location'
                    value={formValues.location || ""}
                    onChange={onInputChange}
                    className='w-full text-sm bg-white text-gray-700 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500'
                  />
                </div>

                <div>
                  <label className='text-xs text-gray-400 block mb-1'>
                    위치 URL (Google Maps 등)
                  </label>
                  <input
                    type='url'
                    name='locationURL'
                    value={formValues.location_url || ""}
                    onChange={onInputChange}
                    className='w-full text-sm bg-white text-gray-700 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500'
                    placeholder='https://maps.google.com/...'
                  />
                </div>
              </div>

              <div className='bg-gray-50 p-3 rounded-lg border border-gray-100'>
                <label className='text-xs font-bold text-gray-500 mb-2 flex items-center justify-between'>
                  <div className='flex items-center'>
                    <Wallet size={12} className='mr-1' /> 비용 (JPY)
                  </div>
                  <span className='text-[10px] font-normal text-gray-400'>
                    1 JPY ≈ {EXCHANGE_RATE} KRW
                  </span>
                </label>
                <div className='flex items-center gap-2'>
                  <input
                    type='number'
                    min='0'
                    value={
                      calculateTotalCost(formValues.costs || undefined) || ""
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? 0
                          : parseInt(e.target.value, 10);
                      if (!isNaN(value)) {
                        // 단일 cost 값을 etc에 설정
                        onCostChange("etc", e.target.value);
                      }
                    }}
                    className='flex-1 text-sm bg-white text-gray-700 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-right'
                    placeholder='0'
                  />
                  <span className='text-xs text-gray-500'>JPY</span>
                  {calculateTotalCost(formValues.costs || undefined) > 0 && (
                    <span className='text-[10px] text-gray-400 font-medium'>
                      ≈ ₩
                      {toKRW(
                        calculateTotalCost(formValues.costs || undefined),
                        EXCHANGE_RATE
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className='text-xs text-gray-400 block mb-1'>메모</label>
                <textarea
                  name='note'
                  value={formValues.note || ""}
                  onChange={onInputChange}
                  rows={2}
                  className='w-full text-xs bg-white text-gray-700 border border-gray-200 rounded px-2 py-2 focus:outline-none focus:border-blue-500 resize-none'
                  placeholder='메모 사항'
                />
              </div>

              <div className='flex gap-2 pt-2'>
                <button
                  onClick={onSaveEditing}
                  disabled={isUpdating}
                  className='flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 disabled:opacity-50'
                >
                  <Save size={14} />
                  {isUpdating ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={onCancelEditing}
                  disabled={isUpdating}
                  className='flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1 disabled:opacity-50'
                >
                  <X size={14} /> 취소
                </button>
              </div>
            </div>
          ) : (
            <div className='relative'>
              <div className='absolute -top-1 -right-1 flex gap-1 z-10 group-hover:opacity-100 transition-opacity'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className='p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all'
                  title='삭제'
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEditing(item);
                  }}
                  className='p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all'
                  title='수정'
                >
                  <Pencil size={14} />
                </button>
              </div>

              <div className='flex justify-start items-start mb-1 pr-16 gap-2'>
                <div className='flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded mb-2'>
                  <Clock size={12} className='mr-1' />
                  {item.time}
                </div>
                {/* {totalCost > 0 && (
                  <div className='flex flex-col items-end'>
                    <div className='flex items-center text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-t border border-gray-200 border-b-0 w-full justify-end'>
                      <span className='mr-1 text-[10px] text-gray-500'>
                        JPY
                      </span>
                      {totalCost.toLocaleString()}
                    </div>
                    <div className='flex items-center text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-b border border-gray-200 w-full justify-end'>
                      <span className='mr-1'>₩</span>
                      {toKRW(totalCost, EXCHANGE_RATE)}
                    </div>
                  </div>
                )} */}
              </div>

              <h3
                className={`text-lg font-bold mb-1 ${
                  isCompleted ? "text-gray-400 line-through" : "text-gray-800"
                }`}
              >
                {item.title}
              </h3>

              {item.location && (
                <div className='flex items-start text-sm text-gray-600 mb-2'>
                  <MapPin size={14} className='mt-0.5 mr-1 flex-shrink-0' />
                  <div className='flex-1'>
                    <span className='font-medium'>{item.location}</span>
                    {item.location_url && (
                      <a
                        href={item.location_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='ml-2 text-blue-600 hover:text-blue-700 underline text-xs'
                        onClick={(e) => e.stopPropagation()}
                      >
                        지도 보기
                      </a>
                    )}
                  </div>
                </div>
              )}

              {totalCost > 0 && (
                <div className='flex flex-row justify-end items-center gap-2'>
                  <div className='flex flex-col items-end'>
                    <div className='flex items-center text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-t border border-gray-200 border-b-0 w-full justify-end'>
                      <span className='mr-1 text-[10px] text-gray-500'>
                        JPY
                      </span>
                      {totalCost.toLocaleString()}
                    </div>
                    <div className='flex items-center text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-b border border-gray-200 w-full justify-end'>
                      <span className='mr-1'>₩</span>
                      {toKRW(totalCost, EXCHANGE_RATE)}
                    </div>
                  </div>
                </div>
              )}

              {item.note && (
                <div className='text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 mt-2'>
                  {item.note}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
