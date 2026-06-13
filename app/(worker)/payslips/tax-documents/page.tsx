'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface TaxDocument {
  id: string;
  name: string;
  description: string;
  available: boolean;
  type: string;
  generatedDate: string;
}

interface TaxYear {
  year: number;
  ytd_gross: number;
  ytd_tips: number;
  ytd_net: number;
  estimated_tax: number;
  estimated_ni: number;
  payslip_count: number;
}

export default function TaxDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [taxYear, setTaxYear] = useState<TaxYear | null>(null);
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/worker/tax-documents');
        const data = await response.json();

        if (data.success) {
          setDocuments(data.available_documents);
          setTaxYear(data.tax_year);
          setWorker(data.worker);
        }
      } catch (e) {
        console.error('Failed to fetch tax documents:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [router]);

  const handleDownload = (docId: string) => {
    // In production, this would generate and download the actual PDF
    console.log(`Downloading ${docId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading tax documents...</p>
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

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Tax Documents</h1>
      <p className="text-slate-600 mb-8">
        Download your tax documents and certificates for {taxYear?.year}
      </p>

      {/* Worker info card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Name</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">{worker?.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Email</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">{worker?.email}</p>
          </div>
        </div>
      </div>

      {/* Tax year summary */}
      {taxYear && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-8 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            Tax Year {taxYear.year} Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Gross Earnings</p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {formatCurrency(taxYear.ytd_gross)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Tips</p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {formatCurrency(taxYear.ytd_tips)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Net Paid</p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {formatCurrency(taxYear.ytd_net)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Est. Tax</p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {formatCurrency(taxYear.estimated_tax)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Est. NI</p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {formatCurrency(taxYear.estimated_ni)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Payslips</p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {taxYear.payslip_count}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Available documents */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Documents</h2>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                doc.available
                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText
                  size={24}
                  className={doc.available ? 'text-purple-600' : 'text-gray-400'}
                />
                <div>
                  <p className="font-semibold text-slate-900">{doc.name}</p>
                  <p className="text-sm text-slate-600">{doc.description}</p>
                </div>
              </div>
              {doc.available ? (
                <button
                  onClick={() => handleDownload(doc.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
                >
                  <Download size={18} />
                  Download
                </button>
              ) : (
                <span className="text-sm text-gray-600">Not available</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-yellow-900">Tax Document Information</p>
          <p className="text-sm text-yellow-800 mt-1">
            These documents are for your personal records and tax purposes. If you need to make
            any corrections or have questions about your tax information, please contact us.
          </p>
        </div>
      </div>
    </div>
  );
}
