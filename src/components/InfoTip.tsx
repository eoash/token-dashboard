export default function InfoTip({ text, wide, below }: { text: string; wide?: boolean; below?: boolean }) {
  return (
    <div className="relative inline-flex ml-1.5">
      <svg className="w-3.5 h-3.5 text-gray-600 cursor-help peer outline-none" tabIndex={0} viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7V7h2v5zM8 6a1 1 0 110-2 1 1 0 010 2z"/>
      </svg>
      <div className={`invisible peer-hover:visible peer-focus:visible absolute left-1/2 -translate-x-1/2 ${below ? "top-full mt-2" : "bottom-full mb-2"} ${wide ? "w-64" : "w-56"} rounded-lg bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-gray-300 leading-relaxed shadow-xl z-50 font-normal`}>
        {text}
        <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent ${below ? "bottom-full border-b-[5px] border-b-[#333]" : "top-full border-t-[5px] border-t-[#333]"}`}/>
      </div>
    </div>
  );
}
