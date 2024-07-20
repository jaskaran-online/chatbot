import React from 'react';
import { components } from 'react-select';
import Image from 'next/image';

export const CustomOption = ({ children, ...props }: React.PropsWithChildren<any>) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center">
        <Image src={data.flag} alt={`${data.country} flag`} className="w-6 h-4 mr-2" width="30" height="30"/>
        <span>{data.country}</span>
        <span className="ml-auto text-gray-500">{data.code}</span>
      </div>
    </components.Option>
  );
};

export const CustomSingleValue = ({ children, ...props }: React.PropsWithChildren<any>) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center">
        <Image src={data.flag} alt={`${data.country} flag`} className="w-6 h-4 mr-2"  width="30" height="30"/>
        <span>{data.country}</span>
        <span className="ml-2 text-gray-500">{data.code}</span>
      </div>
    </components.SingleValue>
  );
};
