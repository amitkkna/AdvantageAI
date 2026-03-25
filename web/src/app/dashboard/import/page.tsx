'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { RoleGuard } from '@/components/role-guard';
import api from '@/lib/api';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

type Step = 'upload' | 'preview' | 'result';

interface PreviewData {
  headers: string[];
  totalRows: number;
  validRows: any[];
  invalidRows: { row: number; data: any; errors: string[] }[];
  validCount: number;
  invalidCount: number;
}

interface ImportResult {
  created: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export default function ImportPage() {
  const [entity, setEntity] = useState<string>('Asset');
  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast({ title: 'No file selected', variant: 'destructive' }); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity', entity);

      const { data } = await api.post('/bulk-import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(data.data);
      setStep('preview');
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.response?.data?.error || 'Failed to parse CSV', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const { data } = await api.post('/bulk-import/execute', { entity, rows: preview.validRows });
      setResult(data.data);
      setStep('result');
      toast({ title: `${data.data.created} ${entity.toLowerCase()}s imported successfully` });
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.response?.data?.error || 'Failed to import', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const resetWizard = () => {
    setStep('upload');
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SALES']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bulk Import</h1>
          <Button variant="outline" size="sm" onClick={() => window.open(`${api.defaults.baseURL}/bulk-import/template?entity=${entity}`, '_blank')}>
            <Download className="h-4 w-4 mr-2" />Download Template
          </Button>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-4">
          {(['upload', 'preview', 'result'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-primary text-primary-foreground' : i < ['upload', 'preview', 'result'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className="text-sm capitalize hidden sm:inline">{s}</span>
              {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload CSV File</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={entity} onValueChange={setEntity}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asset">Assets</SelectItem>
                    <SelectItem value="Client">Clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Select a CSV file to import {entity.toLowerCase()}s</p>
                <input ref={fileRef} type="file" accept=".csv" className="block mx-auto text-sm" />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upload & Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Card className="flex-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{preview.validCount}</p>
                    <p className="text-xs text-muted-foreground">Valid rows</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{preview.invalidCount}</p>
                    <p className="text-xs text-muted-foreground">Invalid rows</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {preview.invalidRows.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm text-red-600">Errors ({preview.invalidCount})</CardTitle></CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {preview.invalidRows.map((row) => (
                      <div key={row.row} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
                        <Badge variant="destructive" className="shrink-0">Row {row.row}</Badge>
                        <span className="text-red-600 dark:text-red-400">{row.errors.join('; ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-sm">Valid Data Preview (first 10 rows)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {preview.headers.slice(0, 8).map((h) => (
                          <th key={h} className="text-left p-2 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.validRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b">
                          {preview.headers.slice(0, 8).map((h) => (
                            <td key={h} className="p-2 truncate max-w-[150px]">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetWizard}>
                <ArrowLeft className="h-4 w-4 mr-2" />Back
              </Button>
              <Button onClick={handleImport} disabled={importing || preview.validCount === 0}>
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import {preview.validCount} {entity.toLowerCase()}s
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold">Import Complete</h2>
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-green-600">{result.created}</p>
                  <p className="text-sm text-muted-foreground">Created</p>
                </div>
                {result.failed > 0 && (
                  <div>
                    <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto text-left">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-500">Row {e.row}: {e.error}</p>
                  ))}
                </div>
              )}
              <Button onClick={resetWizard}>Import More</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
