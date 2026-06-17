import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User } from 'firebase/auth';

interface InquiryFormProps {
  user: User | null;
  onGoBack?: () => void;
}

export default function InquiryForm({ user, onGoBack }: InquiryFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('error'); // error, feature, general
  const [userName, setUserName] = useState(user?.displayName || '');
  const [contact, setContact] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('제목과 내용을 모두 작성해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const path = 'inquiries';
      await addDoc(collection(db, path), {
        title: title.trim(),
        content: content.trim(),
        category,
        userName: userName.trim() || '익명 사용자',
        contact: contact.trim() || '정보 없음',
        status: 'pending',
        createdAt: Date.now(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('문의 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto my-12 bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 p-8 md:p-12 text-center shadow-lg"
      >
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">소중한 의견이 접수되었습니다!</h3>
        <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          보내주신 내용(오류/건의 사항)을 개발자인 보스코쌤이 확인 후 조속히 개선 및 답변해 드리겠습니다. 감사합니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setTitle('');
              setContent('');
              setIsSuccess(false);
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-xl text-sm font-semibold transition-all"
          >
            추가로 문의하기
          </button>
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              웹 서비스 목록으로
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-3xl mx-auto bg-white dark:bg-neutral-950 rounded-3xl border border-slate-200 dark:border-neutral-900 shadow-sm overflow-hidden"
    >
      <div className="p-8 border-b border-slate-100 dark:border-neutral-900 bg-slate-50/50 dark:bg-neutral-900/30 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">오류 제보 및 의견 건의</h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">포털 서비스 이용 시 불편한 점이나 추가 기능 제보를 남겨주세요.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">분류</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'error', label: '🐛 오류 및 버그 제보' },
                { id: 'feature', label: '✨ 새로운 기능 제안' },
                { id: 'general', label: '💬 일반 문의/기타' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${
                    category === item.id
                      ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900 text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label htmlFor="submitter-name" className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">성함 또는 소속 (선택)</label>
              <input
                id="submitter-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="예: 6학년 1반 이선생님"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label htmlFor="submitter-contact" className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">연락처 또는 이메일 (선택)</label>
              <input
                id="submitter-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="답변을 받아보실 이메일이나 전화번호"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="inquiry-title" className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">제목<span className="text-red-500 ml-1">*</span></label>
            <input
              id="inquiry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문의 내용을 요약한 한 줄 제목을 적어주세요"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-semibold"
            />
          </div>

          <div>
            <label htmlFor="inquiry-content" className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">상세 내용<span className="text-red-500 ml-1">*</span></label>
            <textarea
              id="inquiry-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="오류 현상이라면 어떤 웹앱에서 발현되었는지, 기능 요청이라면 구체적인 동작 방식 등을 상세히 기재해주실 경우 더욱 신속하게 도움을 드릴 수 있습니다."
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-medium leading-relaxed resize-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-3">
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="px-5 py-3 border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900 text-slate-600 dark:text-neutral-400 rounded-xl text-sm font-semibold transition-all"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>의견 전송하기</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
