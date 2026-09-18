'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Timer,
  AlertTriangle,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useNotifications } from '@/context/NotificationContext';
import type { ReportType, IncidentReport } from '@/types';
import Pagination from '@/components/shared/Pagination';
import { Skeleton } from '@/components/ui/skeleton';

const REPORT_TYPES = [
  { value: 'DELAY', label: 'Route Delay', desc: 'Traffic or road issues', icon: Timer, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { value: 'INCIDENT', label: 'Incident', desc: 'Accidents or emergencies', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  { value: 'BREAKDOWN', label: 'Breakdown', desc: 'Vehicle mechanical issue', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'OTHER', label: 'Other', desc: 'Any other situation', icon: HelpCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
];

export default function DriverReport() {
  const { state: authState } = useAuth();
  const { addNotification } = useNotifications();

  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    if (!authState.token || !authState.user?.userId) return;
    (async () => {
      try {
        const res = await fetchWithAuth(
          `/api/reports?driverId=${authState.user!.userId}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReports(Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []);
      } catch {
        // silently fail – reports list is supplementary
      } finally {
        setLoading(false);
      }
    })();
  }, [authState.token, authState.user?.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          type: reportType,
          description: description.trim(),
          driverId: authState.user?.userId,
        }),
      });
      if (!res.ok) throw new Error();

      toast.success('Report submitted successfully');
      addNotification({
        title: 'Report Submitted',
        message: 'Your incident report has been recorded.',
        type: 'info',
      });

      setReportType('');
      setDescription('');

      const listRes = await fetchWithAuth(
        `/api/reports?driverId=${authState.user!.userId}`
      );
      if (listRes.ok) {
        const data = await listRes.json();
        setReports(Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []);
      }
    } catch {
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Submit Incident Report</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Log any issues that occur during your route.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Report Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {REPORT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = reportType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setReportType(type.value as ReportType)}
                      className={`text-left rounded-2xl border-2 p-4 transition-all flex items-start gap-3 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${type.bg} ${type.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'}`}>
                          {type.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {type.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Description
              </label>
              <div className="relative">
                <textarea
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none min-h-[120px]"
                  placeholder="Provide details about the situation..."
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                  {description.length} / 500
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !reportType || !description.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold rounded-xl px-5 py-3 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Incident History</h3>
        
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 text-sm">No incident reports found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((report) => {
              const typeInfo = REPORT_TYPES.find(t => t.value === report.type) || REPORT_TYPES[3];
              return (
                <div key={report.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-start gap-4">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 mt-0.5 ${
                    report.type === 'DELAY' ? 'bg-amber-100 text-amber-700' :
                    report.type === 'INCIDENT' ? 'bg-red-100 text-red-700' :
                    report.type === 'BREAKDOWN' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {typeInfo.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 dark:text-slate-100 break-words">
                      {report.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            {reports.length > PAGE_SIZE && (
              <div className="pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(reports.length / PAGE_SIZE)}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
