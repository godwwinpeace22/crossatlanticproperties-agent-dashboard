import { createClient } from "@/lib/supabase/client";

export interface KYCDocuments {
  governmentId?: any;
  proofOfAddress?: any;
  applicationFeeProof?: any;
  businessDocuments: any[];
}

/**
 * Get all documents for a KYC submission
 * Handles both new document ID system and legacy URL system
 */
export async function getKYCDocuments(
  kycSubmission: any
): Promise<KYCDocuments> {
  const supabase = createClient();
  const documents: KYCDocuments = {
    businessDocuments: [],
  };

  try {
    // Get government ID document
    if (kycSubmission.government_id_document_id) {
      const { data: govDoc } = await supabase
        .from("user_documents")
        .select("*")
        .eq("id", kycSubmission.government_id_document_id)
        .single();

      if (govDoc) {
        documents.governmentId = govDoc;
      }
    }

    // Get proof of address document
    if (kycSubmission.proof_of_address_document_id) {
      const { data: addressDoc } = await supabase
        .from("user_documents")
        .select("*")
        .eq("id", kycSubmission.proof_of_address_document_id)
        .single();

      if (addressDoc) {
        documents.proofOfAddress = addressDoc;
      }
    }

    // Get application fee payment proof
    if (kycSubmission.application_fee_payment_document_id) {
      const { data: feeDoc } = await supabase
        .from("user_documents")
        .select("*")
        .eq("id", kycSubmission.application_fee_payment_document_id)
        .single();

      if (feeDoc) {
        documents.applicationFeeProof = feeDoc;
      }
    }

    // Get business documents
    if (
      kycSubmission.business_document_ids &&
      kycSubmission.business_document_ids.length > 0
    ) {
      const { data: businessDocs } = await supabase
        .from("user_documents")
        .select("*")
        .in("id", kycSubmission.business_document_ids);

      if (businessDocs) {
        documents.businessDocuments = businessDocs;
      }
    }
  } catch (error) {
    console.error("Error fetching KYC documents:", error);
  }

  return documents;
}

/**
 * Get document view URL (signed URL for security)
 */
export async function getDocumentViewUrl(
  document: any
): Promise<string | null> {
  if (!document?.file_path) return null;

  const supabase = createClient();

  try {
    const { data, error } = await supabase.storage
      .from("user-documents")
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error getting document URL:", error);
    return null;
  }
}

/**
 * Get legacy document URL for backwards compatibility
 */
export function getLegacyDocumentUrl(url: string | null): string | null {
  if (!url) return null;

  // If it's already a full URL, return as is
  if (url.startsWith("http")) {
    return url;
  }

  // If it's a storage path, get signed URL
  const supabase = createClient();
  try {
    const { data } = supabase.storage.from("documents").getPublicUrl(url);
    return data.publicUrl;
  } catch (error) {
    console.error("Error getting legacy document URL:", error);
    return null;
  }
}
