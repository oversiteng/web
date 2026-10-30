import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function NotificationsLoading() {
  return <DynamicLoadingState variant="notifications" showHeader={true} />;
}
