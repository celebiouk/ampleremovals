"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  invoiceNumber: string;
  invoiceType: string;
  amount: number;
}

export function DeleteInvoiceDialog({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
  invoiceType,
  amount,
}: DeleteInvoiceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Delete Invoice {invoiceNumber}?
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              {invoiceType} invoice for £{amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            This will delete:
          </p>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• The invoice record</li>
            <li>• The invoice PDF</li>
            <li>• All invoice history</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-sm font-bold text-red-900">
            ⚠️ This action CANNOT be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-2"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Yes, Delete Permanently
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
