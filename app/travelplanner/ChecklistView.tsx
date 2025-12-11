"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  X,
  Pencil,
  Trash2,
  ShoppingBag,
  Utensils,
  Save,
  Loader2,
} from "lucide-react";
import type { ChecklistItem, ChecklistType } from "./types";
import { twMerge } from "tailwind-merge";
import ChecklistDeleteModal from "./ChecklistDeleteModal";
import { createClient } from "@/lib/supabase/client";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

interface ChecklistRow {
  id: string;
  title: string;
  is_completed: boolean;
  note: string | null;
  category: string;
  created_at: string;
}

export default function ChecklistView() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // 쇼핑 체크리스트 가져오기
  const { data: shoppingData } = useSuspenseQuery({
    queryKey: ["checklists", "shopping"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .eq("category", "shopping")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as ChecklistRow[];
    },
  });

  // 음식 체크리스트 가져오기
  const { data: foodData } = useSuspenseQuery({
    queryKey: ["checklists", "food"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .eq("category", "food")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as ChecklistRow[];
    },
  });

  // 데이터 변환: ChecklistRow -> ChecklistItem
  const shoppingItems: ChecklistItem[] = shoppingData.map((row) => ({
    id: row.id,
    title: row.title,
    is_completed: row.is_completed,
    note: row.note || undefined,
    created_at: row.created_at,
    category: "shopping" as const,
  }));

  const foodItems: ChecklistItem[] = foodData.map((row) => ({
    id: row.id,
    title: row.title,
    is_completed: row.is_completed,
    note: row.note || undefined,
    created_at: row.created_at,
    category: "food" as const,
  }));

  const [activeTab, setActiveTab] = useState<ChecklistType>("shopping");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ChecklistItem>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<ChecklistItem>>({
    title: "",
    note: "",
  });

  const currentItems = activeTab === "shopping" ? shoppingItems : foodItems;
  const currentCategory = activeTab === "shopping" ? "shopping" : "food";

  // 완료 상태 토글 Mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("checklists")
        .update({ is_completed: !item.is_completed })
        .eq("id", item.id);

      if (error) throw error;
    },
    onMutate: async (item: ChecklistItem) => {
      setTogglingItemId(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checklists", currentCategory],
      });
    },
    onSettled: () => {
      setTogglingItemId(null);
    },
  });

  // 항목 추가 Mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: { title: string; note?: string }) => {
      const { data, error } = await supabase
        .from("checklists")
        .insert({
          title: item.title.trim(),
          category: currentCategory,
          note: item.note || null,
          is_completed: false,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checklists", currentCategory],
      });
      setNewItem({ title: "", note: "" });
      setIsAdding(false);
    },
  });

  // 항목 수정 Mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      note,
    }: {
      id: string;
      title: string;
      note?: string;
    }) => {
      const { error } = await supabase
        .from("checklists")
        .update({
          title: title.trim(),
          note: note || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checklists", currentCategory],
      });
      setEditingId(null);
      setEditForm({});
    },
  });

  // 항목 삭제 Mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklists").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["checklists", currentCategory],
      });
      if (editingId === itemToDelete?.id) {
        setEditingId(null);
        setEditForm({});
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    },
  });

  const toggleComplete = useCallback(
    (item: ChecklistItem) => {
      toggleCompleteMutation.mutate(item);
    },
    [toggleCompleteMutation]
  );

  const startEditing = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (!editingId || !editForm.title?.trim()) return;

    updateItemMutation.mutate({
      id: editingId,
      title: editForm.title.trim(),
      note: editForm.note,
    });
  };

  const handleDeleteClick = (item: ChecklistItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    deleteItemMutation.mutate(itemToDelete.id);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleAddItem = () => {
    if (!newItem.title?.trim()) return;

    addItemMutation.mutate({
      title: newItem.title.trim(),
      note: newItem.note,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editingId) {
      setEditForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setNewItem((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const completedCount = currentItems.filter(
    (item) => item.is_completed
  ).length;
  const totalCount = currentItems.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <>
      <ChecklistDeleteModal
        isOpen={showDeleteConfirm}
        itemTitle={itemToDelete?.title || ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={deleteItemMutation.isPending}
      />
      <div className='flex-1 p-4 animate-in fade-in slide-in-from-bottom-4 duration-300'>
        {/* Tabs */}
        <div className='flex bg-white border-b border-gray-100 mb-4 rounded-t-lg overflow-hidden'>
          <button
            onClick={() => {
              setActiveTab("shopping");
              setEditingId(null);
              setIsAdding(false);
            }}
            className={twMerge(
              "flex-1 py-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-2",
              activeTab === "shopping"
                ? "text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <ShoppingBag size={16} />
            쇼핑리스트
            {activeTab === "shopping" && (
              <div className='absolute bottom-0 left-0 w-full h-0.5 bg-blue-600' />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("food");
              setEditingId(null);
              setIsAdding(false);
            }}
            className={twMerge(
              "flex-1 py-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-2",
              activeTab === "food"
                ? "text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Utensils size={16} />
            먹킷리스트
            {activeTab === "food" && (
              <div className='absolute bottom-0 left-0 w-full h-0.5 bg-blue-600' />
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm font-medium text-gray-700'>진행률</span>
            <span className='text-sm font-bold text-blue-600'>
              {completedCount} / {totalCount}
            </span>
          </div>
          <div className='w-full bg-gray-100 rounded-full h-2.5 overflow-hidden'>
            <div
              className='bg-blue-500 h-2.5 rounded-full transition-all duration-500'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Add Item Form */}
        {isAdding && (
          <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4'>
            <div className='space-y-3'>
              <div>
                <label className='text-xs text-gray-400 block mb-1'>
                  항목명 *
                </label>
                <input
                  type='text'
                  name='title'
                  value={newItem.title || ""}
                  onChange={handleInputChange}
                  className='w-full text-sm bg-white text-black border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-500'
                  placeholder='예: 양산, 선크림...'
                  autoFocus
                />
              </div>

              <div>
                <label className='text-xs text-gray-400 block mb-1'>메모</label>
                <textarea
                  name='note'
                  value={newItem.note || ""}
                  onChange={handleInputChange}
                  rows={2}
                  className='w-full text-xs bg-white text-black border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-500 resize-none'
                  placeholder='추가 정보...'
                />
              </div>

              <div className='flex gap-2 pt-2'>
                <button
                  onClick={handleAddItem}
                  disabled={addItemMutation.isPending}
                  className='flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 disabled:opacity-50'
                >
                  {addItemMutation.isPending ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : (
                    <Plus size={14} />
                  )}
                  {addItemMutation.isPending ? "추가 중..." : "추가"}
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewItem({
                      title: "",
                      note: "",
                    });
                  }}
                  className='flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1'
                >
                  <X size={14} /> 취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checklist Items */}
        <div className='space-y-3 pb-20'>
          {currentItems.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-xl p-8 border border-gray-100'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                {activeTab === "shopping" ? (
                  <ShoppingBag size={32} />
                ) : (
                  <Utensils size={32} />
                )}
              </div>
              <p className='font-medium mb-1'>
                {activeTab === "shopping"
                  ? "쇼핑리스트가 비어있습니다"
                  : "먹킷리스트가 비어있습니다"}
              </p>
              <p className='text-sm'>아래 버튼을 눌러 항목을 추가해보세요!</p>
            </div>
          ) : (
            currentItems.map((item) => (
              <div
                key={item.id}
                className={twMerge(
                  "bg-white rounded-xl p-4 shadow-sm border transition-all",
                  item.is_completed
                    ? "border-gray-200 opacity-60"
                    : "border-gray-100",
                  editingId === item.id &&
                    "ring-2 ring-blue-500 border-transparent"
                )}
              >
                {editingId === item.id ? (
                  <div className='space-y-3'>
                    <div className='flex justify-between items-center mb-1'>
                      <span className='text-xs font-bold text-blue-600 uppercase tracking-wide'>
                        항목 수정
                      </span>
                      <button
                        onClick={cancelEditing}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div>
                      <label className='text-xs text-gray-400 block mb-1'>
                        항목명 *
                      </label>
                      <input
                        type='text'
                        name='title'
                        value={editForm.title || ""}
                        onChange={handleInputChange}
                        className='w-full text-sm bg-white text-black border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-500'
                      />
                    </div>

                    <div>
                      <label className='text-xs text-gray-400 block mb-1'>
                        메모
                      </label>
                      <textarea
                        name='note'
                        value={editForm.note || ""}
                        onChange={handleInputChange}
                        rows={2}
                        className='w-full text-xs bg-white text-black border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-500 resize-none'
                      />
                    </div>

                    <div className='flex gap-2 pt-2'>
                      <button
                        onClick={saveEditing}
                        disabled={updateItemMutation.isPending}
                        className='flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 disabled:opacity-50'
                      >
                        {updateItemMutation.isPending ? (
                          <Loader2 size={14} className='animate-spin' />
                        ) : (
                          <Save size={14} />
                        )}
                        {updateItemMutation.isPending ? "저장 중..." : "저장"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className='flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1'
                      >
                        <X size={14} /> 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-start gap-3'>
                    <button
                      onClick={() => toggleComplete(item)}
                      disabled={
                        toggleCompleteMutation.isPending &&
                        togglingItemId === item.id
                      }
                      className='mt-0.5 flex-shrink-0 disabled:opacity-50'
                    >
                      {toggleCompleteMutation.isPending &&
                      togglingItemId === item.id ? (
                        <Loader2
                          size={24}
                          className='text-blue-600 animate-spin'
                        />
                      ) : item.is_completed ? (
                        <CheckCircle2
                          size={24}
                          className='text-blue-600 hover:text-blue-700'
                        />
                      ) : (
                        <Circle size={24} className='text-gray-300 ' />
                      )}
                    </button>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1'>
                          <h3
                            className={twMerge(
                              "text-base font-semibold mb-1",
                              item.is_completed
                                ? "text-gray-400 line-through"
                                : "text-gray-800"
                            )}
                          >
                            {item.title}
                          </h3>
                          {item.note && (
                            <p className='text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded'>
                              {item.note}
                            </p>
                          )}
                        </div>

                        <div className='flex gap-1 flex-shrink-0'>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className='p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-all'
                            title='삭제'
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => startEditing(item)}
                            className='p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all'
                            title='수정'
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Floating Action Button */}
        {!isAdding && (
          <div className='fixed bottom-6 right-6 z-40'>
            <button
              onClick={() => setIsAdding(true)}
              className='bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors transform hover:scale-105 active:scale-95'
              title='항목 추가'
            >
              <Plus size={24} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
