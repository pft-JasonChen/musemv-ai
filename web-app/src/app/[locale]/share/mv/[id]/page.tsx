import { MvExplore } from "@/components/community/MvExplore";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MvExplore initialPlayId={id} />;
}
