import { Link } from 'react-router-dom';
import { FileSearch } from 'lucide-react';

const EmptyState = ({
  title,
  description,
  icon: Icon = FileSearch,
  actionLabel,
  actionTo,
  actionOnClick,
  className = '',
}) => {
  const actionClasses =
    'inline-flex items-center justify-center rounded-xl bg-[color:var(--theme-accent)] text-[color:var(--theme-accent-contrast)] px-5 py-2.5 text-sm font-bold shadow-[0_10px_24px_var(--theme-accent-glow)] hover:brightness-110 transition-all';

  return (
    <div className={`rounded-3xl border border-theme-border bg-theme-bg-secondary/70 p-8 text-center shadow-2xl ${className}`}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--theme-accent-border)] bg-[color:var(--theme-accent-surface)]">
        <Icon className="h-6 w-6 text-[color:var(--theme-accent)]" />
      </div>
      <h3 className="text-xl font-display font-bold text-theme-text-primary">{title}</h3>
      {description ? <p className="mt-2 text-sm text-theme-text-secondary">{description}</p> : null}
      {actionLabel ? (
        <div className="mt-6">
          {actionTo ? (
            <Link to={actionTo} className={actionClasses}>
              {actionLabel}
            </Link>
          ) : (
            <button type="button" onClick={actionOnClick} className={actionClasses}>
              {actionLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default EmptyState;
