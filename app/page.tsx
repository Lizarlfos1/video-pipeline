"use client";

import { useState, useRef, useCallback } from "react";
import type { ShortResult } from "@/lib/types";

type Step = "idle" | "transcribing" | "transcribed" | "aligning" | "aligned" | "done" | "error";

interface ProcessResult {
  shorts: ShortResult[];
  metadata: {
    scriptSections: number;
    totalTakes: number;
    selectedTakes: number;
    silenceRemoved: number;
    hallucinatedWords: number;
  };
  transcript: {
    fullText: string;
    duration: number;
    wordCount: number;
  };
}

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [script, setScript] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canProcess = videoFile && script.trim() && step === "idle";

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("video/") || /\.(mp4|mov|mkv|avi|webm)$/i.test(file.name))) {
      setVideoFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  }, []);

  const process = async () => {
    if (!videoFile || !script.trim()) return;

    setStep("transcribing");
    setStatusMessage("Uploading video...");
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("script", script);

    try {
      const res = await fetch("/api/process", { method: "POST", body: formData });
      if (!res.ok || !res.body) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ") && currentEvent) {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === "status") {
              setStep(data.step as Step);
              setStatusMessage(data.message);
            } else if (currentEvent === "result") {
              setResult(data);
            } else if (currentEvent === "error") {
              setStep("error");
              setError(data.message);
            }
            currentEvent = "";
          }
        }
      }
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const reset = () => {
    setVideoFile(null);
    setScript("");
    setStep("idle");
    setStatusMessage("");
    setResult(null);
    setError("");
  };

  const updateShortTitle = (id: number, title: string) => {
    if (!result) return;
    setResult({
      ...result,
      shorts: result.shorts.map((s) => (s.id === id ? { ...s, title } : s)),
    });
  };

  const updateShortText = (id: number, transcriptText: string) => {
    if (!result) return;
    setResult({
      ...result,
      shorts: result.shorts.map((s) =>
        s.id === id ? { ...s, transcriptText } : s
      ),
    });
  };

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Video Pipeline</h1>

      {/* Upload + Script Section */}
      {step === "idle" && !result && (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-500/10"
                : videoFile
                  ? "border-green-600 bg-green-600/5"
                  : "border-neutral-700 hover:border-neutral-500"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {videoFile ? (
              <div>
                <p className="text-green-400 font-medium">{videoFile.name}</p>
                <p className="text-sm text-neutral-500 mt-1">
                  {(videoFile.size / (1024 * 1024)).toFixed(0)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-neutral-400">Drop your video file here</p>
                <p className="text-sm text-neutral-600 mt-1">
                  or click to browse
                </p>
              </div>
            )}
          </div>

          {/* Script Textarea */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">
              Script (separate shorts with blank lines)
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder={`First short's script goes here. You can write multiple sentences for this section.\n\nSecond short starts after a blank line.\n\nThird short, and so on...`}
              rows={12}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-sm font-mono resize-y focus:outline-none focus:border-neutral-600 placeholder:text-neutral-700"
            />
          </div>

          {/* Process Button */}
          <button
            onClick={process}
            disabled={!canProcess}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              canProcess
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
            }`}
          >
            Process Video
          </button>
        </div>
      )}

      {/* Progress Section */}
      {step !== "idle" && step !== "error" && !result && (
        <div className="space-y-4">
          <ProgressStep
            label="Transcribing audio"
            active={step === "transcribing"}
            done={["transcribed", "aligning", "aligned", "done"].includes(step)}
          />
          <ProgressStep
            label="Aligning script to transcript"
            active={step === "aligning"}
            done={["aligned", "done"].includes(step)}
          />
          <ProgressStep
            label="Done"
            active={false}
            done={step === "done"}
          />
          {statusMessage && (
            <p className="text-sm text-neutral-500 mt-4">{statusMessage}</p>
          )}
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="space-y-4">
          <div className="bg-red-950/50 border border-red-900 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button
            onClick={reset}
            className="text-sm text-neutral-400 hover:text-white underline"
          >
            Start over
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">
                {result.shorts.length} shorts from {result.metadata.scriptSections} script sections
                {" · "}{result.transcript.duration.toFixed(0)}s video
                {" · "}{result.transcript.wordCount} words transcribed
              </p>
              {result.metadata.hallucinatedWords > 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  {result.metadata.hallucinatedWords} hallucinated words removed
                </p>
              )}
            </div>
            <button
              onClick={reset}
              className="text-sm text-neutral-400 hover:text-white underline"
            >
              Start over
            </button>
          </div>

          {/* Short Cards */}
          {result.shorts.map((short) => (
            <ShortCard
              key={short.id}
              short={short}
              onTitleChange={(t) => updateShortTitle(short.id, t)}
              onTextChange={(t) => updateShortText(short.id, t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-2 rounded-full ${
          done ? "bg-green-500" : active ? "bg-blue-500 animate-pulse" : "bg-neutral-700"
        }`}
      />
      <span
        className={`text-sm ${
          done ? "text-green-400" : active ? "text-white" : "text-neutral-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ShortCard({
  short,
  onTitleChange,
  onTextChange,
}: {
  short: ShortResult;
  onTitleChange: (title: string) => void;
  onTextChange: (text: string) => void;
}) {
  const duration = short.segmentsToKeep.reduce(
    (sum, seg) => sum + (seg.end - seg.start),
    0
  );

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
        <span className="text-xs font-mono text-neutral-600">#{short.id}</span>
        <input
          type="text"
          value={short.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="flex-1 bg-transparent font-medium text-sm focus:outline-none"
        />
        <span className="text-xs text-neutral-500 font-mono">
          {formatTime(short.sourceStart)}–{formatTime(short.sourceEnd)}
          {" · "}
          {Math.round(duration)}s
        </span>
      </div>

      {/* Script reference */}
      <div className="px-4 py-2 border-b border-neutral-800/50">
        <p className="text-xs text-neutral-600 leading-relaxed">
          <span className="text-neutral-500">Script: </span>
          {short.scriptText}
        </p>
      </div>

      {/* Editable transcript */}
      <div className="px-4 py-3">
        <textarea
          value={short.transcriptText}
          onChange={(e) => onTextChange(e.target.value)}
          rows={3}
          className="w-full bg-transparent text-sm leading-relaxed resize-y focus:outline-none"
        />
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-t border-neutral-800/50">
        <p className="text-xs text-neutral-600">
          {short.words.length} words · {short.segmentsToKeep.length} segments
        </p>
      </div>
    </div>
  );
}
