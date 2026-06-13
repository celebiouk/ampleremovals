'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EmailHistory {
  id: string;
  date: string;
  payslip_reference: string;
  status: string;
}

export default function PayslipEmailPage() {
  const router = useRouter();
  const [history, setHistory] = useState<EmailHistory[]>([]);
  const [workerEmail, setWorkerEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/worker/payslips/email-history');
        const data = await response.json();

        if (data.success) {
          setHistory(data.email_history.emails);
          setWorkerEmail(data.email_history.worker_email);
        }
      } catch (e) {
        console.error('Failed to fetch email history:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading email history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link
        href="/payslips"
        className="text-purple-600 hover:text-purple-700 font-medium mb-6 inline-block"
      >
        ← Back to payslips
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Payslip Email Delivery</h1>

      {/* Email info */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <Mail size={24} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900">Email Settings</h2>
        </div>
        <p className="text-blue-800">
          Payslips will be sent to: <span className="font-semibold">{workerEmail}</span>
        </p>
      </div>

      {/* Email history */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Emails ({history.length})
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-600">
            No payslips have been emailed yet
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {history.map((email) => (
              <div key={email.id} className="p-6 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{email.payslip_reference}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(email.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={20} />
                    <span className="font-medium">Sent</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
