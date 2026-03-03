/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Trophy,
  UserPlus,
  Upload,
  Trash2,
  RotateCcw,
  Play,
  CheckCircle2,
  LayoutGrid,
  ClipboardList,
  X,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { Person, TabType } from './types';

const MOCK_NAMES = [
  '陳小明', '林美玲', '張大衛', '王曉華', '李建國',
  '黃淑芬', '吳志強', '蔡依林', '周杰倫', '許瑋甯',
  '劉德華', '郭富城', '黎明', '張學友', '金城武'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [names, setNames] = useState<Person[]>([]);
  const [inputText, setInputText] = useState('');

  // Lucky Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Person | null>(null);
  const [winners, setWinners] = useState<Person[]>([]);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [drawHistory, setDrawHistory] = useState<Person[]>([]);

  // Grouping State
  const [groupSize, setGroupSize] = useState(3);
  const [groups, setGroups] = useState<Person[][]>([]);

  // Duplicate detection
  const nameCounts = names.reduce((acc, person) => {
    acc[person.name] = (acc[person.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasDuplicates = Object.values(nameCounts).some((count: number) => count > 1);

  const [pendingNames, setPendingNames] = useState<Person[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());

  const handleLoadMockData = () => {
    const mockData = MOCK_NAMES.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name
    }));

    // 加上一點重複名單供測試
    const duplicates = MOCK_NAMES.slice(0, 3).map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name
    }));

    const combined = [...mockData, ...duplicates];
    setPendingNames(combined);
    setSelectedPendingIds(new Set(combined.map(p => p.id)));
  };

  const handleAddSelected = () => {
    const toAdd = pendingNames.filter(p => selectedPendingIds.has(p.id));
    setNames(prev => [...prev, ...toAdd]);
    setPendingNames([]);
    setSelectedPendingIds(new Set());
  };

  const togglePendingSelection = (id: string) => {
    const next = new Set(selectedPendingIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPendingIds(next);
  };

  const toggleAllPending = () => {
    if (selectedPendingIds.size === pendingNames.length) {
      setSelectedPendingIds(new Set());
    } else {
      setSelectedPendingIds(new Set(pendingNames.map(p => p.id)));
    }
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set();
    const uniqueNames = names.filter(person => {
      if (seen.has(person.name)) return false;
      seen.add(person.name);
      return true;
    });
    setNames(uniqueNames);
  };

  const handleSaveGroupsFile = async () => {
    if (groups.length === 0) return;

    // 產生格式化文本內容
    const date = new Date();
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    let content = `HR 分組報告 - 產生日期: ${dateString}\n`;
    content += `==================================\n\n`;

    groups.forEach((group, idx) => {
      content += `【第 ${idx + 1} 組】(${group.length} 人)\n`;
      content += `------------------\n`;
      group.forEach(person => {
        content += `• ${person.name}\n`;
      });
      content += `\n`;
    });

    // 檢查瀏覽器是否支援 showSaveFilePicker (File System Access API)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `分組報告_${dateString}.txt`,
          types: [{
            description: '文字檔案',
            accept: { 'text/plain': ['.txt'] },
          }],
        });

        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('儲存檔案時發生錯誤:', err);
        }
      }
    } else {
      // Fallback: 傳統下載方法
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const link = document.body.appendChild(document.createElement('a'));
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `分報告_${dateString}.txt`;
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 0);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const parsedNames = results.data
          .flat()
          .filter((n: any) => typeof n === 'string' && n.trim() !== '')
          .map((n: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: n.trim()
          }));

        setPendingNames(parsedNames);
        setSelectedPendingIds(new Set(parsedNames.map(p => p.id)));
      },
      header: false
    });
  };

  const handleAddNames = () => {
    if (!inputText.trim()) return;
    const newNames = inputText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n !== '')
      .map(n => ({
        id: Math.random().toString(36).substr(2, 9),
        name: n
      }));
    setNames(prev => [...prev, ...newNames]);
    setInputText('');
  };

  const removeName = (id: string) => {
    setNames(names.filter(n => n.id !== id));
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearAllNames = () => {
    setNames([]);
    setWinners([]);
    setDrawHistory([]);
    setGroups([]);
    setInputText('');
    setShowClearConfirm(false);
  };

  const startDraw = () => {
    if (names.length === 0) return;

    let pool = names;
    if (!allowRepeat) {
      pool = names.filter(n => !drawHistory.find(h => h.id === n.id));
    }

    if (pool.length === 0) {
      alert('所有人都已經中獎過囉！');
      return;
    }

    setIsDrawing(true);
    setCurrentWinner(null);

    let counter = 0;
    const duration = 3000;
    const interval = 100;
    const steps = duration / interval;

    const timer = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      setCurrentWinner(pool[randomIndex]);
      counter++;

      if (counter >= steps) {
        clearInterval(timer);
        const finalWinner = pool[Math.floor(Math.random() * pool.length)];
        setCurrentWinner(finalWinner);
        setDrawHistory(prev => [finalWinner, ...prev]);
        setIsDrawing(false);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, interval);
  };

  const handleGrouping = () => {
    if (names.length === 0) return;

    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const result: Person[][] = [];

    for (let i = 0; i < shuffled.length; i += groupSize) {
      result.push(shuffled.slice(i, i + groupSize));
    }

    setGroups(result);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Users className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">HR 抽籤分組小助手</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>總人數: {names.length}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-200/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('input')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeTab === 'input' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            名單匯入
          </button>
          <button
            onClick={() => setActiveTab('draw')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeTab === 'draw' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Trophy className="w-4 h-4" />
            獎品抽籤
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeTab === 'group' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            自動分組
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="w-5 h-5 text-indigo-500" />
                        匯入名單
                      </h2>
                      <button
                        onClick={handleLoadMockData}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        載入模擬名單
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors group cursor-pointer">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        <p className="text-sm text-slate-500">點擊或拖曳 CSV 檔案至此</p>
                      </div>

                      <div className="relative">
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="或在此貼上姓名（一行一個名字）"
                          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                        <button
                          onClick={handleAddNames}
                          disabled={!inputText.trim()}
                          className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          加入名單
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        名單預覽 ({names.length})
                      </h2>
                      {hasDuplicates && (
                        <span className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          偵測到重複姓名
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {hasDuplicates && (
                        <button
                          onClick={handleRemoveDuplicates}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                        >
                          移除重複
                        </button>
                      )}
                      {names.length > 0 && (
                        <div className="flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            {!showClearConfirm ? (
                              <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={() => setShowClearConfirm(true)}
                                className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                清空
                              </motion.button>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-1.5 bg-red-600 text-white rounded-lg p-1 pr-2"
                              >
                                <button
                                  onClick={clearAllNames}
                                  className="bg-white text-red-600 text-[10px] font-bold px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                                >
                                  確認
                                </button>
                                <button
                                  onClick={() => setShowClearConfirm(false)}
                                  className="text-[10px] font-bold px-1 hover:text-red-200 transition-colors"
                                >
                                  取消
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                    {/* 待加入名單 (Staging) */}
                    <AnimatePresence>
                      {pendingNames.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 sticky top-0 z-10 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPendingIds.size === pendingNames.length && pendingNames.length > 0}
                                onChange={toggleAllPending}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span className="text-sm font-bold text-slate-800">待加入名單 ({selectedPendingIds.size}/{pendingNames.length})</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPendingNames([])}
                                className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1"
                              >
                                取消
                              </button>
                              <button
                                onClick={handleAddSelected}
                                disabled={selectedPendingIds.size === 0}
                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                確認加入
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {pendingNames.map((p) => (
                              <label
                                key={p.id}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border",
                                  selectedPendingIds.has(p.id)
                                    ? "bg-white border-indigo-200 text-indigo-700 shadow-sm"
                                    : "bg-slate-100/50 border-transparent text-slate-500 hover:border-slate-200"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPendingIds.has(p.id)}
                                  onChange={() => togglePendingSelection(p.id)}
                                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="text-xs font-medium truncate">{p.name}</span>
                              </label>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {names.length === 0 && pendingNames.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                        <ClipboardList className="w-12 h-12 mb-2 opacity-20" />
                        <p>尚未匯入任何名單</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {names.map((person) => (
                          <div
                            key={person.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg group transition-colors",
                              (nameCounts[person.name] || 0) > 1
                                ? "bg-red-50 border border-red-100"
                                : "bg-slate-50 hover:bg-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-sm text-slate-700 truncate">{person.name}</span>
                              {(nameCounts[person.name] || 0) > 1 && (
                                <span className="text-[10px] bg-red-500 text-white px-1 rounded">重複</span>
                              )}
                            </div>
                            <button
                              onClick={() => removeName(person.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'draw' && (
              <motion.div
                key="draw"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />

                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">幸運大抽獎</h2>
                      <p className="text-slate-500">點擊按鈕開始隨機抽取一位幸運兒</p>
                    </div>

                    <div className="h-64 flex items-center justify-center mb-8 bg-slate-50 rounded-2xl border border-slate-100">
                      <AnimatePresence mode="wait">
                        {currentWinner ? (
                          <motion.div
                            key={currentWinner.id}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                          >
                            <motion.div
                              animate={isDrawing ? {
                                scale: [1, 1.1, 1],
                                transition: { repeat: Infinity, duration: 0.2 }
                              } : {}}
                              className={cn(
                                "text-6xl font-black tracking-tighter mb-4",
                                isDrawing ? "text-slate-300" : "text-indigo-600"
                              )}
                            >
                              {currentWinner.name}
                            </motion.div>
                            {!isDrawing && (
                              <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex items-center justify-center gap-2 text-emerald-600 font-bold"
                              >
                                <Trophy className="w-5 h-5" />
                                恭喜中獎！
                              </motion.div>
                            )}
                          </motion.div>
                        ) : (
                          <div className="text-slate-300 flex flex-col items-center">
                            <Trophy className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium">準備好了嗎？</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-6 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={allowRepeat}
                            onChange={(e) => setAllowRepeat(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">允許重複中獎</span>
                        </label>
                      </div>

                      <button
                        onClick={startDraw}
                        disabled={isDrawing || names.length === 0}
                        className={cn(
                          "group relative px-12 py-4 rounded-2xl font-bold text-lg transition-all overflow-hidden",
                          isDrawing || names.length === 0
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95"
                        )}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {isDrawing ? (
                            <>
                              <RotateCcw className="w-5 h-5 animate-spin" />
                              抽取中...
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5 fill-current" />
                              開始抽獎
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-indigo-500" />
                      中獎歷史
                    </h2>
                    <button
                      onClick={() => setDrawHistory([])}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                    {drawHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                        <p className="text-sm">尚無中獎紀錄</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {drawHistory.map((winner, idx) => (
                          <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            key={`${winner.id}-${idx}`}
                            className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                                {drawHistory.length - idx}
                              </span>
                              <span className="font-medium text-slate-900">{winner.name}</span>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'group' && (
              <motion.div
                key="group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-900">自動分組工具</h2>
                        {groups.length > 0 && (
                          <button
                            onClick={handleSaveGroupsFile}
                            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            匯出報告
                          </button>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm">設定每組人數，系統將隨機分配名單</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <span className="text-sm font-medium text-slate-600 px-2">每組人數</span>
                        <input
                          type="number"
                          min="1"
                          max={names.length}
                          value={groupSize}
                          onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                          className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <button
                        onClick={handleGrouping}
                        disabled={names.length === 0}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 flex items-center gap-2"
                      >
                        <UserPlus className="w-5 h-5" />
                        開始分組
                      </button>
                    </div>
                  </div>
                </div>

                {groups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group, idx) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:border-indigo-300 transition-all"
                      >
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                          <span className="font-bold text-slate-900">第 {idx + 1} 組</span>
                          <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-200">
                            {group.length} 人
                          </span>
                        </div>
                        <div className="p-4 space-y-2">
                          {group.map((person) => (
                            <div
                              key={person.id}
                              className="flex items-center gap-2 text-slate-700 text-sm p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              {person.name}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center">
                    <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-medium">設定人數並點擊按鈕開始分組</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
