import { SongCompose } from "@/components/song/SongCompose";

// No `AuthGuard` here on purpose (product decision 2026-08-12), matching
// `/mv/room`: a guest must be able to open the create screen and compose
// before deciding to sign in. The gate moved to the point that costs
// something — `SongCompose`'s "Create Song" button calls `requireLogin`
// itself before spending credits. See spec area 03 and area 09 §3.
export default function Page() {
  return <SongCompose />;
}
