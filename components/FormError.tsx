import { JSX, ReactNode } from 'react';

type FormErrorProps = {
    children?: ReactNode;
};

export default function FormError({ children }: FormErrorProps): JSX.Element {
    return <p className="text-sm text-red-600">{children}</p>;
}
