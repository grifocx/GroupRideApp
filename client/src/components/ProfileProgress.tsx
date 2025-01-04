import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import type { User } from "@db/schema";

interface ProfileProgressProps {
  user: User | null;
}

// Fields that contribute to profile completion
const profileFields = [
  'avatarUrl',
  'email',
  'display_name',
  'zip_code',
  'club',
  'home_bike_shop',
  'gender',
  'birthdate'
] as const;

export function ProfileProgress({ user }: ProfileProgressProps) {
  if (!user) return null;

  // Calculate completion percentage
  const completedFields = profileFields.filter(field => Boolean(user[field]));
  const completionPercentage = Math.round((completedFields.length / profileFields.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Profile Completion</h3>
        <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
      </div>
      <Progress value={completionPercentage} className="h-2" />
      {completionPercentage < 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground"
        >
          Complete your profile to get the most out of RideGroops:
          <ul className="mt-2 space-y-1">
            {profileFields.map(field => !user[field] && (
              <li key={field} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/20" />
                {field.split(/(?=[A-Z])/).join(' ').toLowerCase()}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}