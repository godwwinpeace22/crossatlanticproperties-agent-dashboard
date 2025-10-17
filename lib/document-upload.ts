import { createClient } from "@/lib/supabase/client";

export interface DocumentUploadOptions {
  file: File;
  userId: string;
  documentType: "kyc" | "purchase" | "account" | "legal" | "other";
  documentName: string;
  description?: string;
  tags?: string[];
  isAdminUpload?: boolean;
  uploadedBy?: string;
}

export interface UploadedDocument {
  id: string;
  file_path: string;
  public_url: string;
  document_name: string;
  document_type: string;
}

/**
 * Upload a document to the user_documents table and storage
 * This centralizes all document uploads in the system
 */
export async function uploadUserDocument(
  options: DocumentUploadOptions
): Promise<UploadedDocument> {
  const supabase = createClient();

  const {
    file,
    userId,
    documentType,
    documentName,
    description,
    tags,
    isAdminUpload = false,
    uploadedBy,
  } = options;

  try {
    // Generate unique file path
    const fileExtension = file.name.split(".").pop();
    const timestamp = Date.now();
    const sanitizedName = documentName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = `${userId}/${documentType}/${sanitizedName}_${timestamp}.${fileExtension}`;

    // Upload file to storage (user-documents bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user-documents")
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("user-documents")
      .getPublicUrl(filePath);

    // Get current user for uploadedBy if not provided
    const currentUser =
      uploadedBy || (await supabase.auth.getUser()).data.user?.id;

    // Insert record into user_documents table
    const { data: documentData, error: dbError } = await supabase
      .from("user_documents")
      .insert({
        user_id: userId,
        document_name: documentName,
        document_type: documentType,
        description: description || null,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: currentUser,
        is_admin_uploaded: isAdminUpload,
        tags: tags || null,
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, clean up the uploaded file
      await supabase.storage.from("user-documents").remove([filePath]);
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    return {
      id: documentData.id,
      file_path: filePath,
      public_url: urlData.publicUrl,
      document_name: documentName,
      document_type: documentType,
    };
  } catch (error) {
    console.error("Document upload error:", error);
    throw error;
  }
}

/**
 * Upload multiple documents at once
 */
export async function uploadMultipleDocuments(
  documents: DocumentUploadOptions[]
): Promise<UploadedDocument[]> {
  const results: UploadedDocument[] = [];

  for (const docOptions of documents) {
    try {
      const result = await uploadUserDocument(docOptions);
      results.push(result);
    } catch (error) {
      console.error(
        `Failed to upload document ${docOptions.documentName}:`,
        error
      );
      // Continue with other uploads even if one fails
      throw error; // Re-throw to let caller handle the error
    }
  }

  return results;
}

/**
 * Get documents for a user, optionally filtered by type
 */
export async function getUserDocuments(
  userId: string,
  documentType?: string
): Promise<any[]> {
  const supabase = createClient();

  let query = supabase
    .from("user_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (documentType) {
    query = query.eq("document_type", documentType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a document (removes from both storage and database)
 */
export async function deleteUserDocument(documentId: string): Promise<void> {
  const supabase = createClient();

  // First get the document to find the file path
  const { data: document, error: fetchError } = await supabase
    .from("user_documents")
    .select("file_path")
    .eq("id", documentId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch document: ${fetchError.message}`);
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("user-documents")
    .remove([document.file_path]);

  if (storageError) {
    console.warn(`Storage deletion failed: ${storageError.message}`);
    // Continue with database deletion even if storage fails
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("user_documents")
    .delete()
    .eq("id", documentId);

  if (dbError) {
    throw new Error(`Database deletion failed: ${dbError.message}`);
  }
}

/**
 * Get a signed URL for viewing a document
 */
export async function getDocumentViewUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from("user-documents")
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Helper function to validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[] = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxSizeBytes: number = 10 * 1024 * 1024 // 10MB default
): { isValid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${
        file.type
      } is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(
        2
      )}MB exceeds maximum ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { isValid: true };
}
