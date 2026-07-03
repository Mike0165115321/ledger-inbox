export default function ReviewPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">ตรวจสอบ</h1>
        <p className="text-zinc-500 mt-1">
          รายการที่ AI ไม่มั่นใจ — รอคุณยืนยันหรือแก้ไข
        </p>
      </div>

      <div className="text-center py-20 bg-white rounded-xl border border-zinc-200 mt-6">
        <p className="text-4xl mb-4">🔍</p>
        <h3 className="text-lg font-semibold text-zinc-700">
          ฟีเจอร์นี้จะมาใน Week 3
        </h3>
        <p className="text-zinc-400 mt-1 max-w-md mx-auto">
          เมื่อ AI เริ่มอ่านสลิปใน Week 2 รายการที่ AI ไม่มั่นใจจะมาปรากฏที่นี่
          ให้คุณตรวจสอบและยืนยันก่อนบันทึกลงบัญชี
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs text-zinc-400 bg-zinc-100 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Coming in Week 3 — Classification + Review
        </div>
      </div>
    </div>
  );
}
