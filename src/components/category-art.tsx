export function CategoryArt({
  images,
  label,
}: {
  images: string[];
  label: string;
  large?: boolean;
}) {
  const src = images.find((item) => item.length > 0);
  if (!src) {
    return <span className="flex h-full w-full items-end bg-[#0e0e0e] p-2 text-xs text-[#c6de12]">{label}</span>;
  }
  return <img src={src} alt={label} className="h-full w-full bg-[#0e0e0e] object-contain" />;
}
