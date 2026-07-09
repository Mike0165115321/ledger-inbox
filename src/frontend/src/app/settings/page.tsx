"use client";

import { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  const [form, setForm] = useState({ name: "", tax_id: "", address: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getOwnerProfile()
      .then((p) => {
        setForm({
          name: p.name || "",
          tax_id: p.tax_id || "",
          address: p.address || "",
          email: p.email || "",
          phone: p.phone || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateOwnerProfile(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text">ตั้งค่าบัญชี (Core Accounting)</h1>
      <p className="text-text-muted">
        สำหรับตั้งค่าระดับนักบัญชี เช่น ผังบัญชี (Chart of Accounts), การกระทบยอด (Reconciliation) และปิดงวดบัญชี (Period Closing)
      </p>

      {/* Owner Identity */}
      <Card padding="lg">
        <h2 className="text-lg font-bold text-text mb-1 flex items-center gap-2">
          <UserCircle className="w-5 h-5" />
          ข้อมูลเจ้าของบัญชี (Owner Identity)
        </h2>
        <p className="text-sm text-text-subtle mb-4">
          ใช้สำหรับคำนวณภาษีและออกรายงานส่งนักบัญชี
        </p>

        {loading ? (
          <p className="text-sm text-text-subtle">กำลังโหลด...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="ชื่อ-นามสกุล"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
              <Input
                label="เลขผู้เสียภาษี"
                value={form.tax_id}
                onChange={(e) => updateField("tax_id", e.target.value)}
              />
              <Input
                label="อีเมล"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
              <Input
                label="เบอร์โทร"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <Input
              label="ที่อยู่"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} isLoading={saving}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              {saved && <span className="text-sm text-success">บันทึกแล้ว</span>}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-6 rounded-2xl bg-surface-alt border border-border">
          <h2 className="text-lg font-bold text-text mb-2">📑 ผังบัญชี (Chart of Accounts)</h2>
          <p className="text-sm text-text-subtle mb-4">
            จัดการหมวดหมู่รายรับรายจ่ายแบบเจาะลึก (สินทรัพย์ หนี้สิน ทุน รายได้ ค่าใช้จ่าย)
          </p>
          <div className="inline-flex px-3 py-1 rounded-full bg-surface text-text-muted text-xs font-medium border border-border">
            Coming Soon
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-alt border border-border">
          <h2 className="text-lg font-bold text-text mb-2">⚖️ กระทบยอด (Reconciliation)</h2>
          <p className="text-sm text-text-subtle mb-4">
            นำ Statement จากธนาคารมาเทียบกับรายการในระบบเพื่อหาข้อผิดพลาด
          </p>
          <div className="inline-flex px-3 py-1 rounded-full bg-surface text-text-muted text-xs font-medium border border-border">
            Coming Soon
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-alt border border-border">
          <h2 className="text-lg font-bold text-text mb-2">🔒 ปิดงวดบัญชี (Period Closing)</h2>
          <p className="text-sm text-text-subtle mb-4">
            ล็อกรอบบัญชีรายเดือน/รายปี เพื่อป้องกันการแก้ไขข้อมูลย้อนหลัง
          </p>
          <div className="inline-flex px-3 py-1 rounded-full bg-surface text-text-muted text-xs font-medium border border-border">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
