import { Dumbbell, Shirt, Utensils, Package } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const NicheImage = ({ src, alt, className = "h-10 w-10 shrink-0" }) => {
  const { user } = useAuthStore();
  const niche = user?.niche?.toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={alt || "Image"}
        className={`${className} object-cover rounded border border-border shrink-0`}
      />
    );
  }

  let Icon = Package;
  if (niche === 'GYM') Icon = Dumbbell;
  else if (niche === 'GARMENTS') Icon = Shirt;
  else if (niche === 'RESTAURANT') Icon = Utensils;

  return (
    <div className={`${className} bg-slate-100 dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-lg flex items-center justify-center text-muted-foreground/35 shrink-0`}>
      <Icon className="h-5 w-5" />
    </div>
  );
};

export default NicheImage;
