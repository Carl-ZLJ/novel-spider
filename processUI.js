export const printProgress = function (current, total) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)

    process.stdout.write(
        `Progress: ${current}/${total} (${((current / total) * 100).toFixed(2)}%)`
    )
}
