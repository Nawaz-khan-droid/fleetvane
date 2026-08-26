'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Send,
  Clock,
  AlertTriangle,
  Wrench,
  Timer,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { ReportType, IncidentReport } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/shared/Pagination';

// ── Report type options ──────────────────────────────────
const REPORT_TYPE_OPTIONS: { value: ReportType; label: string; icon: React.ElementType }[] = [
  { value: 'DELAY', label: t.driver.reportTypes.delay, icon: Timer },
  { value: 'INCIDENT', label: t.driver.reportTypes.incident, icon: AlertTriangle },
  { value: 'BREAKDOWN', label: t.driver.reportTypes.breakdown, icon: Wrench },
  { value: 'OTHER', label: t.driver.reportTypes.other, icon: HelpCircle },
];

// ── Badge colour per type ────────────────────────────────
const typeBadgeClass: Record<ReportType, string> = {
  DELAY: theme.status.requested,
  INCIDENT: theme.status.cancelled,
  BREAKDOWN: theme.status.assigned,
  OTHER: 'bg-slate-100 text-slate-800 border-slate-200',
};

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

  // ── Fetch recent reports ───────────────────────────────
  useEffect(() => {
    if (!authState.token || !authState.user?.userId) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/reports?driverId=${authState.user!.userId}`,
          { headers: { Authorization: `Bearer ${authState.token}` } }
        );
        if (!res.ok) throw new Error();
        const data: IncidentReport[] = await res.json();
        setReports(data);
      } catch {
        // silently fail – reports list is supplementary
      } finally {
        setLoading(false);
      }
    })();
  }, [authState.token, authState.user?.userId]);

  // ── Submit handler ─────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
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

      toast.success(t.driver.reportSubmitted);
      addNotification({
        title: 'Report Submitted',
        message: 'Your incident report has been recorded.',
        type: 'info',
      });

      // Reset form
      setReportType('');
      setDescription('');

      // Refresh list
      const listRes = await fetch(
        `/api/reports?driverId=${authState.user!.userId}`,
        { headers: { Authorization: `Bearer ${authState.token}` } }
      );
      if (listRes.ok) {
        const data: IncidentReport[] = await listRes.json();
        setReports(data);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* ── Report Form ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={theme.card.base}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <CardTitle className={theme.typography.h5}>
                  {t.driver.reportTitle}
                </CardTitle>
              </div>
              <CardDescription>{t.driver.reportSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Type */}
                <div>
                  <Label className={theme.form.label}>
                    {t.driver.reportType}
                  </Label>
                  <Select
                    value={reportType}
                    onValueChange={(val) => setReportType(val as ReportType)}
                  >
                    <SelectTrigger className={`w-full ${theme.form.select}`}>
                      <SelectValue placeholder={t.driver.reportType} />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {opt.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label className={theme.form.label}>
                    {t.driver.reportDescription}
                  </Label>
                  <Textarea
                    className={theme.form.textarea}
                    rows={5}
                    placeholder={t.driver.reportDescriptionPlaceholder}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className={theme.button.primary}
                  disabled={submitting || !reportType || !description.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? t.common.loading : t.driver.submitReport}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Recent Reports ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={theme.card.base}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <CardTitle className={theme.typography.h5}>
                  Recent Reports
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : reports.length === 0 ? (
                <p className={`${theme.typography.caption} text-center py-8`}>
                  {t.common.noResults}
                </p>
              ) : (
                <>
                <div className="space-y-3">
                  {reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                    >
                      <Badge
                        className={`${theme.status.badge} ${typeBadgeClass[report.type]} shrink-0 mt-0.5`}
                      >
                        {t.driver.reportTypes[
                          report.type.toLowerCase() as keyof typeof t.driver.reportTypes
                        ] || report.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {report.description}
                        </p>
                        <p className={theme.typography.caption}>
                          {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.max(1, Math.ceil(reports.length / PAGE_SIZE))}
                  onPageChange={setCurrentPage}
                />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
