import React, {type ReactNode} from 'react';
import type {Props} from '@theme/Admonition/Icon/Danger';

export default function AdmonitionIconDanger(props: Props): ReactNode {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_72_1261)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M1.33398 8C1.33398 4.3181 4.31875 1.33334 8.00065 1.33334C11.6826 1.33334 14.6673 4.3181 14.6673 8C14.6673 11.6819 11.6826 14.6667 8.00065 14.6667C4.31875 14.6667 1.33398 11.6819 1.33398 8ZM5.41011 6.35236L7.06002 8.00227L5.41011 9.65219L6.35291 10.595L8.00283 8.94508L9.65275 10.595L10.5956 9.65219L8.94564 8.00227L10.5956 6.35236L9.65275 5.40955L8.00283 7.05946L6.35291 5.40955L5.41011 6.35236Z"
          fill="#F53F3F"
        />
      </g>
      <defs>
        <clipPath id="clip0_72_1261">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
