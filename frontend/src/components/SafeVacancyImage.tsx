import { useEffect, useState } from "react";

interface SafeVacancyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export const SafeVacancyImage = ({
  src,
  alt,
  className,
}: SafeVacancyImageProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`vacancy-image-placeholder ${className || ""}`}>
        <span>JA</span>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};
