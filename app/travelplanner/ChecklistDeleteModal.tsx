import { X, Trash2 } from "lucide-react";

interface ChecklistDeleteModalProps {
  isOpen: boolean;
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function ChecklistDeleteModal({
  isOpen,
  itemTitle,
  onConfirm,
  onCancel,
  isDeleting = false,
}: ChecklistDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60] p-4 animate-in fade-in'>
      <div className='bg-white w-full max-w-sm rounded-xl shadow-xl animate-in zoom-in-95 duration-200 border border-gray-100'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-100'>
          <h3 className='text-base font-semibold text-gray-800'>항목 삭제</h3>
          <button
            onClick={onCancel}
            className='p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors'
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className='p-5'>
          <p className='text-sm text-gray-600 mb-4 text-center'>
            이 항목을 삭제하시겠습니까?
          </p>
          <div className='bg-gray-50 rounded-lg p-3 mb-5 border border-gray-100'>
            <p className='text-sm text-gray-800 font-medium text-center'>
              {itemTitle}
            </p>
          </div>

          {/* Actions */}
          <div className='flex gap-2'>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className='flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50'
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className='flex-1 bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50'
            >
              <Trash2 size={14} />
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
