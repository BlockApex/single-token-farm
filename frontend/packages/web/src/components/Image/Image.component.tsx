import { ImgHTMLAttributes, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  landscapeLoader?: boolean;
};

function Image(props: ImageProps) {
  const { landscapeLoader, src, alt, title, className } = props;
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const image = document.createElement("img");
    image.src = props.src as string;
    image.onload = () => setLoaded(true);
  }, [props.src]);

  function renderLandscape() {
    return (
      <svg
        className={"h-full w-full " + className}
        viewBox="0 0 136 136"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_3004_18017)">
          <rect
            width="136"
            height="136"
            rx="10"
            stroke="#20002F"
            strokeWidth="5"
            strokeOpacity="0.1"
            fill="white"
            fillOpacity="0.1"
          />
          <path
            d="M-2 93.5L37.3668 62.4697C39.1996 61.025 41.7881 61.0404 43.6037 62.5068L76.4633 89.0473C78.248 90.4888 80.7847 90.5308 82.6162 89.1492L104.807 72.4085C106.674 71.0004 109.267 71.0739 111.051 72.5857L137.5 95"
            stroke="#20002F"
            strokeOpacity="0.5"
            strokeWidth="5"
          />
          <circle
            cx="91.5"
            cy="36.5"
            r="12"
            stroke="#20002F"
            strokeOpacity="0.5"
            strokeWidth="5"
          />
        </g>
        <defs>
          <clipPath id="clip0_3004_18017">
            <rect width="136" height="136" rx="10" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  }

  function renderSkeleton() {
    return <Skeleton className={className} />;
  }

  function renderLoader() {
    return landscapeLoader ? renderLandscape() : renderSkeleton();
  }

  return loaded ? (
    <img src={src} alt={alt} title={title} className={className} />
  ) : (
    renderLoader()
  );
}

export default Image;
