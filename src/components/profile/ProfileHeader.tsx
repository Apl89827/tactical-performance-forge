import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileHeaderProps {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

const ProfileHeader = ({ firstName, lastName, avatarUrl, isAdmin }: ProfileHeaderProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary/20 h-20 w-20 rounded-full flex items-center justify-center ring-2 ring-primary/30">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <User size={36} className="text-primary" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-xl">
            {firstName || ''} {lastName || ''}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {isAdmin ? (
              <Badge className="bg-accent/20 text-accent border-accent/30">
                Administrator
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm">Member</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
