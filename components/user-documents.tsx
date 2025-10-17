"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

interface UserDocument {
  id: string;
  user_id: string;
  document_name: string;
  document_type: string;
  description?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  is_admin_uploaded: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
  uploader_profile?: {
    full_name: string;
    email: string;
  };
}

const DOCUMENT_TYPES = [
  { value: "account", label: "Account Documents" },
  { value: "purchase", label: "Purchase Documents" },
  { value: "kyc", label: "KYC Documents" },
  { value: "legal", label: "Legal Documents" },
  { value: "other", label: "Other Documents" },
];

const REQUIRED_DOCUMENTS = [
  {
    name: "Code of conduct",
    description: "Download, fill, and sign before uploading back.",
    url: "https://plbelakxpivwslyklmit.supabase.co/storage/v1/object/public/general_docs/Code%20of%20Conduct%20Cross%20Atlantic%20Properties%20Ltd.docx",
  },
  {
    name: "Irrevocable Power of Attorney",
    description: "Download, fill, and sign before uploading back",
    url: "https://plbelakxpivwslyklmit.supabase.co/storage/v1/object/public/general_docs/Cross%20Atlantic%20Properties%20Irrivocable%20Power%20of%20Attoney.docx",
  },
  {
    name: "Deed Of Assignment And Transfer of Property Rights",
    description: "Download, fill, and sign before uploading back",
    url: "https://plbelakxpivwslyklmit.supabase.co/storage/v1/object/public/general_docs/Deed_of_Assignment_and_Transfer_of_Property_Rights_CrossAtlantic.docx",
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

interface UserDocumentsProps {
  userId?: string; // If provided, show documents for this user (admin view)
  targetUserId?: string; // For admin view - specific user to manage
  isAdminView?: boolean;
  userName?: string; // Display name for the user being managed
}

export function UserDocuments({
  userId,
  targetUserId,
  isAdminView = false,
  userName,
}: UserDocumentsProps) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const effectiveUserId = targetUserId || userId || user?.id;

  const [uploadForm, setUploadForm] = useState({
    document_name: "",
    document_type: "account",
    description: "",
    tags: "",
    file: null as File | null,
  });

  const fetchDocuments = async () => {
    if (!effectiveUserId) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from("user_documents")
        .select(
          `
          *,
          uploader_profile:profiles!user_documents_uploaded_by_fkey(
            full_name,
            email
          )
        `
        )
        .eq("user_id", effectiveUserId)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, Word, text, or image files only",
        variant: "destructive",
      });
      return;
    }

    setUploadForm({ ...uploadForm, file });
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.document_name || !effectiveUserId)
      return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileName = `${effectiveUserId}/${Date.now()}_${
        uploadForm.file.name
      }`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Create database record
      const tags = uploadForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { error: dbError } = await supabase.from("user_documents").insert({
        user_id: effectiveUserId,
        document_name: uploadForm.document_name,
        document_type: uploadForm.document_type,
        description: uploadForm.description || null,
        file_path: uploadData.path,
        file_size: uploadForm.file.size,
        mime_type: uploadForm.file.type,
        uploaded_by: user?.id,
        is_admin_uploaded: isAdminView && user?.id !== effectiveUserId,
        tags: tags.length > 0 ? tags : null,
      });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      await fetchDocuments();
      setIsDialogOpen(false);
      setUploadForm({
        document_name: "",
        document_type: "account",
        description: "",
        tags: "",
        file: null,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document: UserDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("user-documents")
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.document_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (document: UserDocument) => {
    if (
      !confirm(`Are you sure you want to delete "${document.document_name}"?`)
    ) {
      return;
    }

    try {
      await supabase.storage
        .from("user-documents")
        .remove([document.file_path]);

      const { error } = await supabase
        .from("user_documents")
        .delete()
        .eq("id", document.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      await fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const getDocumentIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="h-4 w-4" />;

    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.includes("word")) return "📝";
    return "📄";
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesType =
      selectedType === "all" || doc.document_type === selectedType;
    const matchesSearch =
      searchTerm === "" ||
      doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesType && matchesSearch;
  });

  useEffect(() => {
    if (effectiveUserId) {
      fetchDocuments();
    }
  }, [effectiveUserId]);

  if (!effectiveUserId) {
    return (
      <Alert>
        <AlertDescription>Please log in to view documents</AlertDescription>
      </Alert>
    );
  }

  // ✅ Helper for required docs
  const handleDownloadRequired = (doc: { name: string; url: string }) => {
    const a = document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* ✅ NEW SECTION - Required Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Required Documents
          </CardTitle>
          <CardDescription>
            Please download, complete, and reupload the following documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {REQUIRED_DOCUMENTS.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition"
              >
                <div>
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {doc.description}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadRequired(doc)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ✅ EXISTING DOCUMENT MANAGEMENT SECTION (unchanged) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isAdminView
                ? `Documents - ${userName || "User"}`
                : "My Documents"}
            </div>
          </CardTitle>
          <CardDescription>
            Upload and manage your personal or account-related documents.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  className="pl-8 w-[220px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Select a file and fill in the details below.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Document Name</Label>
                    <Input
                      placeholder="Enter document name"
                      value={uploadForm.document_name}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          document_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Document Type</Label>
                    <Select
                      value={uploadForm.document_type}
                      onValueChange={(value) =>
                        setUploadForm({
                          ...uploadForm,
                          document_type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Brief description (optional)"
                      value={uploadForm.description}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Tags</Label>
                    <Input
                      placeholder="Comma-separated tags (optional)"
                      value={uploadForm.tags}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          tags: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>File</Label>
                    <Input type="file" onChange={handleFileSelect} />
                    {uploadForm.file && (
                      <div className="text-sm text-muted-foreground">
                        Selected: {uploadForm.file.name} (
                        {formatFileSize(uploadForm.file.size)})
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      isUploading ||
                      !uploadForm.document_name ||
                      !uploadForm.file
                    }
                  >
                    {isUploading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No documents found.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getDocumentIcon(doc.mime_type)}
                          {doc.document_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.document_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(doc.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>
                        {doc.uploader_profile?.full_name ||
                          (doc.is_admin_uploaded ? "Admin" : "User")}
                      </TableCell>
                      <TableCell>
                        {doc.tags?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="mr-1 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
