import UnifiedListingForm from "@/components/unified-listing-form";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <UnifiedListingForm
      mode="edit"
      listingId={id}
      onBackPath="/dashboard/admin/listings"
    />
  );
}
