import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Download, 
  Copy, 
  Trash2,
  BookOpen,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateTest, TestRequest } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [period, setPeriod] = useState('Cuối kì I');
  const [grade, setGrade] = useState('3');
  const [bookSeries, setBookSeries] = useState('Kết nối tri thức với cuộc sống');
  const [files, setFiles] = useState<{ name: string; mimeType: string; data: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const newFiles = await Promise.all(
      Array.from(uploadedFiles).map(async (file) => {
        return new Promise<{ name: string; mimeType: string; data: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({
              name: file.name,
              mimeType: file.type,
              data: base64String,
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (files.length === 0) {
      setError('Vui lòng tải lên ít nhất một tài liệu (ảnh hoặc PDF).');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const request: TestRequest = {
        period,
        grade,
        bookSeries,
        files: files.map(({ mimeType, data }) => ({ mimeType, data })),
      };

      const output = await generateTest(request);
      setResult(output || 'Không có kết quả trả về.');
    } catch (err: any) {
      console.error('Generation Error:', err);
      setError(`Lỗi: ${err.message || 'Đã xảy ra lỗi không xác định khi gọi API Gemini.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert('Đã sao chép vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <h1 className="font-bold text-xl text-slate-900 tracking-tight">
              AI Thiết kế Đề Tin học
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>GDPT 2018</span>
            <div className="w-px h-4 bg-slate-200" />
            <span>Tiểu học</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Controls */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-semibold text-slate-900">Cấu hình đề thi</h2>
                </div>
                {process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> ĐÃ KẾT NỐI AI
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" /> CHƯA NHẬN KEY
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Thời điểm kiểm tra
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Cuối kì I', 'Cuối năm'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cn(
                          "px-3 py-2 text-sm rounded-lg border transition-all",
                          period === p 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Khối lớp
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['3', '4', '5'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={cn(
                          "px-3 py-2 text-sm rounded-lg border transition-all",
                          grade === g 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        Lớp {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Bộ sách
                  </label>
                  <select
                    value={bookSeries}
                    onChange={(e) => setBookSeries(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option>Kết nối tri thức với cuộc sống</option>
                    <option>Chân trời sáng tạo</option>
                    <option>Cánh Diều</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-900">Tài liệu tham khảo</h2>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  multiple 
                  accept="image/*,application/pdf"
                />
                <div className="bg-slate-100 p-3 rounded-full w-fit mx-auto mb-3 group-hover:bg-indigo-100 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Tải lên ảnh hoặc PDF</p>
                <p className="text-xs text-slate-400 mt-1">SGK, Kế hoạch bài dạy...</p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-600 truncate">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeFile(idx)}
                        className="p-1 hover:text-red-600 text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || files.length === 0}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                isGenerating || files.length === 0
                  ? "bg-slate-300 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang thiết kế đề...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Sinh đề kiểm tra
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Result Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!result && !isGenerating ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full min-h-[500px] bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Chưa có đề thi nào</h3>
                  <p className="text-slate-500 max-w-sm">
                    Vui lòng cấu hình thông tin và tải lên tài liệu tham khảo để AI bắt đầu thiết kế đề kiểm tra cho bạn.
                  </p>
                </motion.div>
              ) : isGenerating ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Đang phân tích và tạo đề</h3>
                  <div className="space-y-3 max-w-xs w-full">
                    {[
                      "Đang đọc nội dung tài liệu...",
                      "Xác định yêu cầu cần đạt...",
                      "Xây dựng ma trận đề thi...",
                      "Soạn thảo câu hỏi trắc nghiệm...",
                      "Thiết kế phần tự luận...",
                      "Kiểm tra tính chính xác..."
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        {step}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Kết quả thiết kế</h3>
                        <p className="text-xs text-slate-500">Đã tuân thủ ma trận 40-40-20</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-600 transition-all flex items-center gap-2 text-sm font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        Sao chép
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        In đề thi
                      </button>
                    </div>
                  </div>
                  <div className="p-8 max-h-[80vh] overflow-y-auto prose prose-slate max-w-none">
                    <div className="markdown-body">
                      <Markdown>{result}</Markdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-5xl mx-auto px-4 mt-8 pb-12">
        <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Ma trận chuẩn
              </h4>
              <ul className="text-sm text-indigo-100 space-y-2 opacity-80">
                <li>• Nhận biết: 40% (4 điểm)</li>
                <li>• Thông hiểu: 40% (4 điểm)</li>
                <li>• Vận dụng: 20% (2 điểm)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Cấu trúc đề
              </h4>
              <ul className="text-sm text-indigo-100 space-y-2 opacity-80">
                <li>• 70% Trắc nghiệm (7 điểm)</li>
                <li>• 30% Tự luận (3 điểm)</li>
                <li>• 4 dạng câu hỏi trắc nghiệm</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Thời gian & Thang điểm
              </h4>
              <ul className="text-sm text-indigo-100 space-y-2 opacity-80">
                <li>• Thời gian làm bài: 35 phút</li>
                <li>• Tổng điểm: 10 điểm</li>
                <li>• Đáp án & Hướng dẫn chấm chi tiết</li>
              </ul>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-indigo-700 rounded-full blur-3xl opacity-30" />
        </div>
      </footer>
    </div>
  );
}
