/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ExternalLink, Trash2, Edit2, User, MousePointer2 } from 'lucide-react';
import { AppService } from '../types';
import { handleFirestoreError, OperationType, auth, db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface AppCardProps {
  key?: string | number;
  service: AppService;
  onEdit: (service: AppService) => void;
  onDelete: (id: string) => void;
}

export default function AppCard({ service, onEdit, onDelete }: AppCardProps) {
  const currentUser = auth.currentUser;
  const isAdmin = currentUser?.email === 'heoalchan@goedu.kr' && currentUser?.emailVerified;

  const handleServiceClick = async () => {
    const path = `services/${service.id}`;
    try {
      const serviceRef = doc(db, 'services', service.id);
      await updateDoc(serviceRef, {
        clickCount: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <div
      key={service.id}
      className="group relative flex flex-col p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 border-slate-200 hover:border-indigo-400 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-indigo-500 hover:-translate-y-1"
      id={`service-card-${service.id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <span 
          className="px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200"
        >
          {service.category || '기본'}
        </span>
        <div className="flex gap-1 items-center">
          {isAdmin && service.clickCount !== undefined && service.clickCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-neutral-800 rounded-lg mr-2" title="누적 접속 횟수">
              <MousePointer2 className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500">{service.clickCount}</span>
            </div>
          )}
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20 mr-1" />
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(service)}
                className="p-1.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 dark:hover:bg-indigo-950/30"
                title="수정"
                id={`edit-btn-${service.id}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(service.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 dark:hover:bg-red-950/30"
                title="삭제"
                id={`delete-btn-${service.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white mb-1.5 line-clamp-1">
          {service.name}
        </h3>
        <p className="text-sm text-slate-800 leading-relaxed dark:text-neutral-100 min-h-[2.5rem] whitespace-pre-wrap break-words font-semibold">
          {service.description || '설명이 없습니다.'}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
        <code className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono truncate max-w-[120px]">
          {service.url.replace(/^https?:\/\//, '')}
        </code>
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleServiceClick}
          className="text-indigo-600 font-bold text-xs uppercase tracking-tighter hover:text-indigo-700 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
          id={`visit-link-${service.id}`}
        >
          접속하기
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
