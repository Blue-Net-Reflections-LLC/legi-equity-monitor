import Link from 'next/link';
import { getBillPath, getSponsorPath } from '@/app/utils/slugUtils';

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
  [key: string]: any;
}) {
  const href = getBillPath(stateCode, billId, billNumber, title);
  
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}

/**
 * SEO-friendly link to a sponsor page with auto-generated slug
 * Note: Party is no longer used for slug generation, but is kept as a parameter for API compatibility
 */
export function SponsorLink({
  sponsorId,
  name,
  party,
  children,
  className,
  ...props
}: {
  sponsorId: string;
  name: string;
  party: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const href = getSponsorPath(sponsorId, name, party);
  
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
} 