import {
  HiWifi,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineTruck,
  HiOutlineShoppingBag,
  HiOutlineMoon,
  HiOutlineSparkles,
  HiOutlineLocationMarker,
  HiOutlineCheckCircle,
} from "react-icons/hi";

type DirectusIconValue =
  | string
  | {
      name?: string | null;
      icon?: string | null;
      value?: string | null;
    }
  | null
  | undefined;

type AmenityIconProps = {
  icon: DirectusIconValue;
  label: string;
};

function getIconName(icon: DirectusIconValue): string {
  if (typeof icon === "string") {
    const trimmed = icon.trim();
    return trimmed.length > 0 ? trimmed : "check_circle";
  }

  if (icon && typeof icon === "object") {
    const candidates = [icon.name, icon.icon, icon.value];

    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
  }

  return "check_circle";
}

function normalizeIconKey(iconName: string): string {
  return iconName.trim().toLowerCase().replace(/\s+/g, "_");
}

function getIconComponent(iconName: string) {
  const key = normalizeIconKey(iconName);

  if (key.includes("wifi") || key.includes("wlan")) {
    return HiWifi;
  }
  if (key.includes("parking") || key.includes("car")) {
    return HiOutlineShoppingBag;
  }
  if (key.includes("kitchen") || key.includes("food") || key.includes("cook")) {
    return HiOutlineHome;
  }
  if (
    key.includes("dishwasher") ||
    key.includes("washer") ||
    key.includes("clean")
  ) {
    return HiOutlineSparkles;
  }
  if (key.includes("bed") || key.includes("sleep")) {
    return HiOutlineMoon;
  }
  if (
    key.includes("road") ||
    key.includes("autobahn") ||
    key.includes("highway")
  ) {
    return HiOutlineTruck;
  }
  if (
    key.includes("train") ||
    key.includes("bahn") ||
    key.includes("station")
  ) {
    return HiOutlineLocationMarker;
  }
  if (
    key.includes("work") ||
    key.includes("industry") ||
    key.includes("office")
  ) {
    return HiOutlineOfficeBuilding;
  }

  return HiOutlineCheckCircle;
}

export default function AmenityIcon({ icon, label }: AmenityIconProps) {
  const iconName = getIconName(icon);
  const Icon = getIconComponent(iconName);

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center"
      title={label}
    >
      <Icon className="h-5 w-5 text-zinc-700" aria-hidden={true} />
    </span>
  );
}
