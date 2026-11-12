import { useNavigate } from "react-router-dom";

export default function NeedsAttention({ rows = [] }) {
  const navigate = useNavigate();

  return (
    <section dir="rtl" className="bg-white rounded-3xl p-5 md:p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-primary text-[#6B6F77]">نیازمند توجه</h2>
        <button
          type="button"
          onClick={() => navigate("/coach/athletes")}
          className="text-sm font-medium text-[#007BFF] hover:text-blue-600 transition-colors cursor-pointer"
        >
          مشاهده همه شاگردان
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[#A0A4AA]">موردی برای پیگیری نیست.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="text-sm text-slate-400">
                <th className="pb-4 font-normal">شاگرد</th>
                <th className="pb-4 font-normal">وضعیت</th>
                <th className="pb-4 font-normal">دلیل</th>
                <th className="pb-4 font-normal">برنامه</th>
                <th className="pb-4 font-normal text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((student) => (
                <tr key={student.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF6FF] text-sm text-[#007BFF]">
                        {(student.name || "—").slice(0, 1)}
                      </div>
                      <p className="text-sm font-primary text-[#6B6F77]">{student.name}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="inline-block rounded-full bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-700">
                      {student.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-[#6B6F77]">{student.reason}</td>
                  <td className="py-4 text-sm text-[#6B6F77]">{student.program}</td>
                  <td className="py-4 text-center">
                    <button
                      type="button"
                      onClick={() => navigate(`/coach/athletes/${student.id}`)}
                      className="cursor-pointer rounded-full bg-blue-50 px-6 py-2 text-sm font-medium text-[#007BFF] transition-colors hover:bg-blue-100"
                    >
                      مشاهده
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
