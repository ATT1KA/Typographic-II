import type { ReactNode } from 'react';

function mergeClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export interface BuilderShellProps {
  className?: string;
  mainClassName?: string;
  overlays?: ReactNode;
  children: ReactNode;
}

export default function BuilderShell({
  className,
  mainClassName,
  overlays,
  children,
}: BuilderShellProps) {
  return (
    <div className={mergeClassNames('builder-page', className)}>
      {overlays}
      <div className={mergeClassNames('builder-main', mainClassName)}>{children}</div>
    </div>
  );
}
