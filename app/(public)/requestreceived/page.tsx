"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Phone, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RequestReceivedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple-50 via-white to-brand-green-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-xl text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </motion.div>

        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="Ample Removals"
            width={80}
            height={80}
            className="rounded-lg"
          />
        </div>

        {/* Heading */}
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          Request Received!
        </h1>

        <p className="text-lg text-slate-600 mb-8">
          Thank you for your interest in Ample Removals. We&apos;ve received your quote request and our team will review it shortly.
        </p>

        {/* What Happens Next */}
        <div className="bg-brand-purple-50 border border-brand-purple-100 rounded-xl p-6 mb-8 text-left">
          <p className="font-semibold text-brand-purple-900 mb-3">What happens next?</p>
          <ol className="space-y-2 text-sm text-brand-purple-800">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-purple-200 text-brand-purple-900 font-bold text-xs mt-0.5">1</span>
              <span>Our team will review your request within the next few hours</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-purple-200 text-brand-purple-900 font-bold text-xs mt-0.5">2</span>
              <span>We&apos;ll contact you via email or phone to discuss your requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-purple-200 text-brand-purple-900 font-bold text-xs mt-0.5">3</span>
              <span>You&apos;ll receive a detailed quote tailored to your needs</span>
            </li>
          </ol>
        </div>

        {/* Contact Options */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <p className="font-semibold text-slate-900 mb-4">Need immediate assistance?</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="tel:07344683477"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-green-600 hover:bg-brand-green-500 text-white rounded-lg font-medium transition-colors"
            >
              <Phone className="h-4 w-4" />
              07344683477
            </a>
            <a
              href="mailto:hello@ampleremovals.com"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-purple-600 hover:bg-brand-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Mail className="h-4 w-4" />
              hello@ampleremovals.com
            </a>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="flex-1 border-2 border-brand-purple-200 hover:border-brand-purple-300 hover:bg-brand-purple-50"
          >
            Back to Home
          </Button>
          <Button
            onClick={() => router.push("/booking/removals")}
            className="flex-1 bg-brand-purple-800 hover:bg-brand-purple-900 text-white"
          >
            Get Another Quote
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-slate-400 mt-8">
          Average response time: 2-4 hours during business hours (Mon-Sat, 8am-6pm)
        </p>
      </motion.div>
    </div>
  );
}
