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
  md: "w-36 sm:w-44",
  lg: "w-48 sm:w-56 lg:w-64",
};

export default function ProfilePhoto({
  size = "md",
  className = "",
  priority = false,
}: ProfilePhotoProps) {
  return (
    <div
      className={`relative aspect-[3/4] shrink-0 ${sizes[size]} ${className}`}
    >
      <Image
        src={assets.profilePhoto}
        alt={`${profile.name} — professional headshot`}
        fill
        priority={priority}
        sizes="(max-width: 640px) 144px, (max-width: 1024px) 176px, 256px"
        className="rounded-2xl object-cover object-top shadow-lg ring-4 ring-border"
      />
    </div>
  );
}
