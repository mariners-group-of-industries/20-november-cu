"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import {
  Gift,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  Share2,
  ExternalLink,
  Phone,
  User,
  GraduationCap,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  BookOpen,
  ArrowUpRight,
  MessageCircle,
  ChevronDown,
} from "lucide-react";

// 15-Day Date Range (Strictly DD/MM/YYYY, Excluding Fridays as Office is Closed)
const ALLOWED_DATES = [
  { full: "2026-11-21", dmy: "21/11/2026", day: "Sat", date: "21", month: "Nov", year: "2026", verbose: "21 November 2026", label: "21/11/2026 (Sat)" },
  { full: "2026-11-22", dmy: "22/11/2026", day: "Sun", date: "22", month: "Nov", year: "2026", verbose: "22 November 2026", label: "22/11/2026 (Sun)" },
  { full: "2026-11-23", dmy: "23/11/2026", day: "Mon", date: "23", month: "Nov", year: "2026", verbose: "23 November 2026", label: "23/11/2026 (Mon)" },
  { full: "2026-11-24", dmy: "24/11/2026", day: "Tue", date: "24", month: "Nov", year: "2026", verbose: "24 November 2026", label: "24/11/2026 (Tue)" },
  { full: "2026-11-25", dmy: "25/11/2026", day: "Wed", date: "25", month: "Nov", year: "2026", verbose: "25 November 2026", label: "25/11/2026 (Wed)" },
  { full: "2026-11-26", dmy: "26/11/2026", day: "Thu", date: "26", month: "Nov", year: "2026", verbose: "26 November 2026", label: "26/11/2026 (Thu)" },
  // Friday 27 Nov excluded (Office Closed)
  { full: "2026-11-28", dmy: "28/11/2026", day: "Sat", date: "28", month: "Nov", year: "2026", verbose: "28 November 2026", label: "28/11/2026 (Sat)" },
  { full: "2026-11-29", dmy: "29/11/2026", day: "Sun", date: "29", month: "Nov", year: "2026", verbose: "29 November 2026", label: "29/11/2026 (Sun)" },
  { full: "2026-11-30", dmy: "30/11/2026", day: "Mon", date: "30", month: "Nov", year: "2026", verbose: "30 November 2026", label: "30/11/2026 (Mon)" },
  { full: "2026-12-01", dmy: "01/12/2026", day: "Tue", date: "01", month: "Dec", year: "2026", verbose: "01 December 2026", label: "01/12/2026 (Tue)" },
  { full: "2026-12-02", dmy: "02/12/2026", day: "Wed", date: "02", month: "Dec", year: "2026", verbose: "02 December 2026", label: "02/12/2026 (Wed)" },
  { full: "2026-12-03", dmy: "03/12/2026", day: "Thu", date: "03", month: "Dec", year: "2026", verbose: "03 December 2026", label: "03/12/2026 (Thu)" },
  // Friday 04 Dec excluded (Office Closed)
  { full: "2026-12-05", dmy: "05/12/2026", day: "Sat", date: "05", month: "Dec", year: "2026", verbose: "05 December 2026", label: "05/12/2026 (Sat)" },
  { full: "2026-12-06", dmy: "06/12/2026", day: "Sun", date: "06", month: "Dec", year: "2026", verbose: "06 December 2026", label: "06/12/2026 (Sun - Last Day)" },
];

// Helper: Format YYYY-MM-DD to DD/MM/YYYY (Day / Month / Year)
function formatDMY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }
  return dateStr;
}

// Helper: Format YYYY-MM-DD to "DD Month YYYY" (e.g. 26 November 2026)
function formatVerbalDMY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const day = parts[2];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const monthName = monthNames[monthIndex] || parts[1];
    const year = parts[0];
    return `${day} ${monthName} ${year}`;
  }
  return dateStr;
}

// 2-Hour Time Slots between 9:30 AM and 6:00 PM
const PRESET_TIME_SLOTS = [
  "09:30 AM – 11:30 AM",
  "11:30 AM – 01:30 PM",
  "01:30 PM – 03:30 PM",
  "02:00 PM – 04:00 PM",
  "04:00 PM – 06:00 PM",
  "Custom Time (Flexible: 9:30 AM – 6:00 PM)",
];

