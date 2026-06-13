'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Preferences {
  email: boolean;
  sms: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>({ email: true, sms: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/worker/preferences');
        const data = await response.json();

        if (data.success) {
          setPreferences(data.preferences);
        }
      } catch (e) {
        console.error('Failed to fetch preferences:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/worker/preferences', {
        method: 'POST',
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href="/payslips"
        className="text-purple-600 hover:text-purple-700 font-medium mb-6 inline-block"
      >
        ← Back to payslips
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Notification Settings</h1>

      {message && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-slate-600 mb-6">
          Choose how you want to be notified when your payslip is ready
        </p>

        {/* Email notification */}
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900">Email Notifications</h3>
            <p className="text-sm text-slate-600 mt-1">
              Get notified when payslip is ready
            </p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email}
              onChange={(e) =>
                setPreferences({ ...preferences, email: e.target.checked })
              }
              className="w-5 h-5 rounded border-slate-300 text-purple-600"
            />
          </label>
        </div>

        {/* SMS notification */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h3 className="font-semibold text-slate-900">SMS Notifications</h3>
            <p className="text-sm text-slate-600 mt-1">
              Get text message alerts
            </p>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.sms}
              onChange={(e) =>
                setPreferences({ ...preferences, sms: e.target.checked })
              }
              className="w-5 h-5 rounded border-slate-300 text-purple-600"
            />
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}
