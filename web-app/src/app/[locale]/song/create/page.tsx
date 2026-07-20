import { SongCompose } from "@/components/song/SongCompose";
import { AuthGuard } from "@/components/auth/AuthGuard";
export default function Page() { return <AuthGuard><SongCompose /></AuthGuard>; }
