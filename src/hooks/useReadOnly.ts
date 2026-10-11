import { useAuth } from "@/contexts/AuthContext";
/** Visitors cannot edit; authenticated clients can order, approve and send messages. */
export function useReadOnly(): boolean {
  const { user } = useAuth();
  return !user;
}
