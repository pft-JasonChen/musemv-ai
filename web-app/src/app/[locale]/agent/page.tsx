import { AgentView } from "@/components/agent/AgentView";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AgentPage() {
  return (
    <AuthGuard>
      <AgentView />
    </AuthGuard>
  );
}
