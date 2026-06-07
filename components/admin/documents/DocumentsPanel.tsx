"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, FileType, Download, Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
  signedUrl: string | null;
}

interface DocumentsPanelProps {
  bookingId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return ImageIcon;
  if (fileType === "application/pdf") return FileType;
  return FileText;
}

export function DocumentsPanel({ bookingId }: DocumentsPanelProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/documents`);
      const data = await res.json() as { success: boolean; documents?: Document[]; error?: string };

      if (data.success && data.documents) {
        setDocuments(data.documents);
      } else {
        toast.error(data.error || "Failed to load documents");
      }
    } catch (err) {
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;

    // Add to uploading map
    setUploadingFiles(prev => new Map(prev).set(fileId, 0));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/admin/bookings/${bookingId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as { success: boolean; document?: Document; error?: string };

      if (data.success && data.document) {
        toast.success(`${file.name} uploaded successfully`);
        setDocuments(prev => [data.document!, ...prev]);
      } else {
        toast.error(data.error || `Failed to upload ${file.name}`);
      }
    } catch (err) {
      toast.error(`Failed to upload ${file.name}`);
    } finally {
      // Remove from uploading map
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    Array.from(files).forEach((file) => {
      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return;
      }

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`);
        return;
      }

      // Upload
      uploadFile(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/documents/${docId}`, {
        method: "DELETE",
      });

      const data = await res.json() as { success: boolean; error?: string };

      if (data.success) {
        toast.success("Document deleted");
        setDocuments(prev => prev.filter(d => d.id !== docId));
        setDeletingDocId(null);
      } else {
        toast.error(data.error || "Failed to delete document");
      }
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Documents & Files</h3>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-6 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-brand-purple-400 bg-brand-purple-50"
            : "border-slate-300 bg-slate-50 hover:border-brand-purple-300 hover:bg-slate-100"
        }`}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
        <p className="text-sm font-medium text-slate-700 mb-1">
          Drag files here or click to browse
        </p>
        <p className="text-xs text-slate-500">
          PDF, Word, JPG, PNG — max 10MB per file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="mb-4 space-y-2">
          {Array.from(uploadingFiles.keys()).map((fileId) => (
            <div key={fileId} className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-900">Uploading...</span>
            </div>
          ))}
        </div>
      )}

      {/* Documents List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.fileType);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100 transition-colors"
              >
                <Icon className="w-5 h-5 text-slate-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.signedUrl ? (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="p-2 text-slate-300 cursor-not-allowed"
                      title="URL unavailable"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeletingDocId(doc.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDocId}
        title="Delete Document"
        description="Are you sure you want to delete this document? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => deletingDocId && deleteDocument(deletingDocId)}
        onCancel={() => setDeletingDocId(null)}
      />
    </div>
  );
}
