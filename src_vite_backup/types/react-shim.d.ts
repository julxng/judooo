declare module 'react' {
  export type ReactNode = any;
  export type ReactElement = any;
  export type PropsWithChildren<P = {}> = P & { children?: ReactNode };
  export type FC<P = {}> = (props: PropsWithChildren<P>) => ReactElement | null;
  export type ElementType = any;

  export interface HTMLAttributes<T> {
    children?: ReactNode;
    className?: string;
    style?: any;
    id?: string;
    role?: string;
    tabIndex?: number;
    title?: string;
    onClick?: any;
    onKeyDown?: any;
    onChange?: any;
    onSubmit?: any;
    onFocus?: any;
    onBlur?: any;
    onMouseEnter?: any;
    onMouseLeave?: any;
  }

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: string;
    disabled?: boolean;
  }

  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: string;
    value?: any;
    accept?: string;
    placeholder?: string;
    checked?: boolean;
  }

  export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: any;
    rows?: number;
    placeholder?: string;
  }

  export interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: any;
  }

  export interface FormEvent<T = any> {
    preventDefault(): void;
    currentTarget: T;
    target: T;
  }

  export interface ChangeEvent<T = any> {
    preventDefault(): void;
    stopPropagation(): void;
    currentTarget: T & { value: string; files?: FileList | null };
    target: T & { value: string; files?: FileList | null };
  }

  export interface KeyboardEvent<T = any> {
    key: string;
    preventDefault(): void;
    stopPropagation(): void;
    currentTarget: T;
  }

  export interface MouseEvent<T = any> {
    preventDefault(): void;
    stopPropagation(): void;
    currentTarget: T;
    target: T;
  }

  export interface CSSProperties {
    [key: string]: string | number | undefined;
  }

  export interface Context<T> {
    Provider: any;
    Consumer: any;
    _value?: T;
  }

  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useState<T>(
    initialState: T | (() => T),
  ): [T, (value: T | ((previous: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function lazy(factory: () => Promise<{ default: any }>): any;
  export function startTransition(scope: () => void): void;
  export function useDeferredValue<T>(value: T): T;
  export function forwardRef<T, P = {}>(render: (props: P, ref: any) => any): any;
  export const Suspense: any;
  export const StrictMode: any;
}

declare module 'react-dom/client' {
  export function createRoot(container: any): { render(node: any): void };
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes {
    key?: any;
  }
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
