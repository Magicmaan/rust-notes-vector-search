interface CacheEntry<T> {
	getData<T>(): Promise<T>;
	storeKey: string;
	storeData<T>(data: T): Promise<void>;
}
