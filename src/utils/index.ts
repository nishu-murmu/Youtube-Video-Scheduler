import ReactDOM from "react-dom/client";

export async function createShadowRootUiWrapper({
  ctx,
  name,
  position,
  anchor,
  component,
}: {
  ctx: any;
  name: string;
  position: "inline" | "overlay" | "modal";
  anchor: string;
  component: React.ReactNode;
}) {
  return createShadowRootUi(ctx, {
    name,
    position,
    anchor,
    onMount: (container) => {
      const app = document.createElement("div");
      container.append(app);
      const root = ReactDOM.createRoot(app);
      root.render(component);
      return root;
    },
    onRemove: (root) => root?.unmount(),
  });
}

export function sendRuntimeMessage<T = unknown>({
  action,
  data,
}: {
  action: string;
  data: unknown;
}) {
  return new Promise((resolve) =>
    browser.runtime.sendMessage({ action, data }, resolve)
  );
}

export async function createSchedule({ name, time, url, id }: Schedule) {
  await browser.alarms.create(name, { when: new Date(time).getTime() });
  let { schedules }: { schedules: Schedule[] } =
    await browser.storage.local.get("schedules");
  await browser.storage.local.set({
    schedules: [
      ...(schedules ?? []),
      { name, time: JSON.stringify(time), url, id },
    ],
  });
  return true;
}

export async function clearSchedule({ name }: { name?: string }) {
  if (name) await browser.alarms.clear(name);
  const { schedules }: { schedules: Schedule[] } =
    await browser.storage.local.get("schedules");
  await browser.storage.local.set({
    schedules: schedules.filter((s: Schedule) => s.name !== name),
  });

  browser.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.url?.includes("youtube.com")) {
        browser.tabs.sendMessage(tab.id!, {
          action: "REMOVE_SCHEDULE",
          data: { name },
        });
      }
    });
  });
}

export function openNewTab({ url, name }: { url: string; name: string }) {
  browser.tabs.create({ url, active: true });
  clearSchedule({ name });
}

export function timeToSeconds(timeStr: string, playback: number): string {
  const parts = timeStr.split(":").map(Number);
  let totalSeconds = [0, 0, 0];
  parts
    .slice(0, 3)
    .reverse()
    .forEach((val, i) => (totalSeconds[i] = val));
  const seconds =
    totalSeconds[0] + totalSeconds[1] * 60 + totalSeconds[2] * 3600;
  return secondsToTime(seconds / playback);
}

function secondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${pad(minutes)}:${pad(secs)}`;
}

const pad = (n: number): string => String(n).padStart(2, "0");

export function getSessionStorageItem(key: string) {
  const value = sessionStorage.getItem(key);
  try {
    return value !== null ? JSON.parse(value) : undefined;
  } catch {
    return value;
  }
}

export function toggleDashboard() {
  browser.storage.local.get("dashboardVisible").then(({ dashboardVisible }) =>
    browser.storage.local
      .set({ dashboardVisible: !dashboardVisible })
      .then(() =>
        browser.tabs
          .query({ active: true, currentWindow: true })
          .then(([activeTab]) => {
            if (activeTab) {
              browser.tabs.sendMessage(activeTab.id!, {
                action: "TOGGLE_DASHBOARD",
              });
            }
          })
      )
  );
}

export function getDifferenceInMinutes(now: number, schedule: number) {
  return Math.floor((now - schedule) / 60000);
}

export const removeScheduleVideo = (ids: string[]) =>
  new Promise((resolve) =>
    browser.storage.local.get("schedules").then(({ schedules }) =>
      browser.storage.local.set(
        {
          schedules: schedules.filter(
            (schedule: Schedule) => !ids.includes(schedule.id)
          ),
        },
        () => resolve(true)
      )
    )
  );

function isValidURL(str: string) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

export function getYoutubeVideoId(url: string) {
  return isValidURL(url) ? new URL(url).searchParams.get("v") || "" : "";
}

const injectHoverIcon = (
  selector: string,
  creator: () => HTMLElement,
  handler: (element: Element, videoId: string, videoTitle: string) => void
) => {
  document.querySelectorAll(selector).forEach((element) => {
    if ((element as Element).getAttribute("element-injected") === "true")
      return;

    const hoverContainer = creator();
    element.prepend(hoverContainer);
    (element as Element).setAttribute("element-injected", "true");

    const videoId = getYoutubeVideoId(
      (element.querySelector("a[href*='/watch']") as HTMLAnchorElement)
        ?.href || ""
    );
    const videoTitle =
      (element.querySelector("h3") as HTMLElement)?.innerText || "";

    (
      hoverContainer.querySelector("#hover-icon") as HTMLElement
    )?.addEventListener("click", () =>
      handler(element as Element, videoId, videoTitle)
    );
  });
};

export const addHoverIcons = () =>
  injectHoverIcon(
    "ytd-rich-item-renderer",
    createHoverIcon,
    (el, id, title) => {
      self.postMessage(
        { type: "ADD_VIDEO", data: { videoId: id, videoTitle: title } },
        "*"
      );
    }
  );

export const addSingleVideoHoverIcons = () =>
  injectHoverIcon(
    "ytd-compact-video-renderer",
    createSingleVideoHoverIcon,
    (el, id, title) => {
      self.postMessage(
        { type: "ADD_VIDEO", data: { videoId: id, videoTitle: title } },
        "*"
      );
    }
  );

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Built with DOM APIs because YouTube enforces Trusted Types, which blocks innerHTML
const createPlusIcon = () => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const bg = document.createElement("div");
  bg.className = "neomorphic-icon-bg";

  const svg = document.createElementNS(SVG_NS, "svg");
  const attrs: Record<string, string> = {
    id: "hover-icon",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };
  Object.entries(attrs).forEach(([key, value]) => svg.setAttribute(key, value));

  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  svg.appendChild(circle);

  ["M8 12h8", "M12 8v8"].forEach((d) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  });

  bg.appendChild(svg);
  return bg;
};

export const createHoverIcon = () => {
  const div = document.createElement("div");
  div.className = "hover-icon-container neomorphic-icon";
  div.appendChild(createPlusIcon());
  return div;
};

export const createSingleVideoHoverIcon = () => {
  const div = document.createElement("div");
  div.className = "hover-icon-container-single neomorphic-icon";
  div.appendChild(createPlusIcon());
  return div;
};

export const getList = (element: HTMLElement) => {
  if (Array.from(element.childNodes).length >= 4) {
    return Array.from(element.childNodes);
  }
  return getList(element.querySelector("div")!);
};
