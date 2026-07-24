import { ChevronRight } from 'lucide-react';
import type { Route } from '../types';
import { routeToHash } from '../router';

type Crumb = {
  label: string;
  route?: Route;
};

type Props = {
  items: Crumb[];
};

export default function Breadcrumbs({ items }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm text-sand-500 overflow-x-auto scrollbar-hide">
      {items.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 whitespace-nowrap">
          {crumb.route ? (
            <a href={routeToHash(crumb.route)} className="hover:text-brand-600 transition-colors">
              {crumb.label}
            </a>
          ) : (
            <span className="text-sand-800 font-medium">{crumb.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-sand-300" />}
        </span>
      ))}
    </nav>
  );
}
