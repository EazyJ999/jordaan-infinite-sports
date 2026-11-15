export function CategoryArt({
  images,
  label,
  large = false,
}: {
  images: string[];
  label: string;
  large?: boolean;
}) {
  if (images.length > 1) {
    return (
      <div className={`grid h-full w-full grid-cols-3 grid-rows-2 ${large ? "gap-2 p-2" : "gap-px p-0.5"}`}>
        {images.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`h-full min-h-0 w-full ${src.includes("/leagues/") ? "object-contain" : "object-cover"}`}
          />
        ))}
      </div>
    );
  }
  const logo = images[0]?.includes("/leagues/");
  if (logo) {
    return (
      <img
        src={images[0]}
        alt={label}
        className={`h-full w-full bg-white object-contain ${large ? "p-4" : "p-0.5"}`}
      />
    );
  }
  return <img src={images[0]} alt={label} className="h-full w-full object-cover" />;
}
