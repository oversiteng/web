import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function UserAppLoading() {
  return <DynamicLoadingState variant="generic" showHeader={true} />;
}
