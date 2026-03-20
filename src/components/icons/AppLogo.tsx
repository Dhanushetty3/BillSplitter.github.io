import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" fill="currentColor" className="text-primary"/>
      <path d="M12.6364 8.54545H9.45455V9.63636H12.0909C12.6818 9.63636 13.1818 10.1364 13.1818 10.7273V11.2727C13.1818 11.8636 12.6818 12.3636 12.0909 12.3636H9.45455V13.4545H12.0909C12.6818 13.4545 13.1818 13.9545 13.1818 14.5455V15.0909C13.1818 15.6818 12.6818 16.1818 12.0909 16.1818H8.90909" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.90909 10.7273H13.1818" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
