import Link from 'next/link';
import { getBillPath, getSponsorPath } from '@/app/utils/slugUtils';
import { ComponentProps } from 'react';

type LinkProps = Omit<ComponentProps<typeof Link>, 'href'>;

/**
 * SEO-friendly link to a bill page with auto-generated slug
 */
export function BillLink({
  stateCode,
  billId,
  billNumber,
  title,
  children,
  className,
  ...props
}: {
  stateCode: string;
  billId: string;
  billNumber: string;
  title: string;
  children: React.ReactNode;
  className?: string;
} & LinkProps) {
  const href = getBillPath(stateCode, billId, billNumber, title);
  
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}

/**
 * SEO-friendly link to a sponsor page with auto-generated slug
 */
export function SponsorLink({
  sponsorId,
  name,
  children,
  className,
  ...props
}: {
  sponsorId: string;
  name: string;
  children: React.ReactNode;
  className?: string;
} & LinkProps) {
  const href = getSponsorPath(sponsorId, name);
  
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
} 