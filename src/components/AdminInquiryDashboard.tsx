import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {Inbox, Check, Trash2, Clock, Mail, User as UserIcon, Calendar, Filter, ChevronDown, CheckCircle} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Inquiry } from '../types';

export default function AdminInquiryDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'error' | 'feature' | 'general'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const path = 'inquiries';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedInquiries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Inquiry[];
      setInquiries(fetchedInquiries);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (inquiry: Inquiry) => {
    const nextStatus = inquiry.status === 'resolved' ? 'pending' : 'resolved';
    const path = `inquiries/${inquiry.id}`;
    try {
      await updateDoc(doc(db, 'inquiries', inquiry.id), {
        status: nextStatus
      });
      // Update selected detail in real-time too
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry({ ...inquiry, status: nextStatus });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('이 문의 사항을 데이터베이스에서 영구적으로 삭제하시겠습니까?')) return;

    const path = `inquiries/${id}`;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const filteredInquiries = inquiries.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'error':
        return 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30';
      case 'feature':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30';
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'error': return '🐛 오류 제보';
      case 'feature': return '✨ 기능 제안';
      default: return '💬 일반 문의';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="gap-8 grid grid-cols-1 lg:grid-cols-12 min-h-[500px]"
    >
      {/* Left Sidebar list */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-white font-bold text-base">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>필터 및 정렬</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="filter-category" className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-2">분류 별</label>
              <select
                id="filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-xl px-3 py-2 text-xs border border-slate-200 dark:border-neutral-700 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="all">📁 전체 분류</option>
                <option value="error">🐛 오류 제보</option>
                <option value="feature">✨ 기능 제안</option>
                <option value="general">💬 일반 문의</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-status" className="block text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-2">상태 별</label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-xl px-3 py-2 text-xs border border-slate-200 dark:border-neutral-700 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="all">🔄 전체 상태</option>
                <option value="pending">⏳ 대기 중</option>
                <option value="resolved">✅ 해결됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* List of inquiries */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="border-b border-indigo-50 dark:border-neutral-800 px-6 py-4 bg-indigo-50/20 dark:bg-neutral-900/30 flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-indigo-500" />
              <span>문의 목록 ({filteredInquiries.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-neutral-800 max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="py-20 text-center text-slate-400 dark:text-neutral-500 text-xs font-semibold">
                접수된 의뢰가 없습니다.
              </div>
            ) : (
              filteredInquiries.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedInquiry(item)}
                  className={`px-6 py-4 cursor-pointer transition-colors text-left flex flex-col gap-2 relative ${
                    selectedInquiry?.id === item.id
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${getCategoryBadgeClass(item.category)}`}>
                      {getCategoryLabel(item.category)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      {item.userName}
                    </span>

                    <span className={`flex items-center gap-1 font-bold ${
                      item.status === 'resolved' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-amber-500 dark:text-amber-400'
                    }`}>
                      {item.status === 'resolved' ? '✅ 해결됨' : '⏳ 대기 중'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {selectedInquiry ? (
            <motion.div
              key={selectedInquiry.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm min-h-[450px]"
            >
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100 dark:border-neutral-800">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getCategoryBadgeClass(selectedInquiry.category)}`}>
                      {getCategoryLabel(selectedInquiry.category)}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      selectedInquiry.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                    }`}>
                      {selectedInquiry.status === 'resolved' ? '해결됨' : '대기 중'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-snug">
                    {selectedInquiry.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(selectedInquiry)}
                    className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                      selectedInquiry.status === 'resolved'
                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400'
                    }`}
                    title={selectedInquiry.status === 'resolved' ? '대기로 환원' : '해결 완료로 처리'}
                  >
                    {selectedInquiry.status === 'resolved' ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>대기 상태 전환</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>해결 완료 처리</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(selectedInquiry.id)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-xl transition-color"
                    title="영구 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submitter info block */}
              <div className="bg-slate-50 dark:bg-neutral-950 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-400 shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">작성자</span>
                    <span className="text-slate-700 dark:text-neutral-300 truncate block font-bold">{selectedInquiry.userName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">회신 이메일/전화</span>
                    <span className="text-slate-700 dark:text-neutral-300 truncate block font-bold" title={selectedInquiry.contact}>
                      {selectedInquiry.contact || '무회신'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:col-span-2">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">접수 일시</span>
                    <span className="text-slate-700 dark:text-neutral-300 block font-bold">
                      {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content text */}
              <div className="flex-1 space-y-2">
                <h4 className="text-[10px] text-slate-400 dark:text-neutral-500 font-bold uppercase tracking-wider">문의 상세 내용</h4>
                <div className="text-sm text-slate-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap break-all border border-slate-100 dark:border-neutral-850 bg-slate-50/30 dark:bg-neutral-900/40 p-5 rounded-2xl min-h-[150px]">
                  {selectedInquiry.content}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 dark:bg-neutral-900/30 border border-dashed border-slate-300 dark:border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[450px]">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 mb-4 animate-bounce">
                <ChevronDown className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-300">문의 상세 내역이 없습니다</h3>
              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1 max-w-xs">좌측 목록에서 제출된 오류 신고나 문의 내용을 클릭해 자세히 검토할 수 있습니다.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
