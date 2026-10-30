import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function TasksLoading() {
  return <DynamicLoadingState variant="tasks" showHeader={true} />;
}
