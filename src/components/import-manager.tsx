"use client";

import { BentoCard } from "@/components/bento-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCHOOLS, SUBJECTS } from "@/lib/exam-config";
import type { BankMeta, SchoolId, SubjectId } from "@/types/exam";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface PdfFile {
  filename: string;
  size: number;
}

type PrepareStep = "extracting" | "enriching" | "generating" | "done";

export function ImportManager() {
  const [schoolId, setSchoolId] = useState<SchoolId>("conestoga");
  const [subjectId, setSubjectId] = useState<SubjectId>("english");
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [savedMeta, setSavedMeta] = useState<BankMeta | null>(null);
  const [savedQuestionCount, setSavedQuestionCount] = useState(0);
  const [extraQuestions, setExtraQuestions] = useState("10");
  const [showSettings, setShowSettings] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [prepareStep, setPrepareStep] = useState<PrepareStep | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPdfs = useCallback(async () => {
    const res = await fetch(`/api/import/pdfs?school=${schoolId}&subject=${subjectId}`);
    const data = await res.json();
    const list = data.pdfs ?? [];
    setPdfs(list);
    if (list.length > 0) {
      setSelectedPdf((prev) => prev ?? list[0].filename);
    } else {
      setSelectedPdf(null);
    }
  }, [schoolId, subjectId]);

  const loadBank = useCallback(async () => {
    const res = await fetch(`/api/import/bank?school=${schoolId}&subject=${subjectId}`);
    const data = await res.json();
    if (data.bank) {
      setSavedMeta(data.bank.meta ?? null);
      setSavedQuestionCount(data.bank.questions?.length ?? 0);
    } else {
      setSavedMeta(null);
      setSavedQuestionCount(0);
    }
  }, [schoolId, subjectId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await loadPdfs();
      if (cancelled) return;
      await loadBank();
      if (cancelled) return;
      setError(null);
      setSuccess(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadPdfs, loadBank]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("school", schoolId);
    formData.append("subject", subjectId);
    formData.append("file", file);

    try {
      const res = await fetch("/api/import/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadPdfs();
      setSelectedPdf(data.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handlePrepare(enrichOnly = false) {
    if (!enrichOnly && !selectedPdf) return;

    setPreparing(true);
    setError(null);
    setSuccess(null);
    setPrepareStep(enrichOnly ? "enriching" : "extracting");

    try {
      if (!enrichOnly) {
        await new Promise((r) => setTimeout(r, 400));
        setPrepareStep("enriching");
      }

      const res = await fetch("/api/import/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school: schoolId,
          subject: subjectId,
          filename: enrichOnly ? undefined : selectedPdf,
          generateCount: enrichOnly ? 0 : parseInt(extraQuestions, 10) || 10,
          enrichOnly,
        }),
      });

      if (!enrichOnly) setPrepareStep("generating");

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPrepareStep("done");
      setSuccess(
        enrichOnly
          ? `Updated ${data.poolSize ?? data.totalQuestions} questions with topics & explanations`
          : `Ready — ${data.examQuestionCount} exam questions (real exam size) · ${data.poolSize} in pool (${data.extracted} from PDF + ${data.added} AI-generated)`
      );
      await loadBank();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPreparing(false);
      setPrepareStep(null);
    }
  }

  const stepLabel =
    prepareStep === "extracting"
      ? "Reading PDF…"
      : prepareStep === "enriching"
        ? "Verifying answers & adding explanations…"
        : prepareStep === "generating"
          ? "Generating practice questions…"
          : null;

  const isReady = savedQuestionCount > 0 && savedMeta?.lastEnrichedAt;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Set up questions</h1>
        <p className="text-muted-foreground text-sm">
          Upload a sample PDF. One click prepares everything for students.
        </p>
      </div>

      {isReady && (
        <BentoCard className="flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-medium">{savedQuestionCount} questions ready</p>
              <p className="text-xs text-muted-foreground capitalize">{subjectId}</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/">Practice</Link>
          </Button>
        </BentoCard>
      )}

      <BentoCard className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">School</Label>
            <Select value={schoolId} onValueChange={(v) => setSchoolId(v as SchoolId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHOOLS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Select value={subjectId} onValueChange={(v) => setSubjectId(v as SubjectId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 flex-1"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {pdfs.length > 0 ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sample PDF</Label>
            <Select value={selectedPdf ?? ""} onValueChange={setSelectedPdf}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a PDF" />
              </SelectTrigger>
              <SelectContent>
                {pdfs.map((pdf) => (
                  <SelectItem key={pdf.filename} value={pdf.filename}>
                    <span className="flex items-center gap-2">
                      <FileText className="size-3.5" />
                      {pdf.filename}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            No PDF yet — upload a sample exam above
          </p>
        )}

        <Button
          onClick={() => handlePrepare(false)}
          disabled={!selectedPdf || preparing}
          className="w-full gap-2"
          size="lg"
        >
          {preparing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {preparing ? "Preparing…" : "Prepare question bank"}
        </Button>

        {stepLabel && (
          <p className="text-xs text-center text-muted-foreground">{stepLabel}</p>
        )}

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Options
          <ChevronDown className={`size-3 transition-transform ${showSettings ? "rotate-180" : ""}`} />
        </button>

        {showSettings && (
          <div className="space-y-3 pt-1 border-t">
            <div className="space-y-1.5">
              <Label htmlFor="extra" className="text-xs">
                Extra practice questions to generate
              </Label>
              <Input
                id="extra"
                type="number"
                min={0}
                max={30}
                value={extraQuestions}
                onChange={(e) => setExtraQuestions(e.target.value)}
              />
            </div>
            {savedQuestionCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={preparing}
                onClick={() => handlePrepare(true)}
              >
                Re-enrich existing bank only
              </Button>
            )}
          </div>
        )}
      </BentoCard>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {savedMeta?.topicsCovered && savedMeta.topicsCovered.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {savedMeta.topicsCovered.map((t) => (
            <Badge key={t} variant="outline" className="text-xs font-normal">
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
