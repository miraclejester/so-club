import React, { JSX } from 'react';

type MainContainerProps = {
    children: React.ReactNode;
    className?: string;
};

export default function MainContainer({ children, className = '' }: MainContainerProps): JSX.Element {
    return <div className={`mx-auto w-full max-w-3xl px-4 ${className}`}>{children}</div>;
}
