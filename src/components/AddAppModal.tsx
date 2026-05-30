/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus } from 'lucide-react';
import { AppService } from '../types';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (service: Omit<AppService, 'id' | 'createdAt' | 'ownerId'>) => void;
  onUpdate: (service: AppService) => void;
  categories: string[];
  initialData: AppService | null;
}

export default function AddAppModal({ isOpen, onClose, onAdd, onUpdate, categories, initialData }: AddAppModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [newCategory, setNewCategory] = React.useState('');

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setUrl(initialData.url);
      setCategory(categories.includes(initialData.category) ? initialData.category : 'new');
      if (!categories.includes(initialData.category)) {
        setNewCategory(initialData.category);
      }
    } else {
      setName('');
      setDescription('');
      setUrl('');
      setCategory('');
      setNewCategory('');
    }
  }, [initialData, categories, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;
    
    // Simple URL validation
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }

    const finalCategory = category === 'new' ? newCategory : (category || '일반');

    if (initialData) {
      onUpdate({
        ...initialData,
        name,
        description,
        url: formattedUrl,
        category: finalCategory,
      });
    } else {
      onAdd({
        name,
        description,
        url: formattedUrl,
        category: finalCategory,
      });
    }
    
    // Reset form
    setName('');
    setDescription('');
    setUrl('');
    setCategory('');
    setNewCategory('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white dark:bg-neutral-950 rounded-3xl shadow-2xl z-[70] overflow-hidden border border-gray-100 dark:border-neutral-800"
            id="add-service-modal"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-neutral-500">
                  {initialData ? '서비스 정보 수정' : '새 서비스 추가'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-xl transition-colors"
                  id="close-modal-btn"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      카테고리 선택/입력
                    </label>
                    <div className="flex flex-col gap-2">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                      >
                        <option value="">기타/기본</option>
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="new">+ 직접 입력하기</option>
                      </select>
                      
                      {category === 'new' && (
                        <input
                          autoFocus
                          required
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="새 카테고리 명칭 (예: 행정, 수업)"
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-medium"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      서비스 이름
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 3학년 성적 관리"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-medium"
                      id="input-service-name"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      웹사이트 주소 (URL)
                    </label>
                    <input
                      required
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="example.netlify.app"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-medium"
                      id="input-service-url"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      추가 설명 (선택)
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="이 웹앱의 용도를 간단히 적어주세요."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all resize-none text-sm font-medium"
                      id="input-service-desc"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    id="submit-service-btn"
                  >
                    {!initialData && <Plus className="w-5 h-5" />}
                    {initialData ? '수정 완료' : '서비스 등록하기'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