export default function CUGiftPage() {
  // Form State
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [shortAddress, setShortAddress] = useState("");
  const [visitDate, setVisitDate] = useState("2026-11-22");
  const [timeSlot, setTimeSlot] = useState("09:30 AM – 11:30 AM");
  const [customTime, setCustomTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Confirmed Voucher State
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    referenceNo: string;
    fullName: string;
    mobileNumber: string;
    department?: string;
    batch?: string;
    shortAddress?: string;
    visitDate: string;
    visitTimeSlot: string;
    status: string;
    createdAt: string;
  } | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Scan, Commit & Claim Your Gift — CU Alumni Society Uttara & Biniyog Club";
  }, []);

  // Generate QR code and trigger confetti upon confirmed booking
  useEffect(() => {
    if (!confirmedBooking) return;

    const qrPayload = JSON.stringify({
      ref: confirmedBooking.referenceNo,
      name: confirmedBooking.fullName,
      phone: confirmedBooking.mobileNumber,
      date: formatDMY(confirmedBooking.visitDate),
      verbalDate: formatVerbalDMY(confirmedBooking.visitDate),
      time: confirmedBooking.visitTimeSlot,
      event: "CU Day 2026 Gift",
      giftPickup: "Event Venue (Friends Club Field, Sector 3, Uttara, Dhaka)",
      committedVisit: "10th Floor, MG SAM Center, 12 Bir Uttam AK Khandakar Rd, Dhaka 1212",
      map: "https://maps.app.goo.gl/83ZSDuxA7xWiMV7b9",
    });

    QRCode.toDataURL(qrPayload, {
      width: 280,
      margin: 1,
      color: {
        dark: "#0b3d2e",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#0284c7", "#008c5d", "#10b981", "#38bdf8", "#ffffff"],
      });
    } catch {}
  }, [confirmedBooking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg("Please enter your full legal name.");
      return;
    }

    const cleanMobile = mobileNumber.trim().replace(/[\s-]/g, "");
    if (!cleanMobile || cleanMobile.length < 11) {
      setErrorMsg("Please enter a valid 11-digit mobile number (e.g. 01712345678).");
      return;
    }

    const isAllowedDate = ALLOWED_DATES.some((d) => d.full === visitDate);
    if (!visitDate || !isAllowedDate) {
      setErrorMsg("Visit date must be between 21/11/2026 and 06/12/2026 (excluding Fridays — Head Office is closed on Fridays).");
      return;
    }

    const effectiveTime =
      timeSlot.startsWith("Custom Time")
        ? customTime.trim() || "Flexible (Between 9:30 AM – 6:00 PM)"
        : timeSlot;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobileNumber: cleanMobile,
          department: department.trim() || undefined,
          batch: batch.trim() || undefined,
          shortAddress: shortAddress.trim() || undefined,
          visitDate,
          visitTimeSlot: effectiveTime,
          customTime: timeSlot.startsWith("Custom Time") ? customTime.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm gift booking.");
      }

      setConfirmedBooking(data.booking);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (confirmedBooking?.referenceNo) {
      navigator.clipboard.writeText(confirmedBooking.referenceNo);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Download High-Resolution Voucher Pass as PNG
  const handleDownloadPass = async () => {
    if (!confirmedBooking) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 1000;
      const height = 1380;
      canvas.width = width;
      canvas.height = height;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#082f49");
      grad.addColorStop(0.5, "#0c4a6e");
      grad.addColorStop(1, "#082f49");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Card Inner White Panel
      ctx.fillStyle = "#ffffff";
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(40, 40, 920, 1300, 24);
      } else {
        ctx.rect(40, 40, 920, 1300);
      }
      ctx.fill();

      // Top Banner Header
      ctx.fillStyle = "#0c4a6e";
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(40, 40, 920, 170, [24, 24, 0, 0]);
        ctx.fill();
      } else {
        ctx.fillRect(40, 40, 920, 170);
      }

      // Header Texts
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CHITTAGONG UNIVERSITY DAY 2026", 500, 98);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "600 18px sans-serif";
      ctx.fillText("CU ALUMNI SOCIETY UTTARA, DHAKA • FRIENDS CLUB FIELD", 500, 136);

      ctx.fillStyle = "#fde047";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("OFFICIAL SPONSOR: BINIYOG CLUB & MARINERS GROUP", 500, 172);

      // Voucher Title Ribbon
      ctx.fillStyle = "#f0f9ff";
      ctx.strokeStyle = "#bae6fd";
      ctx.lineWidth = 1.5;
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(80, 235, 840, 72, 12);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(80, 235, 840, 72);
      }

      ctx.fillStyle = "#0369a1";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("VIP DIGITAL GIFT VOUCHER & INVITATION PASS", 110, 278);

      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "right";
      ctx.fillText(confirmedBooking.referenceNo, 890, 278);

      // Guest Name
      ctx.textAlign = "left";
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("HONORED GUEST / ALUMNI MEMBER", 80, 345);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(confirmedBooking.fullName, 80, 388);

      // Contact & Department
      ctx.fillStyle = "#334155";
      ctx.font = "16px sans-serif";
      const infoParts = [
        confirmedBooking.department,
        confirmedBooking.batch ? `Batch ${confirmedBooking.batch}` : "",
        confirmedBooking.shortAddress,
      ]
        .filter(Boolean)
        .join("  •  ");

      ctx.fillText(infoParts || "Chittagong University Alumni Member", 80, 422);

      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`Mobile: ${confirmedBooking.mobileNumber}`, 80, 452);

      // Divider
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 480);
      ctx.lineTo(920, 480);
      ctx.stroke();

      // Confirmed Date & Time Box (Date first, then month, then year)
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#cbd5e1";
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(80, 510, 840, 120, 16);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(80, 510, 840, 120);
      }

      ctx.fillStyle = "#0369a1";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("CONFIRMED VISIT DATE (DD/MM/YYYY)", 110, 545);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px monospace";
      const dmyText = `${formatDMY(confirmedBooking.visitDate)}  (${formatVerbalDMY(confirmedBooking.visitDate)})`;
      ctx.fillText(dmyText, 110, 588);

      ctx.fillStyle = "#0369a1";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("PREFERRED TIME SLOT", 650, 545);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(confirmedBooking.visitTimeSlot, 650, 588);

      // Venue & Location Box
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e2e8f0";
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(80, 660, 840, 160, 16);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(80, 660, 840, 160);
      }

      ctx.fillStyle = "#059669";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("GIFT COLLECTION POINT: AT THE EVENT (FRIENDS CLUB FIELD, UTTARA)", 110, 698);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("Committed Visit Location: 10th Floor, MG SAM Center, Mohakhali, Dhaka", 110, 735);

      ctx.fillStyle = "#64748b";
      ctx.font = "14px sans-serif";
      ctx.fillText("12 Bir Uttam AK Khandakar Rd, Dhaka 1212 • Maps: maps.app.goo.gl/83ZSDuxA7xWiMV7b9", 110, 768);

      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("Helpdesk Hotline: +880 1335-149006  •  Brochure: brochure.marinersgroupbd.com", 110, 798);

      // QR Code
      if (qrDataUrl) {
        const qrImg = new window.Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.onerror = resolve;
        });
        ctx.drawImage(qrImg, 380, 860, 240, 240);

        ctx.fillStyle = "#64748b";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("PRESENT THIS QR CODE AT RECEPTION", 500, 1125);
      }

      // Validity & Terms (Strict DD/MM/YYYY)
      ctx.textAlign = "center";
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("VALID FOR 15 DAYS ONLY: 21/11/2026 – 06/12/2026 (21 NOV – 06 DEC 2026)", 500, 1165);

      ctx.fillStyle = "#64748b";
      ctx.font = "13px sans-serif";
      ctx.fillText(
        "Present this pass at the Biniyog Club & Mariners Group desk right here at the event to collect your gift instantly!",
        500,
        1195
      );

      // Sponsor Footer Line
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 1225);
      ctx.lineTo(920, 1225);
      ctx.stroke();

      ctx.fillStyle = "#0369a1";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(
        "Sponsored by Biniyog Club  •  Mariners Group  •  MOHS Group  •  Marinozz Group",
        500,
        1255
      );

      // Download Trigger
      const link = document.createElement("a");
      link.download = `GIFT-PASS-${confirmedBooking.referenceNo}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Pass generation error:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-600 selection:text-white font-sans">
      {/* 1. TOP ANNOUNCEMENT BAR (Matching Main Site Style) */}
      <div className="bg-[#0c1e33] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white tracking-wide">
              OFFICIAL ALUMNI ANNOUNCEMENT
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-slate-300">
              Chittagong University Day 2026 • CU Alumni Society Uttara, Dhaka
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="tel:+8801335149006"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span>+880 1335-149006</span>
            </a>
            <a
              href="https://wa.me/8801335149006"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Help</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. STICKY NAVBAR (Matching Main Site) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-3">
          {/* Left Brand: Biniyog Club */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-2 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="/images/biniyog-club-logo.png"
                alt="Biniyog Club"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold text-[#0a523d] group-hover:text-emerald-700 tracking-tight leading-tight">
                BINIYOG CLUB
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Exclusive Gift Desk
              </div>
            </div>
          </Link>

          {/* Center Coordinates Pill (DD/MM/YYYY) */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <a
              href="https://maps.app.goo.gl/83ZSDuxA7xWiMV7b9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-800 hover:text-sky-700 font-semibold transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>10th Floor, MG SAM Center, Mohakhali</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
            <span className="text-slate-300">•</span>
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-semibold text-slate-900 font-mono">21/11/2026 – 06/12/2026</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">15-Day Date Lock</span>
          </div>

          {/* Right Action: Corporate Brochure Button */}
          <div className="flex items-center gap-2">
            <a
              href="https://brochure.marinersgroupbd.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 sm:py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Corporate Brochure</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT: HERO & CENTERED FORM */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* SUCCESS STATE: VIP DIGITAL GIFT PASS */}
        {confirmedBooking ? (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Success Top Badge */}
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                VISIT BOOKING CONFIRMED
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Your Digital VIP Gift Pass
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                Present this pass at the Biniyog Club &amp; Mariners Group desk right here at the event to collect your gift instantly!
              </p>
            </div>

            {/* The Pass Card */}
            <div
              ref={voucherRef}
              className="bg-white rounded-3xl border-2 border-sky-600/30 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6"
            >
              {/* Decorative Accent Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-sky-600 via-emerald-500 to-sky-700" />

              {/* Top Row: Details & Reference ID */}
              <div className="flex items-start justify-between gap-4 pt-1">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                    CU Alumni Executive Gift Voucher
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                    {confirmedBooking.fullName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {[
                      confirmedBooking.department,
                      confirmedBooking.batch ? `Batch ${confirmedBooking.batch}` : "",
                      confirmedBooking.shortAddress,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "Chittagong University Alumni Member"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    Pass Ref ID
                  </span>
                  <span className="text-base sm:text-lg font-mono font-extrabold text-sky-700 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200 inline-block mt-0.5">
                    {confirmedBooking.referenceNo}
                  </span>
                </div>
              </div>

              {/* Confirmed Date & Time Box (Explicitly DD/MM/YYYY) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 border border-sky-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    Confirmed Visit Date (DD/MM/YYYY)
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
                    {formatDMY(confirmedBooking.visitDate)}
                    <span className="text-xs sm:text-sm font-semibold text-slate-600 ml-2 font-sans">
                      ({formatVerbalDMY(confirmedBooking.visitDate)})
                    </span>
                  </div>
                </div>

                <div className="space-y-1 sm:text-right border-t sm:border-t-0 sm:border-l border-sky-200 pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5 sm:justify-end">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    Selected Time Slot
                  </span>
                  <div className="text-sm sm:text-base font-bold text-sky-950">
                    {confirmedBooking.visitTimeSlot}
                  </div>
                </div>
              </div>

              {/* Venue Details & QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="sm:col-span-2 space-y-3 text-xs text-slate-600">
                  {/* 1. Gift Collection: At the Event */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded inline-block">
                        Gift Collection Point (At The Event)
                      </span>
                      <strong className="text-slate-900 block text-sm font-bold">
                        Friends Club Field, Sector 3, Uttara, Dhaka
                      </strong>
                      <p className="text-[11px] text-emerald-900 font-medium">
                        Collect your gift directly at the event stall upon presenting this pass!
                      </p>
                    </div>
                  </div>

                  {/* 2. Committed Head Office Visit */}
                  <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 mt-0.5 text-sky-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded inline-block">
                        Committed Head Office Visit
                      </span>
                      <strong className="text-slate-900 block text-sm font-bold">
                        10th Floor, MG SAM Center
                      </strong>
                      <span className="text-slate-700 font-medium block">
                        12 Bir Uttam AK Khandakar Rd, Mohakhali C/A, Dhaka 1212
                      </span>
                      <div className="pt-1">
                        <a
                          href="https://maps.app.goo.gl/83ZSDuxA7xWiMV7b9"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-800 font-bold hover:underline"
                        >
                          <MapPin className="w-3 h-3 text-red-500" />
                          <span>Google Maps Directions ↗</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 space-y-1 border-t border-slate-100">
                    <div>
                      • <strong>Strict Validity:</strong> Next 15 days (Valid until 06/12/2026).
                    </div>
                    <div>
                      • Simply show this digital pass on your smartphone at the event gift desk.
                    </div>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Check-in QR Code"
                      className="w-24 h-24 object-contain rounded"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 animate-pulse rounded" />
                  )}
                  <span className="text-[10px] text-slate-500 mt-1 font-mono font-semibold">
                    Scan at Reception
                  </span>
                </div>
              </div>

              {/* Sponsor Credit */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>
                  Sponsored by <strong>Biniyog Club &amp; Mariners Group</strong>
                </span>
                <a
                  href="https://brochure.marinersgroupbd.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-700 font-bold inline-flex items-center gap-1"
                >
                  <span>Corporate Brochure</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Pass Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleDownloadPass}
                disabled={isDownloading}
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? "Generating Image..." : "Save Pass as Image (PNG)"}</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Ref ID</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `I booked my visit to Biniyog Club / Mariners Group Head Office! Pass ID: ${confirmedBooking.referenceNo}. Visit Date: ${formatDMY(confirmedBooking.visitDate)} (${formatVerbalDMY(confirmedBooking.visitDate)})`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Share WhatsApp</span>
              </a>
            </div>

            {/* Reset / Book Another */}
            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setConfirmedBooking(null);
                  setFullName("");
                  setMobileNumber("");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Book another visit for a family member or fellow alumni
              </button>
            </div>
          </div>
        ) : (
          /* DEFAULT FORM VIEW: SIMPLE, CLEAN, 100% ENGLISH */
          <div className="space-y-8">
            {/* Centered Hero Header */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-extrabold uppercase tracking-wider">
                <span>Scan, Commit and Win your Gift</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Head Office Visit &amp; Gift Pass
              </h1>
            </div>

            {/* Centered Form Card (Matching Registration Box Style) */}
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Official Gift Reservation Form</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Select Your Visit Date &amp; Claim Pass
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Please fill in your details to immediately generate your digital VIP gift voucher.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Full Legal Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Mohammad Tanvir Rahman"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* 2. Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="01712345678"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400 font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Your gift pass confirmation and reminder will be verified with this number.
                  </span>
                </div>

                {/* 3. Department & Batch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      CU Department / Subject <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Economics / CSE / BBA"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Batch / Passing Year <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="e.g. 34th Batch / 2012"
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* 4. Short Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Short Address / Area <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={shortAddress}
                    onChange={(e) => setShortAddress(e.target.value)}
                    placeholder="e.g. Sector 3, Uttara, Dhaka"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* 5. Head Office Visit Date (Strict 15-Day Lock, Guaranteed DD/MM/YYYY Format) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Head Office Visit Date (Day / Month / Year) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 uppercase">
                      21/11/2026 to 06/12/2026 (Excl. Fridays)
                    </span>
                  </div>

                  {/* Quick Date Selector Pills (Excluding Fridays, Showing Day, Month, Year clearly) */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 mb-3">
                    {ALLOWED_DATES.map((d) => {
                      const isSelected = visitDate === d.full;
                      return (
                        <button
                          key={d.full}
                          type="button"
                          onClick={() => setVisitDate(d.full)}
                          className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isSelected
                              ? "bg-sky-600 text-white border-sky-600 shadow-sm ring-1 ring-sky-600"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold opacity-80">{d.day}</span>
                          <span className="text-xs sm:text-sm font-extrabold">{d.date} {d.month}</span>
                          <span className={`text-[9px] font-mono mt-0.5 ${isSelected ? "text-sky-100" : "text-slate-400"}`}>
                            {d.dmy}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Preferred Time Slot ("somoi icca moto select kora jabe") */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Preferred Time Slot <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 uppercase">
                      Office Hours: 9:30 AM – 6:00 PM (2-Hour Slots)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {PRESET_TIME_SLOTS.map((slot) => {
                      const isSelected = timeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTimeSlot(slot)}
                          className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-sky-50 border-sky-600 text-sky-950 ring-1 ring-sky-600 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span>{slot}</span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                              isSelected ? "bg-sky-600 text-white" : "border border-slate-300"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Time Field if Selected */}
                  {timeSlot.startsWith("Custom Time") && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Specify Your Preferred Time:
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          placeholder="e.g. 10:15 AM, 2:30 PM, or anytime between 9:30 AM – 6:00 PM"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-200 focus:bg-white focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm sm:text-base shadow-md shadow-sky-600/25 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? "Generating Your Pass..."
                      : "Confirm Visit & Get Digital Gift Pass →"}
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. Gift Collection & Head Office Location Card */}
        <section className="mt-8 max-w-2xl mx-auto space-y-3">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                <Gift className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                  Gift Collection Point (At The Event)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Friends Club Field, Sector 3, Uttara, Dhaka
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                  Chittagong University Day 2026 • Collect your exclusive corporate gift directly at the event stall!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block mb-1">
                  Committed Head Office Visit Destination
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  10th Floor, MG SAM Center
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  12 Bir Uttam AK Khandakar Rd, Mohakhali C/A, Dhaka 1212 (Near Wireless Gate)
                </p>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/83ZSDuxA7xWiMV7b9"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-105"
            >
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>Google Maps Directions</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </section>

        {/* 5. PROMINENT CORPORATE BROCHURE BUTTON CARD (Matching User Request) */}
        <section className="mt-6 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-sky-400 font-bold block">
                  Corporate Profile &amp; Project Facilities
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Mariners Group Corporate Brochure
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                  Discover our modern industrial bakery lines, tunnel ovens, dredge-filled factory
                  parks, and ethical Halal business ecosystem.
                </p>
              </div>

              <a
                href="https://brochure.marinersgroupbd.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-6 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-sm shadow-md inline-flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Corporate Brochure</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* 5. STRATEGIC CONCERNS TREE (Matching Main Site Hierarchy) */}
        <section className="mt-14 pt-10 border-t border-slate-200/80 max-w-4xl mx-auto">
          {/* Parent Node: Biniyog Club */}
          <div className="flex flex-col items-center">
            <a
              href="https://biniyogclub.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Biniyog Club Website"
              className="inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-3 rounded-2xl bg-white border border-stone-200/90 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <Image
                src="/images/biniyog-club-logo.png"
                alt="Biniyog Club"
                width={36}
                height={36}
                className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#0a523d] group-hover:text-emerald-700 transition-colors">
                Biniyog Club
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </a>

            {/* Tree Drop Line */}
            <div className="hidden lg:block w-[1.5px] h-6 bg-[#D4CFCA]"></div>
            <div className="lg:hidden text-center mt-3 mb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Strategic Group Concerns
            </div>
          </div>

          {/* 6 Child Concerns Connected Tree */}
          <div className="relative mt-2">
            <div className="hidden lg:block absolute top-0 left-[8.333%] right-[8.333%] h-[1.5px] bg-[#D4CFCA] pointer-events-none"></div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:pt-5 pt-0">
              {/* 1. Mariners Group */}
              <div className="relative group h-full flex flex-col">
                <div className="hidden lg:block absolute -top-5 left-1/2 -translate-x-1/2 w-[1.5px] h-5 bg-[#D4CFCA] pointer-events-none"></div>
                <a
                  href="https://marinersgroup.com.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-stone-200/90 p-3 flex items-center justify-center h-[80px] w-full shadow-xs hover:border-sky-500 hover:shadow-md transition-all group/card"
                >
                  <Image
                    src="/images/concerns/mariners-group.png"
                    alt="Mariners Group"
                    width={140}
                    height={70}
                    className="max-h-[44px] max-w-[85%] w-auto object-contain mx-auto group-hover/card:scale-105 transition-all"
                  />
                </a>
              </div>

              {/* 2. MOHS Group */}
              <div className="relative group h-full flex flex-col">
                <div className="hidden lg:block absolute -top-5 left-1/2 -translate-x-1/2 w-[1.5px] h-5 bg-[#D4CFCA] pointer-events-none"></div>
                <a
                  href="https://mohsrealestate.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-stone-200/90 p-3 flex items-center justify-center h-[80px] w-full shadow-xs hover:border-sky-500 hover:shadow-md transition-all group/card"
                >
                  <Image
                    src="/images/concerns/mohs-group.png"
                    alt="MOHS Group"
                    width={140}
                    height={70}
                    className="max-h-[36px] max-w-[85%] w-auto object-contain mx-auto group-hover/card:scale-105 transition-all"
                  />
                </a>
              </div>

              {/* 3. Marinozz Group */}
              <div className="relative group h-full flex flex-col">
                <div className="hidden lg:block absolute -top-5 left-1/2 -translate-x-1/2 w-[1.5px] h-5 bg-[#D4CFCA] pointer-events-none"></div>
                <a
                  href="https://marinozz.restaurant"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-stone-200/90 p-3 flex items-center justify-center h-[80px] w-full shadow-xs hover:border-sky-500 hover:shadow-md transition-all group/card"
                >
                  <Image
                    src="/images/concerns/marinozz-group.png"
                    alt="Marinozz Group"
                    width={140}
                    height={70}
                    className="max-h-[34px] max-w-[85%] w-auto object-contain mx-auto group-hover/card:scale-105 transition-all"
                  />
                </a>
              </div>

              {/* 4. Community Ventures */}
              <div className="relative group h-full flex flex-col">
                <div className="hidden lg:block absolute -top-5 left-1/2 -translate-x-1/2 w-[1.5px] h-5 bg-[#D4CFCA] pointer-events-none"></div>
                <a
                  href="https://marinersgroup.com.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-stone-200/90 p-3 flex items-center justify-center h-[80px] w-full shadow-xs hover:border-sky-500 hover:shadow-md transition-all group/card"
                >
                  <Image
                    src="/images/concerns/community-ventures.png"
                    alt="Community Ventures"
                    width={140}
                    height={70}
                    className="max-h-[32px] max-w-[85%] w-auto object-contain mx-auto group-hover/card:scale-105 transition-all"
                  />
                </a>
              </div>

              {/* 5. Venture Alliance */}
              <div className="relative group h-full flex flex-col">
                <div className="hidden lg:block absolute -top-5 left-1/2 -translate-x-1/2 w-[1.5px] h-5 bg-[#D4CFCA] pointer-events-none"></div>
                <a
                  href="https://marinersgroup.com.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-stone-200/90 p-3 flex items-center justify-center h-[80px] w-full shadow-xs hover:border-sky-500 hover:shadow-md transition-all group/card"
                >
                  <Image
                    src="/images/concerns/venture-alliance.png"
                    alt="Venture Alliance"
                    width={140}
                    height={70}
                    className="max-h-[32px] max-w-[85%] w-auto object-contain mx-auto group-hover/card:scale-105 transition-all"
                  />
                </a>
              </div>

              {/* 6. Venture System */}
              <div className="relative group h-full flex flex-col">
                <div className="hidden lg:block absolute -top-5 left-1/2 -translate-x-1/2 w-[1.5px] h-5 bg-[#D4CFCA] pointer-events-none"></div>
                <a
                  href="https://marinersgroup.com.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-stone-200/90 p-3 flex items-center justify-center h-[80px] w-full shadow-xs hover:border-sky-500 hover:shadow-md transition-all group/card"
                >
                  <Image
                    src="/images/concerns/venture-system.png"
                    alt="Venture System"
                    width={140}
                    height={70}
                    className="max-h-[32px] max-w-[85%] w-auto object-contain mx-auto group-hover/card:scale-105 transition-all"
                  />
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6 font-medium">
            Food, logistics, and all related arrangements proudly sponsored by{" "}
            <strong>Biniyog Club</strong>, <strong>Mariners Group</strong>,{" "}
            <strong>MOHS Group</strong>, and <strong>Marinozz Group</strong>.
          </p>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-bold text-slate-800">
            Chittagong University Day 2026 • CU Alumni Society Uttara, Dhaka
          </p>
          <p className="text-emerald-700 font-semibold">
            Gift Collection Point: At the Event Venue (Friends Club Field, Sector 3, Uttara, Dhaka)
          </p>
          <p>
            Committed Head Office Visit: 10th Floor, MG SAM Center, 12 Bir Uttam AK Khandakar Rd, Dhaka 1212 • Hotline: +880 1335-149006 •{" "}
            <a
              href="https://maps.app.goo.gl/83ZSDuxA7xWiMV7b9"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-700 hover:underline font-semibold"
            >
              Google Maps Location ↗
            </a>
          </p>
          <p className="pt-2 text-slate-400">
            © 2026 Biniyog Club &amp; Mariners Group. All rights reserved. •{" "}
            <a
              href="https://brochure.marinersgroupbd.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-medium"
            >
              Corporate Brochure
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
