import { X, Trash2, AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  itemTitle,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 animate-in fade-in'>
      <div className='bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300'>
        <div className='flex items-start gap-4 mb-4'>
          <div className='flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center'>
            <AlertTriangle className='text-red-600' size={24} />
          </div>
          <div className='flex-1'>
            <h3 className='text-lg font-bold text-gray-900 mb-1'>일정 삭제</h3>
            <p className='text-sm text-gray-600'>정말 삭제하시겠습니까?</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className='flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition disabled:opacity-50'
          >
            <X size={20} />
          </button>
        </div>

        <div className='bg-gray-50 rounded-lg p-3 mb-6'>
          <p className='text-sm text-gray-700 font-medium'>
            &ldquo;{itemTitle}&rdquo;
          </p>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className='flex-1 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50'
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className='flex-1 bg-red-600 text-white font-medium py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
          >
            <Trash2 size={16} />
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
