import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function VaultLoading() {
  return <DynamicLoadingState variant="vault" showHeader={true} />;
}
