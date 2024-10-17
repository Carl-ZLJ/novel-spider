import fs from 'node:fs'
import puppeteer from 'puppeteer'
import asyncPool from './pool.js'

const log = function () {
    console.log.apply(console, arguments)
}

function charpterFromLink(browser) {
    return async function (link) {
        const { url, charpterIndex } = link
        const page = await browser.newPage()
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
        })
        await page.waitForSelector('#content')
        const title = await page.$eval(
            '#content h1',
            (title) => title.innerText
        )
        const content = await page.$eval('#content', (content) => {
            const nodes = Array.from(content.childNodes)
            return nodes.map((n) => (n.nodeType == 3 ? n.textContent : ''))
        })
        page.close()

        const charpter = charpterText(title, content)

        return {
            charpter,
            charpterIndex,
        }
    }
}

function charpterText(title, content) {
    content = content.map((line) => line.trimStart())

    return `${title.split(' ')[1]}\n${content.slice(10).join('\n')}\n`
}

async function linksFromUrl(browser, url) {
    const page = await browser.newPage()

    await page.goto(url, {
        waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('div.centent')
    const links = await page.$$eval(
        'div.centent ul li a',
        (ls, baseUrl) => {
            return ls.map((l, index) => ({
                url: baseUrl + l.getAttribute('href'),
                charpterIndex: index,
            }))
        },
        url
    )

    page.close()
    return links
}

async function download(url, concurrency = 20) {
    const browser = await puppeteer.launch()

    const links = await linksFromUrl(browser, url)

    const charpters = []

    log('Downloading html content ...')
    for await (const value of asyncPool(
        concurrency,
        links,
        charpterFromLink(browser)
    )) {
        const { charpter, charpterIndex } = value
        charpters[charpterIndex] = charpter
    }

    await browser.close()

    log('\nFinished downloading...')

    log('Writing...')
    try {
        fs.writeFileSync('轮回乐园.txt', charpters.join('\n'))
    } catch (error) {
        throw new Error(`Failed to write!!!`)
    }
    log('Finished writing...')
}

download('https://www.piaotia.com/html/9/9292/')
