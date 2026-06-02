'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface UploadResponse {
  success: boolean;
  totalStudents: number;
  successful: number;
  failed: number;
  details?: Array<{
    email: string;
    name: string;
    success: boolean;
    error?: string;
  }>;
  error?: string;
  diagnostics?: {
    fileType?: string;
    fileName?: string;
    textExtracted?: boolean;
    textLength?: number;
    errorType?: string;
    errorDetails?: string;
    suggestion?: string;
  };
}

interface ImportResult {
  totalFound: number;
  successfulImports: number;
  failedRecords: number;
  studentDetails: Array<{
    name: string;
    email: string;
    rollNo?: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

export function StudentBulkUploadComponent() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setError('');
    setUploadResult(null);

    // Validate file type
    const validTypes = ['application/pdf', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.svg') && !file.name.endsWith('.pdf')) {
      setError('Only SVG and PDF files are supported');
      toast.error('Invalid file type. Use SVG or PDF.');
      return;
    }

    setFileName(file.name);
    setShowPreview(true);
  };

  const handleUpload = async () => {
    if (!fileName) {
      setError('Please select a file first');
      return;
    }

    // Get the file from input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setError('File selection was lost. Please select again.');
      return;
    }

    const file = fileInput.files[0];
    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/student-bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        // Handle error with diagnostics
        const errorMsg = data.error || 'Upload failed';
        setError(errorMsg);

        if (data.diagnostics) {
          const diagnostic = data.diagnostics;
          const diagnosticInfo = [
            diagnostic.errorType && `Error Type: ${diagnostic.errorType}`,
            diagnostic.suggestion && `Suggestion: ${diagnostic.suggestion}`,
            diagnostic.fileType && `File Type: ${diagnostic.fileType}`,
            diagnostic.textExtracted === false && 'No text extracted from file',
          ]
            .filter(Boolean)
            .join('\n');

          if (diagnosticInfo) {
            console.error('Diagnostic Info:', diagnosticInfo);
            toast.error(`${errorMsg}\n${diagnosticInfo}`, { duration: 5000 });
          }
        } else {
          toast.error(errorMsg);
        }
        return;
      }

      // Success
      if (data.success) {
        setUploadResult({
          totalFound: data.totalStudents,
          successfulImports: data.successful,
          failedRecords: data.failed,
          studentDetails: (data.details || []).map(d => ({
            name: d.name,
            email: d.email,
            status: d.success ? 'success' : 'failed',
            error: d.error,
          })),
        });

        toast.success(
          `Successfully imported ${data.successful}/${data.totalStudents} students!`
        );

        // Reset
        setFileName('');
        setShowPreview(false);
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setFileName('');
    setError('');
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600" />
            Bulk Import Students
          </h2>
          <p className="text-gray-600 mt-2">
            Upload SVG or PDF files containing student data to automatically create accounts
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {!showPreview && !uploadResult && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".svg,.pdf,image/svg+xml,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="pointer-events-none">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900">
                    Drag and drop your file here
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    or click to select (SVG or PDF)
                  </p>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-900 font-semibold">Import Failed</p>
                      <p className="text-red-800 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                  
                  {error.includes('Could not detect any student records') && (
                    <div className="bg-red-100 rounded p-3 text-sm text-red-900 space-y-2">
                      <p className="font-semibold">⚠️ What to check:</p>
                      <ul className="text-xs text-red-800 space-y-1 ml-4 list-disc">
                        <li>Is the file exported as SVG or PDF (not image)?</li>
                        <li>Does it have a header row with: Name, Roll No, Class, Section, Email, Password?</li>
                        <li>Are all email addresses valid (contain @ and .)?</li>
                        <li>Are all student records in the correct format?</li>
                      </ul>
                      <p className="text-xs text-red-800 mt-2 pt-2 border-t border-red-200">
                        💡 <strong>Tip:</strong> Try exporting as SVG from Excel - it works best with the parser.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* File Info */}
              {fileName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Selected file: <span className="font-semibold text-gray-900">{fileName}</span>
                  </p>
                </div>
              )}

              {/* Format Info */}
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-3">
                    📋 Supported File Formats & Requirements:
                  </p>
                  <div className="space-y-2 ml-0">
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold">✓ SVG Files (Recommended)</p>
                      <p className="text-xs text-amber-700 mt-1">Export from Excel, Word, or Google Sheets</p>
                    </div>
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold">✓ PDF Files (Text-based)</p>
                      <p className="text-xs text-amber-700 mt-1">Not scanned/image PDFs - must be text-extractable</p>
                    </div>
                  </div>
                  <hr className="my-3 border-amber-300" />
                  <p className="text-xs font-semibold text-amber-900 mb-2">Required Columns:</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <span className="font-semibold">Name</span> • <span className="font-semibold">Roll No</span> • <span className="font-semibold">Class</span> • <span className="font-semibold">Section</span> • <span className="font-semibold">Email</span> • <span className="font-semibold">Password</span>
                  </p>
                  <p className="text-xs text-amber-600 mt-2 italic">Optional: Father Name, Mobile</p>
                </div>

                <details className="bg-blue-50 border border-blue-200 rounded-lg">
                  <summary className="px-4 py-3 cursor-pointer font-semibold text-blue-900 hover:bg-blue-100 transition-colors">
                    📖 How to Prepare Your File
                  </summary>
                  <div className="px-4 py-3 pt-0 text-sm text-blue-800 space-y-2 bg-blue-50">
                    <p><strong>Step 1:</strong> Create a spreadsheet (Excel, Google Sheets, Word table)</p>
                    <p><strong>Step 2:</strong> Add headers: Name | Roll No | Class | Section | Email | Password</p>
                    <p><strong>Step 3:</strong> Fill in student data (one student per row)</p>
                    <p><strong>Step 4:</strong> Export/Save as <strong>SVG</strong> or <strong>PDF</strong></p>
                    <p className="text-xs text-blue-600 mt-2">💡 Tip: SVG works better with most spreadsheet apps</p>
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* Preview */}
          {showPreview && !uploadResult && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900">File Selected</p>
                  <p className="text-sm text-blue-800">{fileName}</p>
                </div>
              </div>

              <p className="text-gray-700">
                Click <span className="font-semibold">"Confirm Import"</span> to process this file
                and create student accounts. This operation cannot be undone.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin">⊙</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Import
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isUploading}
                  className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {uploadResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-semibold">Total Found</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {uploadResult.totalFound}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-semibold">Successful</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {uploadResult.successfulImports}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-semibold">Failed</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">
                    {uploadResult.failedRecords}
                  </p>
                </div>
              </div>

              {/* Details Table */}
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {uploadResult.studentDetails.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-100 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                        <td className="px-4 py-3 text-center">
                          {student.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                              <CheckCircle className="w-4 h-4" />
                              Success
                            </span>
                          ) : (
                            <span
                              title={student.error}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-semibold cursor-help"
                            >
                              <X className="w-4 h-4" />
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setUploadResult(null);
                    setShowPreview(false);
                    setFileName('');
                    setError('');
                    const fileInput = document.getElementById('file-input') as HTMLInputElement;
                    if (fileInput) {
                      fileInput.value = '';
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
