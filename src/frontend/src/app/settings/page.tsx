export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text">ตั้งค่าบัญชี (Core Accounting)</h1>
      <p className="text-text-muted">
        สำหรับตั้งค่าระดับนักบัญชี เช่น ผังบัญชี (Chart of Accounts), การกระทบยอด (Reconciliation) และปิดงวดบัญชี (Period Closing)
      </p>

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
