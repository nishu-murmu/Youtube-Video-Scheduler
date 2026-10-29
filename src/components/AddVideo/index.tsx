import { useEffect, useState } from "react";
import { NeoMorphicDateTimePicker } from "../DatePicker";
import { CalendarPlus, X } from "lucide-react";

export function AddVideo() {
  const [currentVideoData, setCurrentVideoData] = useState<VideoData>({
    videoId: "",
    videoTitle: "",
  });
  const [date12, setDate12] = useState<Date>(new Date());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e?.data?.type === "ADD_VIDEO") {
        setCurrentVideoData(e?.data?.data);
        setIsOpen(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!date12 || !currentVideoData?.videoId) return;
    sendRuntimeMessage({
      action: "SCHEDULE_VIDEO",
      data: {
        id: currentVideoData.videoId,
        name: currentVideoData.videoTitle,
        time: date12.toISOString(),
        url: `https://www.youtube.com/watch?v=${currentVideoData.videoId}`,
      },
    });
    setDate12(new Date());
    setIsOpen(false);
  };

  return (
    <>
      <button
        id="schedule-video"
        className="hidden"
        onClick={() => setIsOpen(true)}
      >
        Schedule Video
      </button>
      {isOpen && (
        <div
          className="ui-px fixed inset-0 z-[999999] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-video-title"
            className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 fade-in-0 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 px-6 pt-6 pb-5">
              {currentVideoData?.videoId && (
                <img
                  src={`https://i.ytimg.com/vi/${currentVideoData.videoId}/mqdefault.jpg`}
                  alt=""
                  className="h-[63px] w-28 shrink-0 rounded-lg bg-zinc-100 object-cover ring-1 ring-black/5"
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  id="schedule-video-title"
                  className="text-xs font-medium tracking-wide text-red-600 uppercase"
                >
                  Schedule video
                </p>
                <p
                  className="mt-1 line-clamp-2 text-[15px] leading-snug font-medium text-zinc-900"
                  title={currentVideoData?.videoTitle}
                >
                  {currentVideoData?.videoTitle || "Untitled video"}
                </p>
              </div>
              <button
                aria-label="Close"
                className="-mt-1 -mr-2 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <NeoMorphicDateTimePicker
                selectedDate={date12}
                onChange={(newDate: Date) => setDate12(newDate)}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
              <button
                className="h-9 cursor-pointer rounded-lg px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200/60"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
                onClick={handleSubmit}
              >
                <CalendarPlus className="h-4 w-4" />
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
