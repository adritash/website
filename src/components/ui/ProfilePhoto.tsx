import Image from "next/image";
import { profile } from "@/lib/data/profile";
import { assets } from "@/lib/site";

type ProfilePhotoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizes = {
  sm: "w-28 sm:w-32",
  md: "w-44 sm:w-52",
  lg: "w-64 sm:w-72 lg:w-96",
};

export default function ProfilePhoto({
  size = "md",
  className = "",
  priority = false,
}: ProfilePhotoProps) {
  return (
    <div
      className={`relative aspect-[2/3] shrink-0 ${sizes[size]} ${className}`}
    >
      <Image
        src={assets.profilePhoto}
        alt={`${profile.name} — professional headshot`}
        fill
        priority={priority}
        sizes="(max-width: 640px) 256px, (max-width: 1024px) 288px, 384px"
        className="rounded-2xl object-contain shadow-lg ring-4 ring-border"
      />
    </div>
  );
}
