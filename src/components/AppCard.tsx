/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ExternalLink, Trash2, Edit2, User, MousePointer2, BookOpen, Rocket, Gamepad2, Users, BarChart3, Calculator, Folder, FileText, Calendar, ClipboardCheck, Sprout, Wallet, Percent, Star } from 'lucide-react';
import { AppService } from '../types';
import { handleFirestoreError, OperationType, auth, db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface AppCardProps {
  key?: string | number;
  service: AppService;
  viewMode?: 'grid' | 'list';
  onEdit: (service: AppService) => void;
  onDelete: (id: string) => void;
}

export default function AppCard({ service, onEdit, onDelete, viewMode = 'grid' }: AppCardProps) {
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

  const iconRules = [
    { match: /설문|그래프|통계/, icon: BarChart3, tone: 0 },
    { match: /예산|영수증|학급비/, icon: Wallet, tone: 3 },
    { match: /비율|비례/, icon: Percent, tone: 4 },
    { match: /수학|계산|나눗셈/, icon: Calculator, tone: 2 },
    { match: /고고|로켓|도전/, icon: Rocket, tone: 4 },
    { match: /키워드|성장/, icon: Sprout, tone: 1 },
    { match: /반편성|모둠|학급운영/, icon: Users, tone: 2 },
    { match: /자료|파일/, icon: Folder, tone: 0 },
    { match: /일정|달력/, icon: Calendar, tone: 3 },
    { match: /행정|문서/, icon: FileText, tone: 3 },
    { match: /출석|체크/, icon: ClipboardCheck, tone: 1 },
    { match: /놀이|게임/, icon: Gamepad2, tone: 4 },
    { match: /국어|단어|독서|배움/, icon: BookOpen, tone: 2 },
    { match: /수업|도구/, icon: Star, tone: 0 },
  ];
  const appearance = iconRules.find(({ match }) => match.test(service.name || ''))
    || iconRules.find(({ match }) => match.test(service.category || ''));
  const fallbackIndex = Array.from(service.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5;
  const tones = [
    'bg-[#f0f7ff] border-[#dceaff] text-blue-600',
    'bg-[#f1fbf5] border-[#d8efdf] text-emerald-600',
    'bg-[#f6f2ff] border-[#e7ddfb] text-violet-600',
    'bg-[#fffaef] border-[#f5e7ce] text-amber-600',
    'bg-[#fff3f5] border-[#f5dde4] text-rose-500',
  ];
  const CardIcon = appearance?.icon || [Folder, Sprout, BookOpen, Calendar, Star][fallbackIndex];
  const cardTone = tones[appearance?.tone ?? fallbackIndex];
  const isList = viewMode === 'list';

  return (
    <div
      key={service.id}
      className={`group relative min-w-0 rounded-2xl border p-4 transition-colors duration-200 hover:border-blue-300 focus-within:border-blue-300 dark:bg-neutral-900 dark:border-neutral-800 ${cardTone} ${isList ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4' : 'flex h-full flex-col items-center text-center'}`}
      id={`service-card-${service.id}`}
    >
      <div aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-2xl bg-white/70 dark:bg-neutral-800 ${isList ? 'h-12 w-12' : 'mb-2 h-12 w-14'}`}>
        <CardIcon className="h-8 w-8" strokeWidth={1.7} />
      </div>
      <div className={`min-w-0 flex-1 ${isList ? '' : 'w-full'}`}>
        <span className="inline-block max-w-full truncate rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold dark:bg-neutral-800 dark:text-neutral-300" title={service.category || '기본'}>
          {service.category || '기본'}
        </span>
        <h3 className="mt-1 line-clamp-1 text-[17px] font-extrabold leading-6 tracking-tight text-[#0c1e46] dark:text-white" title={service.name}>
          {service.name}
        </h3>
        <p className={`mt-1.5 line-clamp-2 whitespace-pre-wrap break-words text-sm font-normal leading-5 text-slate-500 dark:text-neutral-300 ${isList ? '' : 'min-h-10'}`} title={service.description || '설명이 없습니다.'}>
          {service.description || '설명이 없습니다.'}
        </p>
      </div>
      {isAdmin && (
        <div className={`flex flex-wrap items-center justify-center gap-1 ${isList ? 'sm:max-w-40' : 'mt-2'}`}>
          {isAdmin && service.clickCount !== undefined && service.clickCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-neutral-800 rounded-lg mr-1" title="누적 접속 횟수">
              <MousePointer2 className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">{service.clickCount}</span>
            </div>
          )}
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(service)}
                className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:text-neutral-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                title="수정"
                id={`edit-btn-${service.id}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(service.id)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 dark:text-neutral-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                title="삭제"
                id={`delete-btn-${service.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <code className="max-w-[120px] truncate text-xs text-slate-500 dark:text-neutral-400">
            {service.url.replace(/^https?:\/\//, '')}
          </code>
        </div>
      )}
      <a
        href={service.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleServiceClick}
        className={`inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white bg-white/90 px-4 py-1.5 text-sm font-semibold text-[#214778] transition-colors hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-blue-200 ${isList ? 'sm:ml-auto' : 'mt-3 w-full'}`}
        id={`visit-link-${service.id}`}
      >
        접속하기
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
