import { UserDocuments } from "@/components/user-documents";

export default function MyDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Documents</h1>
        <p className="text-muted-foreground">
          Manage your account documents and important files
        </p>
      </div>

      <UserDocuments />
    </div>
  );
}
