import { TeamManagement } from "@/components/TeamManagement";
export const metadata = {
  title: "Team Members | Envoy Vault",
  description: "Manage organization members and roles.",
};
export default function TeamPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Team Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage who has access to this workspace's secrets and configurations.
        </p>
      </div>
      <TeamManagement />
    </div>
  );
}