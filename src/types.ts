/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppService {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string; // 유연한 카테고리명 사용
  ownerId: string;
  clickCount?: number;
  createdAt: number;
}

export interface Inquiry {
  id: string;
  title: string;
  content: string;
  category: string; // 'error' | 'feature' | 'general'
  contact?: string;
  userName?: string;
  createdAt: number;
  status: 'pending' | 'in_progress' | 'resolved';
}
