import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function ChatLoading() {
  return <DynamicLoadingState variant="chat" showHeader={true} />;
}
