import { useEffect } from "react";
import { X } from "lucide-react";
import { NeoMorphicDateTimePicker } from "../DatePicker";

export type CommonDateEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  title?: string;
};

export const DateEditModal = ({
  isOpen,
  onClose,
  selectedDate,
  onChange,
  title = "Edit Date/Time",
}: CommonDateEditModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="ui-px fixed inset-0 z-[9999999] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 fade-in-0 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <NeoMorphicDateTimePicker
            selectedDate={selectedDate as Date}
            onChange={onChange}
          />
        </div>

        <div className="flex justify-end border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
          <button
            onClick={onClose}
            className="h-9 cursor-pointer rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateEditModal;
