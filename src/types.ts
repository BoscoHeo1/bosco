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
