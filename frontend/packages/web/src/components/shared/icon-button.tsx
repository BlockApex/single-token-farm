import { QuestionMarkOutlinedIcon } from "@/assets/svg/question-mark-icon";

export function IconButton({ onClick }: { onClick: () => void }) {
  return (
    <button   onClick={onClick} className="w-[18px] h-[18px] hover:opacity-[.7]">
      <QuestionMarkOutlinedIcon />
    </button>
  );
}
