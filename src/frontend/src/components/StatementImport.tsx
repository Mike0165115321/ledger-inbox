"use client";

import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Landmark, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { api, Account, StatementImportResult } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface StatementImportProps {
  onImported?: () => void;
}

export default function StatementImport({ onImported }: StatementImportProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<StatementImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getAccounts(true)
      .then((a) => {
        setAccounts(a);
        if (a.length > 0) setAccountId(a[0].id);
      })
      .catch(() => {});
  }, []);

  const handleImport = async () => {
    if (!file || !accountId) return;
    setImporting(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.importStatement(file, accountId);
      setResult(res);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onImported?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4" />
        นำเข้า Bank Statement (CSV)
        <span className="font-normal text-text-subtle">
          — รายการจะรอตรวจใน Review Queue
        </span>
      </h2>

      {accounts.length === 0 ? (
        <p className="text-sm text-text-subtle flex items-center gap-2">
          <Landmark className="w-4 h-4 shrink-0" />
          ต้องมีบัญชีก่อนจึงนำเข้า statement ได้ —{" "}
          <Link href="/accounts" className="text-accent hover:underline">
            ไปสร้างบัญชีที่หน้า Accounts
          </Link>
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="flex-1 text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-alt file:px-3 file:py-2 file:text-sm file:text-text file:cursor-pointer cursor-pointer"
          />
          <Button onClick={handleImport} disabled={!file || !accountId} isLoading={importing}>
            นำเข้า
          </Button>
        </div>
      )}

      {result && (
        <div className="mt-3 text-sm text-text-muted flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <div>
            <p>{result.message}</p>
            {result.parse_errors.length > 0 && (
              <p className="text-xs text-warning mt-1">
                อ่านไม่ได้ {result.parse_errors.length} แถว: {result.parse_errors.slice(0, 3).join("; ")}
                {result.parse_errors.length > 3 && " …"}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-danger flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}
    </Card>
  );
}
