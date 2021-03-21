import {useInstance} from './hooks';

export function useParams(): Record<string, string | undefined> {
    const instance = useInstance();

    return (instance.options || {}) as Record<string, string | undefined>;
}
