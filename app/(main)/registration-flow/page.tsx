import { Suspense } from "react";
import { RegistrationFlow } from "@/components/registration-flow";

function RegistrationFlowContent() {
  return <RegistrationFlow />;
}

export default function RegistrationFlowPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationFlowContent />
    </Suspense>
  );
}
