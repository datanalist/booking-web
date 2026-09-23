import type { ReactNode } from "react";

type CabinetLayoutProps = {
  children: ReactNode;
};

export function CabinetLayout({ children }: CabinetLayoutProps) {
  return <div>{children}</div>;
}
