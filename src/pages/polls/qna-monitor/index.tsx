import { useNavigate, useParams } from "react-router-dom";
import { PermissionRequiredPanel } from "@/components/permissions";
import { Navbar } from "@/components/layout";
import { Spinner } from "@/components/ui";
import { useResourcePermission } from "@/hooks/permissions";
import { useGetPollDetail } from "@/hooks/polls";
import { PollQNAMonitorPanel } from "@/pages/polls/edit/components";

export default function PollQNAMonitorPage() {
  const { id: pollId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const permission = useResourcePermission({
    action: "polls.edit",
    enabled: !!pollId,
    reason: "Need to monitor poll Q&A",
    resourceId: pollId ?? "",
    resourceType: "poll",
  });
  const { data: poll, isLoading } = useGetPollDetail(
    pollId ?? "",
    permission.isAllowed,
  );

  if (permission.isChecking || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size={32} className="text-primary-500" />
      </div>
    );
  }

  if (permission.isRequired) {
    return (
      <PermissionRequiredPanel
        description="Your account needs approval before monitoring this poll."
        isRequesting={permission.isRequesting}
        onBack={() => navigate("/polls")}
        onRequest={permission.requestPermission}
        requestDisabled={permission.isPending || permission.isRequested}
      />
    );
  }

  if (!poll || !pollId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm font-semibold text-gray-400">
        Poll not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="min-h-0 flex-1">
        <PollQNAMonitorPanel poll={poll} pollId={pollId} />
      </main>
    </div>
  );
}
