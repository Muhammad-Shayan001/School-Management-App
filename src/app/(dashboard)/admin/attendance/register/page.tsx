'use client';

import { useState, useEffect, useRef } from 'react';
import { getMonthlyAttendanceRegister } from '@/app/_lib/actions/attendance';
import { getClasses } from '@/app/_lib/actions/schools';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import { PageSpinner } from '@/app/_components/ui/spinner';
import { Badge } from '@/app/_components/ui/badge';
import {
  Printer, Calendar as CalendarIcon, ChevronLeft, GraduationCap,
  Users, BarChart3, AlertCircle, BookOpen, ArrowLeft
} from 'lucide-react';
import { useTerminology } from '@/app/_lib/context/InstitutionContext';
import { cn } from '@/app/_lib/utils/cn';
import { interceptWebViewDownload } from '@/app/_lib/utils/webview-download';
import Link from 'next/link';

export default function AdminMonthlyRegisterPage() {
  const { t } = useTerminology();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const printRef = useRef<HTMLDivElement>(null);

  // Load classes on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data: clsData } = await getClasses();
      setClasses(clsData || []);
      setIsLoading(false);
    };
    load();
  }, []);

  // If opened via the Android app's WebView redirect (open_external=true), auto-trigger print/download
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('open_external') === 'true') {
        // Remove the param from the URL to keep things clean
        const url = new URL(window.location.href);
        url.searchParams.delete('open_external');
        window.history.replaceState({}, document.title, url.toString());

        // Small delay to allow page render, then trigger print which mobile browsers expose as Save as PDF
        setTimeout(() => {
          window.print();
        }, 600);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Load register when class/month/year changes
  useEffect(() => {
    if (!selectedClassId) {
      setData(null);
      return;
    }
    const loadRegister = async () => {
      setIsLoadingRegister(true);
      const result = await getMonthlyAttendanceRegister(selectedClassId, year, month);
      setData(result.data);
      setIsLoadingRegister(false);
    };
    loadRegister();
  }, [selectedClassId, month, year]);

  const handleClassSelect = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    setSelectedClassId(classId);
    setSelectedClassName(cls ? `${cls.name}${cls.section && cls.section.toUpperCase() !== 'A' ? ` - ${cls.section}` : ''}` : '');
  };

  const handlePrint = () => {
    // If inside Android WebView, let interceptWebViewDownload open external browser
    if (interceptWebViewDownload()) return;
    window.print();
  };

  const getDayLabel = (d: number) => {
    const date = new Date(year, month - 1, d);
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[date.getDay()];
  };

  const daysArray = Array.from({ length: data?.daysInMonth || 31 }, (_, i) => i + 1);

  // Calculate class-level summary stats
  const classSummary = data?.students ? {
    totalStudents: data.students.length,
    avgPercentage: data.students.length > 0
      ? Math.round(data.students.reduce((sum: number, s: any) => sum + s.stats.percentage, 0) / data.students.length)
      : 0,
    totalPresent: data.students.reduce((sum: number, s: any) => sum + s.stats.present, 0),
    totalAbsent: data.students.reduce((sum: number, s: any) => sum + s.stats.absent, 0),
  } : null;

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 print:space-y-0 print:pb-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/attendance" className="flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors text-xs font-black uppercase tracking-widest">
              <ArrowLeft className="h-3.5 w-3.5" />
              Attendance Control
            </Link>
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter">Monthly Attendance Register</h1>
          <p className="text-text-secondary font-medium">Select a {t('unit').toLowerCase()} to view the complete monthly attendance sheet for all 30/31 days</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector */}
          <select
            value={selectedClassId}
            onChange={(e) => handleClassSelect(e.target.value)}
            className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-black outline-none min-w-[180px] focus:border-accent transition-colors"
          >
            <option value="">— {t('selectUnit')} —</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}{cls.section && cls.section.toUpperCase() !== 'A' ? ` - ${cls.section}` : ''}
              </option>
            ))}
          </select>

          {/* Month Selector */}
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-black outline-none"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-border rounded-xl text-sm font-black outline-none"
          >
            {[year - 1, year, year + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {selectedClassId && data && (
            <Button onClick={handlePrint} variant="outline" className="bg-white h-[42px]" leftIcon={<Printer className="h-4 w-4" />}>
              Print / PDF
            </Button>
          )}
        </div>
      </div>

      {/* No class selected state */}
      {!selectedClassId && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleClassSelect(cls.id)}
                className="group p-6 bg-white rounded-2xl border border-border hover:border-accent/40 hover:shadow-xl shadow-md transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <GraduationCap className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-black text-lg text-text-primary tracking-tight">
                      {cls.name}
                    </p>
                    {cls.section && cls.section.toUpperCase() !== 'A' && (
                      <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Section {cls.section}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {classes.length === 0 && (
            <div className="py-24 text-center">
              <AlertCircle className="h-16 w-16 text-amber-500/50 mx-auto mb-6" />
              <p className="text-text-secondary font-black text-xl tracking-tight">No classes found in this school.</p>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {selectedClassId && isLoadingRegister && <PageSpinner />}

      {/* Register loaded */}
      {selectedClassId && data && !isLoadingRegister && (
        <>
          {/* Class Summary Stats */}
          {classSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-white border-none shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Users className="h-5 w-5" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Total Students</p>
                    <p className="text-2xl font-black text-blue-600">{classSummary.totalStudents}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-none shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600"><BarChart3 className="h-5 w-5" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Avg Attendance</p>
                    <p className="text-2xl font-black text-emerald-600">{classSummary.avgPercentage}%</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-green-50 to-white border-none shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-100 text-green-600"><BookOpen className="h-5 w-5" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Total Present</p>
                    <p className="text-2xl font-black text-green-600">{classSummary.totalPresent}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-5 bg-gradient-to-br from-red-50 to-white border-none shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-red-100 text-red-600"><AlertCircle className="h-5 w-5" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Total Absent</p>
                    <p className="text-2xl font-black text-red-600">{classSummary.totalAbsent}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Register Table */}
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:bg-transparent" ref={printRef}>
            {/* Print Header */}
            <div className="hidden print:block p-8 text-center border-b border-black">
              <h1 className="text-2xl font-black uppercase mb-1">Monthly Attendance Register</h1>
              <h2 className="text-lg font-bold">Class: {selectedClassName} | Month: {new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })} {year}</h2>
              <p className="text-sm mt-2">Generated on: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="overflow-x-auto w-full pb-4">
              <table className="w-full text-[10px] text-center border-collapse print:text-[8px]">
                <thead className="bg-bg-tertiary/50 uppercase tracking-tighter font-black text-text-tertiary print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="px-3 py-3 text-left sticky left-0 z-20 bg-white border-b border-r border-border print:border-black min-w-[50px]">Roll</th>
                    <th className="px-3 py-3 text-left sticky left-[50px] z-20 bg-white border-b border-r border-border min-w-[140px] print:border-black">Student Name</th>
                    {daysArray.map(d => {
                      const dayStatus = data.dayStatuses?.[d];
                      const isOffOrHoliday = dayStatus === 'holiday' || dayStatus === 'off_day';
                      return (
                        <th key={d} className={cn(
                          "px-1 py-3 border-b border-r border-border min-w-[26px] print:border-black",
                          isOffOrHoliday && "bg-blue-50/70"
                        )}>
                          <div className="flex flex-col items-center">
                            <span className="text-[7px] opacity-60 print:opacity-100">{getDayLabel(d)}</span>
                            <span>{d}</span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="px-2 py-3 border-b border-r border-border bg-emerald-50 text-emerald-700 print:border-black min-w-[30px]">P</th>
                    <th className="px-2 py-3 border-b border-r border-border bg-red-50 text-red-700 print:border-black min-w-[30px]">A</th>
                    <th className="px-2 py-3 border-b border-r border-border bg-amber-50 text-amber-700 print:border-black min-w-[30px]">L</th>
                    <th className="px-2 py-3 border-b border-border bg-blue-50 text-blue-700 print:border-black min-w-[35px]">%</th>
                  </tr>
                </thead>
                <tbody className="print:text-black">
                  {data.students.length === 0 ? (
                    <tr><td colSpan={daysArray.length + 6} className="px-8 py-16 text-center text-text-tertiary font-bold italic">No students found in this class</td></tr>
                  ) : data.students.map((student: any, idx: number) => (
                    <tr key={student.userId} className={cn(idx % 2 === 0 ? "bg-white" : "bg-bg-secondary/10", "hover:bg-accent/5 transition-colors")}>
                      <td className="px-3 py-2 text-left sticky left-0 z-10 bg-inherit border-b border-r border-border font-bold print:border-black">{student.rollNumber || idx + 1}</td>
                      <td className="px-3 py-2 text-left sticky left-[50px] z-10 bg-inherit border-b border-r border-border font-bold truncate max-w-[140px] print:border-black">{student.name}</td>
                      {daysArray.map(d => {
                        const status = student.days[d];
                        let bgColor = '';
                        let textColor = 'text-text-primary print:text-black';
                        let label = status || '-';
                        if (status === 'P' || status === 'Late') { bgColor = 'bg-emerald-50 print:bg-transparent'; textColor = 'text-emerald-600 font-black print:text-black'; }
                        else if (status === 'A') { bgColor = 'bg-red-50 print:bg-transparent'; textColor = 'text-red-600 font-black print:text-black'; }
                        else if (status === 'L') { bgColor = 'bg-amber-50 print:bg-transparent'; textColor = 'text-amber-600 font-black print:text-black'; }
                        else if (status === 'H') { bgColor = 'bg-blue-50/60 print:bg-transparent'; textColor = 'text-blue-500 font-black text-[8px] print:text-black'; }
                        else if (status === 'OD') { bgColor = 'bg-purple-50/60 print:bg-transparent'; textColor = 'text-purple-500 font-black text-[8px] print:text-black'; }
                        return (
                          <td key={d} className={`px-0.5 py-2 border-b border-r border-border ${bgColor} print:border-black`}>
                            <span className={textColor}>{label}</span>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 border-b border-r border-border font-black text-emerald-600 print:border-black print:text-black bg-emerald-50/30">{student.stats.present}</td>
                      <td className="px-2 py-2 border-b border-r border-border font-black text-red-600 print:border-black print:text-black bg-red-50/30">{student.stats.absent}</td>
                      <td className="px-2 py-2 border-b border-r border-border font-black text-amber-600 print:border-black print:text-black bg-amber-50/30">{student.stats.leave}</td>
                      <td className={cn(
                        "px-2 py-2 border-b border-border font-black print:border-black print:text-black",
                        student.stats.percentage >= 75 ? "text-emerald-600 bg-emerald-50/30" : student.stats.percentage >= 50 ? "text-amber-600 bg-amber-50/30" : "text-red-600 bg-red-50/30"
                      )}>{student.stats.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-border flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary bg-bg-tertiary/50 print:bg-white print:border-black print:text-black">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-100 rounded inline-block print:border print:border-black" /> P = Present</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded inline-block print:border print:border-black" /> A = Absent</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-100 rounded inline-block print:border print:border-black" /> L = Leave</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-50 rounded inline-block print:border print:border-black" /> Late = Late</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-50 rounded inline-block print:border print:border-black" /> H = Holiday</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-50 rounded inline-block print:border print:border-black" /> OD = Off Day</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded inline-block print:border print:border-black" /> - = Unmarked</span>
            </div>
          </div>

          {/* Print Styles */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              nav, header, aside, .print\\:hidden { display: none !important; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { size: landscape; margin: 0.5cm; }
            }
          `}} />
        </>
      )}
    </div>
  );
}
