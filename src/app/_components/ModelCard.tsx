import Link from "next/link";
import { UserRoundIcon } from "lucide-react";

interface ModelCardProps {
  name: string;
  organization: string;
  modality: string;
}

export default function ModelCard({
  name,
  modality,
  organization,
}: ModelCardProps) {
  const getRandomGradient = () => {
    const gradients = [
      "from-indigo-500 via-sky-500 to-violet-500",
      "from-sky-500 via-emerald-500 to-teal-500",
      "from-violet-500 via-rose-500 to-amber-500",
      "from-rose-500 via-fuchsia-500 to-indigo-500",
    ];

    const seed = (organization + "/" + name)
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[seed % gradients.length];
  };

  return (
    <div className="flex h-40 items-center gap-10 bg-white p-5">
      <div className="h-28 w-40 shrink-0 overflow-hidden rounded-lg">
        <div
          className={`h-full w-full bg-gradient-to-br ${getRandomGradient()}`}
        />
      </div>

      {/* Second column - content structure */}
      <div className="inline-flex h-32 w-full flex-col items-start justify-start gap-4">
        {/* Top row with name, tokens, and category */}
        <div className="flex h-8 w-full items-center justify-between">
          <div className="text-lg font-medium leading-7 text-[#101828]">
            <Link
              href={`/models/${encodeURIComponent(organization + "/" + name)}`}
            >
              {name}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5">
              <div className="text-center text-sm font-semibold leading-tight text-[#667085]">
                1.62M tokens
              </div>
            </div>
            <div className="flex items-center justify-start gap-1.5 rounded-full border border-[#155dee] py-0.5 pl-2 pr-2.5">
              <div className="relative h-2 w-2">
                <div className="absolute left-px top-px h-1.5 w-1.5 rounded-full bg-[#155dee]" />
              </div>
              <div className="text-center text-sm font-medium leading-tight text-[#004eea]">
                {modality === "text-generation"
                  ? "Text Generation"
                  : "Text to Image"}
              </div>
            </div>
          </div>
        </div>

        {/* Description row */}
        <div className="self-stretch text-sm font-normal leading-tight text-[#667085]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. In efficitur
          sollicitudin orci in luctus.
        </div>

        {/* Bottom row with metadata */}
        <div className="flex h-5 w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <UserRoundIcon className="h-4 w-4" />
            <div className="text-sm leading-tight text-[#667085]">
              {organization.charAt(0).toUpperCase() + organization.slice(1)}
            </div>
          </div>
          <div className="h-5 w-px bg-[#e4e7ec]" />
          <div className="text-sm leading-tight text-[#667085]">
            $0.252 /M Input Tokens
          </div>
          <div className="h-5 w-px bg-[#e4e7ec]" />
          <div className="text-sm leading-tight text-[#667085]">
            $0.15 /M Output Tokens
          </div>
          <div className="h-5 w-px bg-[#e4e7ec]" />
          <div className="text-sm leading-tight text-[#667085]">
            $0.11 /K input imgs
          </div>
        </div>
      </div>
    </div>
  );
}