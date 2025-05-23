import React, {type ReactNode} from 'react';
import type {Props} from '@theme/Admonition/Icon/Warning';

export default function AdmonitionIconCaution(props: Props): ReactNode {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_171_525)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M1.33398 8C1.33398 4.3181 4.31875 1.33333 8.00065 1.33333C11.6826 1.33333 14.6673 4.3181 14.6673 8C14.6673 11.6819 11.6826 14.6667 8.00065 14.6667C4.31875 14.6667 1.33398 11.6819 1.33398 8ZM7.33398 10V11.3333H8.66732V10H7.33398ZM8.66732 9.33333L8.66732 4.66666H7.33399L7.33398 9.33333H8.66732Z"
          fill="#FF7D00"
        />
      </g>
      <defs>
        <clipPath id="clip0_171_525">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
