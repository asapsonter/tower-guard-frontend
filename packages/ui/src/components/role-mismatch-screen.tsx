import { ArrowRight, LogOut, ShieldAlert } from "lucide-react";

interface RoleMismatchScreenProps {
  /** Name of the signed-in person or station */
  userName?: string;
  /** The app this account belongs to, e.g. "NSCDC Field App" */
  accountAppName: string;
  accountAppUrl: string;
  /** The app the user is currently on */
  thisAppName: string;
  onSignOut: () => void;
}

/**
 * Shown when someone is signed in with an account that belongs to a different
 * Tower Guard app. Lets them sign out (to use the right account here) or go to
 * their own app — instead of being silently redirected.
 */
export function RoleMismatchScreen({ userName, accountAppName, accountAppUrl, thisAppName, onSignOut }: RoleMismatchScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background hud-bg p-4">
      <div className="glass-panel w-full max-w-md p-6 space-y-4 text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-warning/10 border border-warning/40 flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-warning" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">This account is for a different app</h1>
          <p className="text-sm text-muted-foreground mt-1">
            You are signed in{userName ? <> as <span className="text-foreground font-semibold">{userName}</span></> : null}, which is an account for the{" "}
            <span className="text-foreground font-semibold">{accountAppName}</span>, not the{" "}
            <span className="text-foreground font-semibold">{thisAppName}</span>.
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-2 text-sm font-semibold hover:opacity-90"
          >
            <LogOut className="h-4 w-4" /> Sign out and use the {thisAppName} account
          </button>
          <a
            href={accountAppUrl}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-border py-2 text-sm text-foreground hover:bg-secondary"
          >
            Go to the {accountAppName} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
