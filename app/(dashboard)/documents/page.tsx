import { ProcessedDocumentsViewer } from "@/components/documents/processed-documents-viewer";
import { MsaBuckets } from "@/components/documents/msa-buckets";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <MsaBuckets />
      <ProcessedDocumentsViewer />
    </div>
  );
}
