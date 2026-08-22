import { ReactNode } from 'react';

type MainContainerProps = {
    children: ReactNode;
    className?: string;
};

export function MainContainer({ children, className = '' }: MainContainerProps) {
    return <div className={`mx-auto w-full max-w-3xl px-4 ${className}`}>{children}</div>;
}
