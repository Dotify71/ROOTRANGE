import React from 'react';
import { HttpRepeater } from '../components/HttpRepeater';

export const WebRepeaterPage: React.FC = () => {
  return (
    <div className="h-full w-full">
      <HttpRepeater />
    </div>
  );
};
