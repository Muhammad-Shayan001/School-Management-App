'use client';

import { useState, useRef, useCallback } from 'react';
import { parseImportFile, executeStudentImport } from '@/app/_lib/actions/import-students';
import type { ParsedStudent, ImportResult, ImportResultDetail } from '@/app/_lib/actions/import-students';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { Card } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { useCampusStore } from '@/app/_lib/store/campus-store';
import { cn } from '@/app/_lib/utils/cn';
import {
  Upload, FileText, AlertCircle, CheckCircle2, XCircle, Trash2, Edit3,
  Download, Users, Loader2, ArrowLeft, ArrowRight, Shield, Eye, FileUp
} from 'lucide-react';

type Step = 'upload' | 'preview' | 'importing' | 'complete';

export default function ImportStudentsPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { activeCampus } = useCampusStore();

  // ── File Handling ──────────────────────────────────────────────────────────
  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'svg'].includes(ext || '')) {
      setParseError('Invalid file type. Only PDF and SVG files are supported.');
      return;
    }
    setFile(f);
    setParseError('');
    setParsing(true);

    const formData = new FormData();
    formData.append('file', f);
    const res = await parseImportFile(formData);

    setParsing(false);
    if (res.error) { setParseError(res.error); return; }
    if (res.data && res.data.length > 0) {
      setStudents(res.data);
      setStep('preview');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    setStep('importing');
    const schoolId = activeCampus?.id || '';
    const result = await executeStudentImport(students, schoolId);
    setImportResult(result);
    setStep('complete');
  };

  // ── Edit Helpers ───────────────────────────────────────────────────────────
  const updateStudent = (id: string, field: keyof ParsedStudent, value: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };
  const validCount = students.filter(s => s.status === 'valid').length;
  const errorCount = students.filter(s => s.status === 'error').length;

  // ── Download Error Report ──────────────────────────────────────────────────
  const downloadReport = () => {
    if (!importResult) return;
    const lines = ['Name,Roll Number,Status,Email,Password,Error'];
    for (const d of importResult.details) {
      lines.push(`"${d.name}","${d.roll_number}","${d.status}","${d.email || ''}","${d.password || ''}","${d.error || ''}"`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `import-report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent" dot>Bulk Operations</Badge>
          </div>
          <h1 className="text-3xl font-black text-text-primary tracking-tighter flex items-center gap-3">
            <FileUp className="h-8 w-8 text-accent" />
            Import Students
          </h1>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Upload a PDF or SVG file to bulk-import student records
          </p>
        </div>
        {activeCampus && (
          <Badge variant="accent" className="px-4 py-2 text-xs font-black uppercase tracking-widest">
            {activeCampus.name}
          </Badge>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { key: 'upload', label: 'Upload', icon: Upload },
          { key: 'preview', label: 'Preview', icon: Eye },
          { key: 'importing', label: 'Import', icon: Loader2 },
          { key: 'complete', label: 'Complete', icon: CheckCircle2 },
        ].map((s, i) => {
          const isActive = s.key === step;
          const isDone = ['upload','preview','importing','complete'].indexOf(step) > i;
          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className={cn('h-0.5 w-8 rounded-full', isDone || isActive ? 'bg-accent' : 'bg-border')} />}
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                isActive ? 'bg-accent text-white shadow-lg shadow-accent/20' :
                isDone ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary/50 text-text-tertiary'
              )}>
                <s.icon className={cn('h-3.5 w-3.5', step === 'importing' && s.key === 'importing' && 'animate-spin')} />
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ STEP 1: UPLOAD ═══ */}
      {step === 'upload' && (
        <Card className="card-standard p-0 border-none shadow-2xl overflow-hidden">
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'p-16 text-center cursor-pointer transition-all duration-300 border-2 border-dashed rounded-[2rem]',
              dragOver ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-border/50 hover:border-accent/50 hover:bg-bg-tertiary/30',
              parsing && 'pointer-events-none opacity-60'
            )}
          >
            <input ref={fileRef} type="file" accept=".pdf,.svg" onChange={onFileChange} className="hidden" />
            <div className="flex flex-col items-center gap-6">
              <div className={cn(
                'h-24 w-24 rounded-[2rem] flex items-center justify-center transition-all duration-500',
                dragOver ? 'bg-accent text-white scale-110' : 'bg-accent/10 text-accent'
              )}>
                {parsing ? <Loader2 className="h-10 w-10 animate-spin" /> : <Upload className="h-10 w-10" />}
              </div>
              <div>
                <p className="text-xl font-black text-text-primary">
                  {parsing ? 'Analyzing File...' : 'Drop your file here'}
                </p>
                <p className="text-sm text-text-secondary mt-2 font-medium">
                  or <span className="text-accent font-black underline">browse</span> to upload
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="accent" className="text-[9px]">PDF</Badge>
                <Badge variant="accent" className="text-[9px]">SVG</Badge>
                <span className="text-[10px] text-text-tertiary font-bold">Max 10 MB</span>
              </div>
              {file && !parsing && (
                <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary/50 rounded-xl mt-2">
                  <FileText className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold text-text-primary">{file.name}</span>
                  <span className="text-[10px] text-text-tertiary">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          {parseError && (
            <div className="mx-8 mb-8 p-5 bg-danger/5 border border-danger/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-danger mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-black text-danger">Parse Error</p>
                <p className="text-xs text-danger/80 mt-1">{parseError}</p>
              </div>
            </div>
          )}

          {/* Format Guide */}
          <div className="px-8 pb-8 pt-4 border-t border-border/30">
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Expected File Format</p>
            <div className="bg-bg-tertiary/30 p-4 rounded-xl font-mono text-[11px] text-text-secondary overflow-x-auto">
              <p className="text-text-tertiary">{'| Student Name | Roll No | Class | Section | Father Name | Mobile |'}</p>
              <p>{'| Ahmed Khan   | 001     | 5     | A       | Khan Sr.    | 0300.. |'}</p>
              <p>{'| Sara Ali     | 002     | 5     | A       | Ali Sr.     | 0301.. |'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ═══ STEP 2: PREVIEW ═══ */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="flex items-center gap-4">
            <Card className="flex-1 p-4 bg-white border-border/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-black text-text-primary">{students.length}</p>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Total</p>
              </div>
            </Card>
            <Card className="flex-1 p-4 bg-white border-border/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600">{validCount}</p>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Valid</p>
              </div>
            </Card>
            <Card className="flex-1 p-4 bg-white border-border/50 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-black text-red-600">{errorCount}</p>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Errors</p>
              </div>
            </Card>
          </div>

          {/* Preview Table */}
          <Card className="p-0 border-none shadow-2xl bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">Data Preview</h2>
              <span className="text-[10px] text-text-tertiary font-bold">{file?.name}</span>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-premium">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-bg-tertiary/30 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                  <tr>
                    <th className="px-4 py-4 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">#</th>
                    <th className="px-4 py-4 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Name</th>
                    <th className="px-4 py-4 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Roll No</th>
                    <th className="px-4 py-4 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Class</th>
                    <th className="px-4 py-4 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Section</th>
                    <th className="px-4 py-4 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Father</th>
                    <th className="px-4 py-4 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Mobile</th>
                    <th className="px-4 py-4 text-center sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Status</th>
                    <th className="px-4 py-4 text-center sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {students.map((s, i) => (
                    <tr key={s.id} className={cn('hover:bg-bg-secondary/20 transition-colors', s.status === 'error' && 'bg-red-50/50')}>
                      <td className="px-4 py-3 text-text-tertiary font-bold text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        {editingId === s.id ? (
                          <input className="border rounded px-2 py-1 text-xs w-32" value={s.name} onChange={e => updateStudent(s.id, 'name', e.target.value)} />
                        ) : (
                          <span className="font-bold text-text-primary text-xs">{s.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === s.id ? (
                          <input className="border rounded px-2 py-1 text-xs w-20" value={s.roll_number} onChange={e => updateStudent(s.id, 'roll_number', e.target.value)} />
                        ) : (
                          <span className="text-xs text-text-secondary">{s.roll_number || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === s.id ? (
                          <input className="border rounded px-2 py-1 text-xs w-24" value={s.class_name} onChange={e => updateStudent(s.id, 'class_name', e.target.value)} />
                        ) : (
                          <span className="text-xs text-text-secondary">{s.class_name || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === s.id ? (
                          <input className="border rounded px-2 py-1 text-xs w-12" value={s.section} onChange={e => updateStudent(s.id, 'section', e.target.value)} />
                        ) : (
                          <span className="text-xs text-text-secondary">{s.section}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{s.father_name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{s.mobile || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={s.status === 'valid' ? 'success' : 'danger'} dot className="text-[9px]">
                          {s.status === 'valid' ? 'Ready' : s.errors[0]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent/10 text-text-tertiary hover:text-accent transition-colors">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => removeStudent(s.id)}
                            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-danger/10 text-text-tertiary hover:text-danger transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => { setStep('upload'); setStudents([]); setFile(null); }}
              className="rounded-xl" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
            <Button onClick={handleImport} disabled={validCount === 0}
              className="btn-primary rounded-xl px-8 h-12 font-black text-sm shadow-xl shadow-accent/20"
              leftIcon={<Shield className="h-4 w-4" />}>
              Confirm Import ({validCount} students)
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: IMPORTING ═══ */}
      {step === 'importing' && (
        <Card className="card-standard p-16 text-center border-none shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            <div className="h-24 w-24 rounded-[2rem] bg-accent/10 flex items-center justify-center animate-pulse">
              <Loader2 className="h-10 w-10 text-accent animate-spin" />
            </div>
            <div>
              <p className="text-xl font-black text-text-primary">Creating Student Accounts...</p>
              <p className="text-sm text-text-secondary mt-2">This may take a moment. Please do not close this page.</p>
            </div>
          </div>
        </Card>
      )}

      {/* ═══ STEP 4: COMPLETE ═══ */}
      {step === 'complete' && importResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-white border-border/50 text-center">
              <p className="text-3xl font-black text-text-primary">{importResult.total}</p>
              <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mt-1">Total Records</p>
            </Card>
            <Card className="p-6 bg-emerald-50 border-emerald-100 text-center">
              <p className="text-3xl font-black text-emerald-600">{importResult.successful}</p>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Imported</p>
            </Card>
            <Card className="p-6 bg-amber-50 border-amber-100 text-center">
              <p className="text-3xl font-black text-amber-600">{importResult.duplicates}</p>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Duplicates</p>
            </Card>
            <Card className="p-6 bg-red-50 border-red-100 text-center">
              <p className="text-3xl font-black text-red-600">{importResult.failed}</p>
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">Failed</p>
            </Card>
          </div>

          {/* Results Table */}
          <Card className="p-0 border-none shadow-2xl bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">Import Report</h2>
              <Button size="sm" variant="outline" onClick={downloadReport} className="rounded-xl"
                leftIcon={<Download className="h-3.5 w-3.5" />}>
                Download CSV
              </Button>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-premium">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-bg-tertiary/30 text-[10px] font-black uppercase tracking-widest text-text-tertiary border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Name</th>
                    <th className="px-4 py-3 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Roll No</th>
                    <th className="px-4 py-3 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Email</th>
                    <th className="px-4 py-3 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Password</th>
                    <th className="px-4 py-3 text-center sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Status</th>
                    <th className="px-4 py-3 text-left sticky top-0 bg-bg-tertiary/90 backdrop-blur-md z-10 whitespace-nowrap shadow-sm">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {importResult.details.map((d, i) => (
                    <tr key={i} className={cn(
                      'transition-colors',
                      d.status === 'success' && 'bg-emerald-50/30',
                      d.status === 'failed' && 'bg-red-50/30',
                      d.status === 'duplicate' && 'bg-amber-50/30',
                    )}>
                      <td className="px-4 py-3 font-bold text-text-primary text-xs">{d.name}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{d.roll_number}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary font-mono">{d.email || '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary font-mono">{d.password || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={d.status === 'success' ? 'success' : d.status === 'duplicate' ? 'warning' : 'danger'}
                          className="text-[9px] font-black uppercase">
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-text-tertiary">{d.error || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => { setStep('upload'); setStudents([]); setFile(null); setImportResult(null); }}
              className="rounded-xl" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Import More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
