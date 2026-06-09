/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, FileImage } from "lucide-react";
import { toast } from "sonner";

type DocType = "profile-photo" | "licence-front" | "licence-back";

const DOC_LABELS: Record<DocType, string> = {
  "profile-photo": "Profile Photo",
  "licence-front": "Driving Licence (Front)",
  "licence-back": "Driving Licence (Back)",
};

interface DriverDocumentsProps {
  driverId: string;
}

export function DriverDocuments({ driverId }: DriverDocumentsProps) {
  const [docs, setDocs] = useState<Record<DocType, string | null>>({
    "profile-photo": null,
    "licence-front": null,
    "licence-back": null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocType | null>(null);
  const inputRefs = {
    "profile-photo": useRef<HTMLInputElement>(null),
    "licence-front": useRef<HTMLInputElement>(null),
    "licence-back": useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  async function loadDocs() {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/documents`);
      const data = await response.json();
      if (data.success) setDocs(data.documents);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(docType: DocType, file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const response = await fetch(`/api/admin/drivers/${driverId}/documents`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setDocs((prev) => ({ ...prev, [docType]: data.signedUrl }));
        toast.success(`${DOC_LABELS[docType]} uploaded`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setUploading(null);
      const input = inputRefs[docType].current;
      if (input) input.value = "";
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-slate-900">Documents</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(DOC_LABELS) as DocType[]).map((docType) => (
          <div key={docType} className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{DOC_LABELS[docType]}</p>
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {docs[docType] ? (
                <img
                  src={docs[docType]!}
                  alt={DOC_LABELS[docType]}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FileImage className="h-8 w-8 text-slate-300" />
                </div>
              )}
            </div>
            <input
              ref={inputRefs[docType]}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(docType, file);
              }}
              className="hidden"
            />
            <button
              onClick={() => inputRefs[docType].current?.click()}
              disabled={uploading === docType}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading === docType ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {docs[docType] ? "Replace" : "Upload"}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
