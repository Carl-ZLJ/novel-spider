import { printProgress } from "./processUI.js"

export default async function* asyncPool(concurrency, iterable, iteratorFn) {
  const executing = new Set()
  const totalCount = iterable.length
  let executedCount = 0

  async function consume() {
    const [promise, value] = await Promise.race(executing)
    executing.delete(promise)
    return value
  }

  for (let i = 0; i < totalCount; i++) {
    const item = iterable[i]
    // Wrap iteratorFn() in an async fn to ensure we get a promise.
    // Then expose such promise, so it's possible to later reference and
    // remove it from the executing pool.
    const promise = (async () => await iteratorFn(item, iterable))().then(
      value => {
        executedCount ++
        printProgress(executedCount, totalCount)

        return [promise, value]
      }
    )

    executing.add(promise)

    if (executing.size >= concurrency) {
      yield await consume()
    }
  }

  while (executing.size) {
    yield await consume()
  }
}