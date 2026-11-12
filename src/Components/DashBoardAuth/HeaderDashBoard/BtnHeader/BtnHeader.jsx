import React from "react";

export default function BtnHeader({ imgBtn, onClick, label = "دانلود گزارش" }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 bg-[#DBECFF] border border-[#E8EEF5] px-5 py-3 rounded-3xl hover:bg-[#F7FAFF] duration-300 cursor-pointer">
      <img src={imgBtn} className="text-lg" alt="" />
      <span className="text-[#007BFF]">{label}</span>
    </button>
  );
}
