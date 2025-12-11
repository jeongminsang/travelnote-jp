import type React from "react";
import { Plus, X, ArrowRight, Save, Wallet } from "lucide-react";
import type { ScheduleItem, ScheduleTypeKey } from "./types";
import { scheduleTypes, EXCHANGE_RATE } from "./constants";
import { calculateTotalCost, toKRW } from "./utils";

interface NewScheduleFormProps {
  isOpen: boolean;
  activeDay: number;
  item: ScheduleItem;
  isCreating: boolean;
  mutationError: string | null;
  onClose: () => void;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onTypeChange: (type: ScheduleTypeKey) => void;
  onCostChange: (category: string, value: string) => void;
  onSubmit: () => void;
}

export default function NewScheduleForm({
  isOpen,
  activeDay,
  item,
  isCreating,
  mutationError,
  onClose,
  onChange,
  onTypeChange,
  onCostChange,
  onSubmit,
}: NewScheduleFormProps) {
  if (!isOpen) return null;

  return (
    <div className='w-full fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in'>
      <div className='bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300'>
        <div className='flex justify-between items-center mb-4 border-b pb-3'>
          <h2 className='text-xl font-bold text-gray-800 flex items-center'>
            <Plus size={20} className='mr-2 text-blue-600' />
            {item.day || activeDay}일차 새 일정 추가
          </h2>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition'
          >
            <X size={20} />
          </button>
        </div>

        {mutationError && (
          <div className='mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3'>
            {mutationError}
          </div>
        )}

        <div className='space-y-4 max-h-[70vh] overflow-y-auto pr-2'>
          {/* 일차 선택 */}
          <div>
            <label className='text-xs font-medium text-gray-500 block mb-1'>
              일차 선택
            </label>
            <select
              name='day'
              value={item.day || activeDay}
              onChange={onChange}
              className='w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700'
            >
              {[1, 2, 3, 4].map((day) => (
                <option key={day} value={day}>
                  {day}일차
                </option>
              ))}
            </select>
          </div>

          {/* 시간 입력 (Time Picker) */}
          <div className='grid grid-cols-2 gap-3'>
            <div className='col-span-2'>
              <label className='text-xs font-medium text-gray-500 block mb-1'>
                시간 설정 (필수)
              </label>
              <div className='flex items-center gap-2'>
                <input
                  type='time'
                  name='startTime'
                  value={item.startTime || ""}
                  onChange={onChange}
                  className='flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 text-center'
                  required
                />
                <ArrowRight size={16} className='text-gray-400' />
                <input
                  type='time'
                  name='endTime'
                  value={item.endTime || ""}
                  onChange={onChange}
                  className='flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 text-center'
                />
              </div>
            </div>

            <div className='col-span-2'>
              <label className='text-xs font-medium text-gray-500 block mb-1'>
                유형
              </label>
              <div className='flex flex-wrap gap-2'>
                {scheduleTypes.map((type) => (
                  <button
                    key={type.key}
                    type='button'
                    onClick={() => onTypeChange(type.key)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      item.type === type.key
                        ? "bg-blue-100 border-blue-200 text-blue-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <type.icon size={12} className='mr-1' />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className='text-xs font-medium text-gray-500 block mb-1'>
              일정 제목 (필수)
            </label>
            <input
              type='text'
              name='title'
              value={item.title || ""}
              onChange={onChange}
              className='w-full p-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-base font-semibold focus:ring-blue-500 focus:border-blue-500'
              placeholder='예: 도쿄 타워 관광'
              required
            />
          </div>

          <div>
            <label className='text-xs font-medium text-gray-500 block mb-1'>
              장소/위치
            </label>
            <input
              type='text'
              name='location'
              value={item.location || ""}
              onChange={onChange}
              className='w-full p-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500'
              placeholder='예: 나리타 공항'
            />
          </div>

          <div>
            <label className='text-xs font-medium text-gray-500 block mb-1'>
              위치 URL (Google Maps 등)
            </label>
            <input
              type='url'
              name='location_url'
              value={item.location_url || ""}
              onChange={onChange}
              className='w-full p-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500'
              placeholder='예: https://maps.google.com/...'
            />
          </div>

          <div>
            <label className='text-xs font-medium text-gray-500 block mb-1'>
              메모/상세 내용
            </label>
            <textarea
              name='note'
              value={item.note || ""}
              onChange={onChange}
              rows={2}
              className='w-full p-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none'
              placeholder='추가적인 정보나 준비물 등을 입력하세요.'
            />
          </div>

          {/* 비용 정보 */}
          <div className='bg-gray-50 p-3 rounded-xl border border-gray-200'>
            <label className='text-sm font-bold text-gray-700 mb-3 flex items-center'>
              <Wallet size={14} className='mr-1' /> 예상 비용 (JPY)
              <span className='text-[10px] font-normal text-gray-400 ml-auto'>
                1 JPY ≈ {EXCHANGE_RATE} KRW
              </span>
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                min='0'
                name='cost'
                value={calculateTotalCost(item.costs) || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    // 단일 cost 값을 모든 cost 필드에 동일하게 설정하거나, etc에만 설정
                    onCostChange("etc", e.target.value);
                  }
                }}
                className='flex-1 p-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm text-right focus:ring-blue-500 focus:border-blue-500'
                placeholder='0'
              />
              <span className='text-xs text-gray-500'>JPY</span>
              {calculateTotalCost(item.costs) > 0 && (
                <span className='text-xs text-gray-400'>
                  ≈ ₩{toKRW(calculateTotalCost(item.costs), EXCHANGE_RATE)} KRW
                </span>
              )}
            </div>
          </div>
        </div>

        <div className='mt-6'>
          <button
            onClick={onSubmit}
            className='w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
            disabled={isCreating || !item.title.trim() || !item.startTime}
          >
            <Save size={18} />
            {isCreating ? "일정 추가 중..." : `${activeDay}일차에 일정 추가`}
          </button>
        </div>
      </div>
    </div>
  );
}
