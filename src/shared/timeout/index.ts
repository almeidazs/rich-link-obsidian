export class TimeoutError extends Error {
	constructor(milliseconds: number) {
		super(`Timed out after ${milliseconds}ms`);
		this.name = "TimeoutError";
	}
}

// Rejects with TimeoutError if `promise` hasn't settled within `milliseconds`.
// The timer is always cleared, so nothing is left pending afterwards.
export function withTimeout<T>(
	promise: Promise<T>,
	milliseconds: number,
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new TimeoutError(milliseconds)),
			milliseconds,
		);

		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}
