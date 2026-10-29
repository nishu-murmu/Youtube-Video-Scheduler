import { useEffect, useState } from "react";
import { Check, Loader2, Minus, Plus, TriangleAlert } from "lucide-react";

export function ShortsLimitSettings({ onClose }: { onClose?: () => void }) {
  const DEFAULT_LIMIT = 10;
  const DEFAULT_WARNING = `Take a break and invest your time in something meaningful! Try reading, learning a new skill, or connecting with friends. Remember, your time is valuable—make the most of it!`;

  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [warningText, setWarningText] = useState<string>(DEFAULT_WARNING);
  const [savedMessage, setSavedMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    browser.storage.local
      .get(["shortsLimit", "shortsWarningText"])
      .then(({ shortsLimit, shortsWarningText }) => {
        if (!isMounted) return;
        if (typeof shortsLimit === "number" && shortsLimit > 0) {
          setLimit(shortsLimit);
        }
        if (typeof shortsWarningText === "string" && shortsWarningText.trim()) {
          setWarningText(shortsWarningText);
        }
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave() {
    setSavedMessage("Saving...");
    const sanitizedLimit =
      Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_LIMIT;
    const sanitizedWarning =
      typeof warningText === "string" && warningText.trim()
        ? warningText.trim()
        : DEFAULT_WARNING;
    await sleep(500);
    browser.storage.local
      .set({ shortsLimit: sanitizedLimit, shortsWarningText: sanitizedWarning })
      .then(async () => {
        setLimit(sanitizedLimit);
        setSavedMessage("Saved");
        await sleep(2000);
        setSavedMessage("");
        if (onClose) onClose();
      })
      .catch(async () => {
        setSavedMessage("Failed to save");
        await sleep(2000);
        setSavedMessage("");
      });
  }

  const isSaving = savedMessage === "Saving...";
  const changeLimit = (delta: number) =>
    setLimit((value) => Math.max(1, (Math.floor(value) || 0) + delta));

  return (
    <div className="ui-px flex min-h-full flex-col bg-white text-zinc-900">
      <header className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
        <img src="/icon/icon-48.png" alt="" className="h-8 w-8 rounded-lg" />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold">YouTube Video Scheduler</h1>
          <p className="text-xs text-zinc-500">Shorts limit settings</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-5 py-5">
        <section>
          <label
            htmlFor="shorts-limit"
            className="block text-sm font-medium text-zinc-900"
          >
            Shorts per session
          </label>
          <p className="mt-0.5 text-xs text-zinc-500">
            You'll see a reminder after this many Shorts. Default is{" "}
            {DEFAULT_LIMIT}.
          </p>
          <div className="mt-3 flex h-10 items-stretch overflow-hidden rounded-lg ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-zinc-900/20">
            <button
              type="button"
              aria-label="Decrease limit"
              onClick={() => changeLimit(-1)}
              disabled={loading || limit <= 1}
              className="flex w-10 cursor-pointer items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              id="shorts-limit"
              type="number"
              min={1}
              step={1}
              value={loading ? "" : limit}
              onChange={(e) => setLimit(Number(e.target.value) || 0)}
              className="min-w-0 flex-1 border-x border-zinc-200 text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              disabled={loading}
            />
            <button
              type="button"
              aria-label="Increase limit"
              onClick={() => changeLimit(1)}
              disabled={loading}
              className="flex w-10 cursor-pointer items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="flex flex-1 flex-col">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="shorts-warning"
              className="block text-sm font-medium text-zinc-900"
            >
              Reminder message
            </label>
            <span className="text-[11px] text-zinc-400 tabular-nums">
              {loading ? 0 : warningText.length} chars
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Shown when you reach the limit.
          </p>
          <textarea
            id="shorts-warning"
            value={loading ? "" : warningText}
            onChange={(e) => setWarningText(e.target.value)}
            className="mt-3 min-h-[120px] w-full flex-1 resize-none rounded-lg px-3 py-2.5 text-sm leading-relaxed text-zinc-800 ring-1 ring-zinc-200 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900/20"
            placeholder="Enter a reminder message"
            disabled={loading}
          />
        </section>
      </main>

      <footer className="flex items-center gap-3 border-t border-zinc-100 bg-zinc-50/80 px-5 py-4">
        <p
          aria-live="polite"
          className={`flex flex-1 items-center gap-1.5 text-xs font-medium ${
            savedMessage === "Failed to save"
              ? "text-red-600"
              : "text-emerald-600"
          }`}
        >
          {savedMessage === "Saved" && <Check className="h-3.5 w-3.5" />}
          {savedMessage === "Failed to save" && (
            <TriangleAlert className="h-3.5 w-3.5" />
          )}
          {!isSaving && savedMessage}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="h-9 cursor-pointer rounded-lg px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200/60"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || isSaving}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving" : "Save"}
        </button>
      </footer>
    </div>
  );
}

export default ShortsLimitSettings;
