import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/services/subscription";
import { getMaterialDetailForUser } from "@/services/material";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgressToggleBtn } from "@/components/materi/ProgressToggleBtn";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sub = await getUserSubscription(session.userId);
  if (!sub.isActive && session.user.role !== "ADMIN") {
    redirect("/materi");
  }

  const { id } = await params;

  let material;
  try {
    material = await getMaterialDetailForUser(session.userId, id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/materi"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-blue transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Materi
        </Link>
      </div>

      {/* Video Container (16:9 responsive aspect ratio) */}
      <div className="bg-black rounded-lg overflow-hidden shadow-sm border border-slate-200">
        <div className="relative w-full aspect-video">
          {material.videoUrl ? (
            <video
              src={material.videoUrl}
              controls
              playsInline
              controlsList="nodownload"
              className="absolute top-0 left-0 w-full h-full object-contain bg-black"
            />
          ) : material.youtubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${material.youtubeId}?rel=0&modestbranding=1`}
              title={material.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full border-0"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">
              Video belum tersedia
            </div>
          )}
        </div>
      </div>

      {/* Content Meta & Progress Toggle */}
      <div className="bg-white p-6 sm:p-7 rounded-lg border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
              Materi #{material.order}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-navy leading-snug">
              {material.title}
            </h1>
          </div>

          <div className="flex-shrink-0">
            <ProgressToggleBtn materialId={material.id} initialCompleted={material.isCompleted} />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-brand-navy uppercase tracking-wider">
            Deskripsi Materi
          </h2>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
            {material.description}
          </p>
        </div>
      </div>
    </div>
  );
}
