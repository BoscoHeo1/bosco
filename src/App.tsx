/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, LayoutGrid, List, Sparkles, Github, LogIn, LogOut, User as UserIcon, HelpCircle, Inbox, BookOpen, ShieldCheck, ClipboardCheck, Heart, Users } from 'lucide-react';
import { AppService } from './types';
import AppCard from './components/AppCard';
import AddAppModal from './components/AddAppModal';
import InquiryForm from './components/InquiryForm';
import AdminInquiryDashboard from './components/AdminInquiryDashboard';
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, User, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
  setDoc,
  getDoc
} from 'firebase/firestore';

export default function App() {
  const [services, setServices] = useState<AppService[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<AppService | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visitCount, setVisitCount] = useState<number>(0);
  const [activeView, setActiveView] = useState<'services' | 'inquiry' | 'admin-inquiries'>('services');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Auth Status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === 'heoalchan@goedu.kr';

  // Visit Counting
  useEffect(() => {
    const trackVisit = async () => {
      const statsRef = doc(db, 'stats', 'portal');
      const path = 'stats/portal';
      try {
        // Use setDoc with merge for atomic increment/init
        await setDoc(statsRef, { 
          visitCount: increment(1) 
        }, { merge: true });
      } catch (e: any) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    };

    trackVisit();

    // Listen to visit count
    const unsubscribe = onSnapshot(doc(db, 'stats', 'portal'), (snapshot) => {
      if (snapshot.exists()) {
        setVisitCount(snapshot.data().visitCount || 0);
      }
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, 'stats/portal');
    });

    return () => unsubscribe();
  }, []);

  // Fetch from Firestore (Public read)
  useEffect(() => {
    const path = 'services';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedServices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppService[];
      setServices(fetchedServices);
      setFirestoreError(null);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setFirestoreError(error instanceof Error ? error.message : String(error));
    });

    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const cats = services.map(s => s.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const name = (s.name || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();
      const query = (searchQuery || '').toLowerCase();
      return name.includes(query) || desc.includes(query) || cat.includes(query);
    });
  }, [services, searchQuery]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage = error?.code || error?.message || String(error);
      
      if (errorMessage.includes('auth/unauthorized-domain') || errorMessage.includes('unauthorized-domain')) {
        alert(
          "🔒 [도메인 승인 필요]\n\n" +
          "현재 배포된 Netlify 도메인이 Firebase Authentication 승인 도메인 목록에 등록되지 않았습니다.\n\n" +
          "해결 방법:\n" +
          "1. 구글 Firebase Console(https://console.firebase.google.com/)에 접속합니다.\n" +
          "2. 해당 프로젝트의 [Authentication] -> [Settings(설정)] -> [Authorized domains(승인된 도메인)]으로 시퀀스를 이동합니다.\n" +
          "3. [Add domain(도메인 추가)]를 클릭하고 사용자님의 Netlify 도메인 주소(예: xxxxx.netlify.app)를 추가해주세요.\n\n" +
          "등록 후 1~2분 뒤 다시 시도하시면 정상적으로 로그인이 완료됩니다!"
        );
      } else {
        alert(`로그인 중 오류가 발생했습니다.\n오류 코드: ${errorMessage}`);
      }
    }
  };

  const handleLogout = () => auth.signOut();

  const handleAddService = async (newService: Omit<AppService, 'id' | 'createdAt' | 'ownerId'>) => {
    if (!user) return;
    
    const path = 'services';
    try {
      await addDoc(collection(db, path), {
        ...newService,
        ownerId: user.uid,
        createdAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleUpdateService = async (updatedService: AppService) => {
    if (!user) return;

    const path = `services/${updatedService.id}`;
    try {
      const serviceDoc = doc(db, 'services', updatedService.id);
      await updateDoc(serviceDoc, {
        name: updatedService.name,
        description: updatedService.description,
        url: updatedService.url,
        category: updatedService.category,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleEditClick = (service: AppService) => {
    if (isAdmin) {
      setEditingService(service);
      setIsModalOpen(true);
    } else {
      alert('관리자만 수정할 수 있습니다.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleDeleteService = async (id: string) => {
    if (!user) return;
    
    // Check ownership
    const service = services.find(s => s.id === id);
    if (!service || !isAdmin) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (confirm('이 서비스를 목록에서 삭제하시겠습니까?')) {
      const path = `services/${id}`;
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] dark:bg-neutral-950 text-[#172b4d] dark:text-neutral-100 font-sans flex flex-col">
      {/* Header */}
      <header className="min-h-20 bg-white dark:bg-neutral-950 border-b border-[#dce7f3] dark:border-neutral-900 px-4 py-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sticky top-0 z-50">
        <div className="flex items-center gap-2.5 text-slate-500 dark:text-neutral-400">
          <BookOpen aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-500" strokeWidth={1.8} />
          <h1 className="text-sm font-semibold leading-6">
            <span className="md:hidden">보스코쌤 · 학교생활 도구 모음</span>
            <span className="hidden md:inline">선생님을 위한 학교생활 도구 모음</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4 pr-4 border-r border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-semibold">{services.length}개 서비스</span>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-sm font-semibold">누적 방문 {visitCount.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center gap-2"
                id="header-add-btn"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">추가</span>
              </button>
              
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-neutral-800">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200 dark:border-neutral-800" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {user && !isAdmin && (
             <div className="flex items-center gap-3">
               <span className="text-xs text-slate-400 font-medium hidden sm:inline">{user.displayName} 선생님</span>
               <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button>
             </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 w-full max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-white dark:bg-neutral-950 border-r border-[#e0eafa] dark:border-neutral-800 px-5 py-7 hidden md:flex flex-col justify-between gap-8 sticky top-20 self-start h-[calc(100dvh-80px)] overflow-y-auto">
          <nav className={activeView === 'services' ? 'space-y-6' : 'space-y-7'}>
            {activeView === 'services' && (
              <div className="flex items-center gap-3 px-2 pb-2">
                <BookOpen aria-hidden="true" className="h-10 w-10 shrink-0 text-[#1677ed]" strokeWidth={1.8} />
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-[#081b4b] dark:text-white">보스코쌤</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">학교생활 도구 모음</p>
                </div>
              </div>
            )}
            <section>
              <p className="text-xs text-slate-500 font-semibold mb-3 ml-3">메뉴</p>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveView('services'); setSearchQuery(''); }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-2.5 transition-colors text-sm ${
                    activeView === 'services' && !searchQuery
                      ? 'bg-[#1677ed] text-white dark:bg-[#1677ed]'
                      : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100/70 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 shrink-0 text-current" />
                  웹 서비스 목록
                </button>
                <button
                  onClick={() => setActiveView('inquiry')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-2.5 transition-colors text-sm ${
                    activeView === 'inquiry'
                      ? 'bg-[#1677ed] text-white dark:bg-[#1677ed]'
                      : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100/70 dark:hover:bg-neutral-800/40'
                  }`}
                >
                  <HelpCircle className="w-5 h-5 shrink-0 text-current" />
                  오류 및 문의 접수
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setActiveView('admin-inquiries')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-2.5 transition-all text-sm ${
                      activeView === 'admin-inquiries'
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100/70 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <Inbox className="w-4 h-4 text-orange-500" />
                    <span>문의 내역 관리</span>
                  </button>
                )}
              </div>
            </section>

            {activeView === 'services' && (
              <>
                <section>
                  <p className="text-sm font-semibold text-[#172b4d] dark:text-neutral-300 mb-3 px-3">카테고리</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => { setActiveView('services'); setSearchQuery(''); }}
                      className={`w-full min-h-11 text-left px-3 py-2.5 rounded-xl border font-semibold flex items-center gap-3 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 ${
                        !searchQuery ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300' : 'bg-white border-slate-200 text-[#172b4d] hover:bg-blue-50/60 hover:border-blue-200 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <span className="w-2 h-2 shrink-0 rounded-full bg-current opacity-60" />
                      전체 보기
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setActiveView('services'); setSearchQuery(c); }}
                        className={`w-full min-h-11 text-left px-3 py-2.5 rounded-xl border font-semibold flex items-center gap-3 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 ${
                          searchQuery === c ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300' : 'bg-white border-slate-200 text-[#172b4d] hover:bg-blue-50/60 hover:border-blue-200 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900'
                        }`}
                      >
                        <span className="w-2 h-2 shrink-0 rounded-full bg-current opacity-60" />
                        {c}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </nav>

          <div className="p-4 bg-blue-50/60 dark:bg-neutral-950 rounded-xl border border-blue-100 dark:border-neutral-800">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">활성화 상태</p>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                className="h-full bg-emerald-500" 
              />
            </div>
            <p className="text-[10px] font-bold mt-2 text-slate-500 uppercase tracking-tight">모든 서비스 정상</p>
          </div>
        </aside>

        {/* Content */}
        <main className={`flex-1 min-w-0 flex flex-col ${activeView === 'services' ? 'p-4 lg:p-6 gap-4 bg-white dark:bg-neutral-950' : 'p-4 sm:p-6 lg:p-8 xl:p-10 gap-8'}`}>
          {activeView === 'services' && (
            <section aria-labelledby="portal-hero-title" className="overflow-hidden rounded-3xl border border-blue-100 bg-[#eaf4ff] dark:border-blue-950 dark:bg-[#101f38]">
              <div className="relative grid min-w-0 overflow-hidden lg:min-h-[300px] lg:grid-cols-[2fr_3fr] xl:min-h-[320px]">
                <div className="relative z-10 min-w-0 px-5 pt-6 pb-3 sm:px-7 lg:self-center lg:py-7 lg:pr-0">
                  <h2 id="portal-hero-title" className="text-3xl font-extrabold leading-[1.18] tracking-tight text-[#071747] sm:text-4xl xl:text-5xl dark:text-white">
                    보스코쌤의<br />학교생활
                  </h2>
                  <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#233b65] sm:text-base sm:leading-7 dark:text-blue-100">
                    아이들과 선생님을 위한<br />
                    작지만 큰 변화, 수업이 더 즐거워지는 도구들
                  </p>
                </div>
                <div className="relative h-52 min-w-0 overflow-hidden sm:h-60 lg:h-auto lg:self-stretch">
                  <img
                    src="/assets/bosco-teacher.png"
                    alt="책상 위 노트북과 책 옆에서 아이들과 더 나은 내일을 응원하는 보스코쌤"
                    width={1536}
                    height={1024}
                    decoding="async"
                    className="absolute inset-0 block h-full w-full max-w-none origin-[50%_32%] scale-125 object-contain object-bottom"
                  />
                </div>
              </div>
              <div className="relative mx-3 mb-3 mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><ShieldCheck className="h-6 w-6" strokeWidth={1.8} /></span>
                  <p className="text-sm leading-6 text-[#354c75] dark:text-neutral-300">바로 사용할 수 있는<br /><span className="font-bold text-[#172b4d] dark:text-white">웹앱 모음</span></p>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"><ClipboardCheck className="h-6 w-6" strokeWidth={1.8} /></span>
                  <p className="text-sm leading-6 text-[#354c75] dark:text-neutral-300">교실에서 검증된<br /><span className="font-bold text-[#172b4d] dark:text-white">실용적인 도구</span></p>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-300"><Heart className="h-6 w-6" strokeWidth={1.8} /></span>
                  <p className="text-sm leading-6 text-[#354c75] dark:text-neutral-300">선생님과 아이들을 위한<br /><span className="font-bold text-[#172b4d] dark:text-white">지속적인 업데이트</span></p>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"><Users className="h-6 w-6" strokeWidth={1.8} /></span>
                  <p className="text-sm leading-6 text-[#354c75] dark:text-neutral-300">함께 만드는<br /><span className="font-bold text-[#172b4d] dark:text-white">더 나은 학교생활</span></p>
                </div>
              </div>
            </section>
          )}

          {activeView === 'services' && (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-[#071747] dark:text-white">앱 둘러보기</h2>
                <p className="mt-2 text-sm leading-6 text-[#627799] dark:text-neutral-400">교실에서 바로 사용할 수 있는 다양한 도구들을 만나보세요.</p>
              </div>
              
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1677ed] transition-colors" />
                <input
                  type="text"
                  placeholder="검색어를 입력해 주세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-11 pl-12 pr-4 py-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-[#d5e2f0] dark:border-neutral-700 text-base text-[#172b4d] dark:text-neutral-100 placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none transition-colors"
                  id="search-input"
                />
              </div>
            </div>
          )}

          {activeView === 'services' && (
            <div className="flex flex-wrap gap-2" aria-label="앱 카테고리">
              <button
                onClick={() => { setActiveView('services'); setSearchQuery(''); }}
                aria-pressed={!searchQuery}
                className={`min-h-9 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${!searchQuery ? 'border-[#1677ed] bg-[#1677ed] text-white' : 'border-slate-200 bg-slate-50 text-[#172b4d] hover:border-blue-200 hover:bg-blue-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'}`}
              >전체</button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setActiveView('services'); setSearchQuery(c); }}
                  aria-pressed={searchQuery === c}
                  className={`min-h-9 max-w-full break-words rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${searchQuery === c ? 'border-[#1677ed] bg-[#1677ed] text-white' : 'border-slate-200 bg-slate-50 text-[#172b4d] hover:border-blue-200 hover:bg-blue-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'}`}
                >{c}</button>
              ))}
            </div>
          )}

          {activeView === 'inquiry' && (
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">오류 및 문의 접수</h2>
              <p className="text-slate-600 dark:text-neutral-400 mt-2 font-medium">오류 제보, 기능 건의 등 보스코쌤에게 직접 피드백을 전달할 수 있습니다.</p>
            </div>
          )}

          {activeView === 'admin-inquiries' && isAdmin && (
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">의견 및 문의 관리</h2>
              <p className="text-slate-600 dark:text-neutral-400 mt-2 font-medium">선생님들이 전송한 피드백을 실시간으로 관리하는 대시보드입니다.</p>
            </div>
          )}

          <div className={activeView === 'services' ? 'min-h-0' : 'min-h-[400px]'}>
            {activeView === 'services' && (
              firestoreError ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center max-w-2xl mx-auto my-12 shadow-sm">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400 font-bold text-xl">
                    !
                  </div>
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">데이터를 불러오는 데 실패했습니다</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-5">
                    Firebase Firestore 데이터베이스에서 정보를 수집하지 못했습니다. 보안 규칙(firestore.rules)이 올바르게 배포되었는지 점검하시고, 다시 로그인하여 확인해보세요.
                  </p>
                  <code className="text-xs bg-red-100/50 dark:bg-red-950/80 px-3 py-2.5 rounded font-mono text-red-800 dark:text-red-300 block break-all text-left max-h-40 overflow-y-auto border border-red-200/50 dark:border-red-900/30">
                    {firestoreError}
                  </code>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-40">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div id="services-grid-wrapper" className="space-y-3 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                      검색 결과 <span className="font-semibold text-[#172b4d] dark:text-white">{filteredServices.length}</span>개
                    </p>
                    <div className="inline-flex shrink-0 gap-1 rounded-xl border border-blue-100 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex h-8 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        viewMode === 'grid' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-blue-300'
                      }`}
                      title="그리드 뷰"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex h-8 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        viewMode === 'list' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-blue-300'
                      }`}
                      title="리스트 뷰"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                  {filteredServices.length > 0 ? (
                    <div
                      className={
                        viewMode === 'grid' 
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch gap-3 xl:gap-4"
                          : "flex flex-col gap-3"
                      }
                      id="services-container"
                    >
                      {filteredServices.map((service: AppService) => (
                        <AppCard 
                          key={service.id} 
                          service={service}
                          viewMode={viewMode}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteService} 
                        />
                      ))}
                      
                      {viewMode === 'grid' && isAdmin && (
                        <div
                          onClick={() => setIsModalOpen(true)}
                          className="bg-slate-50 dark:bg-neutral-900 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-neutral-800 flex flex-col items-center justify-center group cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors h-full min-h-[180px]"
                          id="grid-add-btn"
                        >
                          <div className="w-10 h-10 rounded-full border-2 border-slate-400 border-dashed flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5 text-slate-500" />
                          </div>
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">새 서비스 등록</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center py-24 text-center rounded-3xl bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 shadow-sm"
                      id="empty-state"
                    >
                      <div className="w-16 h-16 bg-slate-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6">
                        <Search className="w-8 h-8 text-slate-300 dark:text-neutral-700" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">검색 결과가 없습니다</h3>
                      <p className="text-slate-500 dark:text-neutral-400 text-sm font-medium mt-1">
                        {searchQuery ? `"${searchQuery}"에 해당하는 서비스를 찾을 수 없습니다.` : "등록된 서비스가 없습니다."}
                      </p>
                      {!searchQuery && isAdmin && (
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                          id="empty-state-add-btn"
                        >
                          첫 서비스 등록하기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            )}

            {activeView === 'inquiry' && (
              <InquiryForm user={user} onGoBack={() => setActiveView('services')} />
            )}

            {activeView === 'admin-inquiries' && isAdmin && (
              <AdminInquiryDashboard />
            )}
          </div>

          <footer className={`py-6 border-t border-[#dce7f3] dark:border-neutral-900 flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 text-slate-500 ${activeView === 'services' ? 'mt-2' : 'mt-6'}`}>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span>© 2026</span>
                <span className="text-slate-300 flex items-center justify-center">/</span>
                <span>보스코쌤의 학교생활 포털</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveView('inquiry')}
                  className="text-xs font-medium hover:text-[#1677ed] transition-colors cursor-pointer"
                >
                  오류 및 문의 제보
                </button>
                <span className="text-slate-300">/</span>
                {!user ? (
                  <button 
                    onClick={handleLogin}
                    className="text-xs font-medium hover:text-[#1677ed] transition-colors cursor-pointer"
                  >
                    관리자 로그인
                  </button>
                ) : (
                  <button 
                    onClick={handleLogout}
                    className="text-xs font-medium hover:text-red-500 transition-colors cursor-pointer"
                  >
                    로그아웃
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </footer>
        </main>
      </div>

      <AddAppModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onAdd={handleAddService} 
        onUpdate={handleUpdateService}
        categories={categories}
        initialData={editingService}
      />
    </div>
  );
}

