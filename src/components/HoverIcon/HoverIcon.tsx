import "@/components/HoverIcon/hover.css";
import { useEffect } from "react";

export const HoverElement: React.FC = () => {
  useEffect(() => {
    let goneOutside = false;
    const observers: MutationObserver[] = [];

    const createObserver = (
      target: Node,
      options: MutationObserverInit,
      callback: MutationCallback
    ) => {
      const observer = new MutationObserver(callback);
      observer.observe(target, options);
      observers.push(observer);
      return observer;
    };

    const handleHoverIcons = (element: Element, opacity: string) => {
      const hoverIcon = element.querySelector(
        ".hover-icon-container"
      ) as HTMLElement | null;
      if (hoverIcon) hoverIcon.style.opacity = opacity;
    };

    // YouTube replaced the #media-container-link id with a class in its redesign
    const MEDIA_CONTAINER_SELECTOR =
      "#media-container-link, .ytdVideoPreviewMediaContainerLink";

    const handleVideoMutation = (list: MutationRecord[]) => {
      const youtubeVideos = document.querySelectorAll("ytd-rich-item-renderer");
      const targetHref = (list[0]?.target as HTMLAnchorElement)?.href;
      if (targetHref) {
        const targetId = getYoutubeVideoId(targetHref);
        youtubeVideos.forEach((element) => {
          const anchor = element.querySelector(
            "a[href*='/watch']"
          ) as HTMLAnchorElement | null;
          const isTarget =
            !!targetId && getYoutubeVideoId(anchor?.href || "") === targetId;
          goneOutside = isTarget;
          handleHoverIcons(element, isTarget ? "1" : "0");
        });
      }
    };

    setTimeout(() => {
      addHoverIcons();
      const mediaContainer = document.querySelector(MEDIA_CONTAINER_SELECTOR);
      if (mediaContainer) {
        createObserver(
          mediaContainer,
          { attributes: true },
          handleVideoMutation
        );
      }

      const videoPreview = document.querySelector("#video-preview");
      if (videoPreview) {
        createObserver(
          videoPreview,
          {
            attributes: true,
            childList: true,
            subtree: true,
          },
          () => {
            const mediaContainer = document.querySelector(
              MEDIA_CONTAINER_SELECTOR
            );
            if (mediaContainer) {
              createObserver(
                mediaContainer,
                { attributes: true },
                handleVideoMutation
              );
            }
          }
        );
      }
    }, 5000);

    setTimeout(() => {
      const contents = document.querySelector("#contents");
      if (contents) {
        createObserver(contents, { childList: true }, addHoverIcons);
        createObserver(
          contents,
          {
            childList: true,
            subtree: true,
            attributes: true,
          },
          addSingleVideoHoverIcons
        );
      }
    }, 5000);

    return () => {
      observers.forEach((observer) => observer.disconnect());
      document
        .querySelectorAll(".hover-icon-container")
        .forEach((container) => container.remove());
      document
        .querySelectorAll("ytd-rich-item-renderer")
        .forEach((thumbnail) => {
          thumbnail.removeAttribute("element-injected");
        });
    };
  }, []);

  return null;
};
