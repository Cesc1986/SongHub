import { underscore } from '../utils/string'
import { validateType, getTabsList } from '../core/tab'
import type {
  ApiRequestSearch,
  ApiArgsSearch,
  ApiResponseSearch,
  Tab,
  TabScrapped,
  PuppeteerOptions,
} from '../../types/tabs'
import { Page, Browser } from 'rebrowser-puppeteer-core'
import { connect } from 'puppeteer-real-browser'
import {
  PUPPETEER_BLOCK_RESSOURCE_NAME,
  PUPPETEER_BLOCK_RESSOURCE_TYPE,
} from '../../constants'

export async function search(args: ApiArgsSearch): Promise<ApiResponseSearch> {
  args = formatSearchQuery(args)
  const url = 'http://www.ultimate-guitar.com/search.php?' + encodeParams(args)
  console.log(url)
  const tabs = await getTabsList(url, args)
  return tabs
}

export function formatRequestSearch(uri: string): ApiRequestSearch {
  uri = decodeURIComponent(uri)

  let output: ApiRequestSearch = {
    url: uri,
    type: '',
    args: {
      q: '',
      type: 'Tab',
      page: 1,
      value: '',
      search_type: 'title',
      order: '',
    },
  }

  output.type = /^\/(.*)\?/.exec(uri)![1]
  let raw = uri
    .slice(uri.indexOf(output.type) + output.type.length + 1, uri.length)
    .split('&')

  for (let i in raw) {
    let keyVal = raw[i].split('=')
    if (keyVal.length == 2) {
      output.args[keyVal[0]] = keyVal[1]
    }
  }
  return output
}

export function encodeParam(key: string, value: any[]): string {
  if (Array.isArray(value)) {
    return value.map((item) => encodeParam(`${key}[]`, item)).join('&')
  } else {
    return key + '=' + encodeURIComponent(value)
  }
}

export function encodeParams(params: Record<string, any>): string {
  // encode everything
  return Object.keys(params)
    .map((key: string) => {
      return encodeParam(key, params[key])
    })
    .join('&')
    .replace(/%20/g, '+')
}

export function formatSearchQuery(args: ApiArgsSearch): ApiArgsSearch {
  let acceptedParams = ['q', 'type', 'page', 'source']
  let requiredParams = ['q']
  let params: ApiArgsSearch = {
    type: '',
    page: 1,
    value: '',
    // to not evoke suspicion, we try to make the same request as in the ultimate guitar web application
    search_type: 'title',
    order: '',
    q: '',
    source: 'artist_name,song_name',
  }

  // accepted params only
  for (let param in args) {
    let underscored = underscore(param)
    if (acceptedParams.indexOf(underscored) !== -1) {
      params[underscored] = args[param]
    } else {
      delete args[param]
    }
  }
  // required params
  for (let i = 0; i < requiredParams.length; i++) {
    if (Object.keys(params).indexOf(requiredParams[i]) === -1) {
      throw new Error("Query requires param '" + requiredParams[i] + "'.")
    }
  }

  // param 'type' can be a string or an array of string
  if (params.type) {
    if (Array.isArray(params.type)) {
      for (let i = 0; i < params.type.length; i++) {
        params.type[i] = validateType(params.type[i])
      }
    } else {
      params.type = validateType(params.type)
    }
  }
  // Rename `q` to `value`
  params.value = params.q

  return params
}

//Using puppeteer@6.0 and chrome-aws-lambda@6.0 to not exceed the AWS 50mb limit for the serverless functions

// Singleton browser instance — started once, reused for all requests
let sharedBrowser: any = null
let browserInitPromise: Promise<any> | null = null

const PUPPETEER_PAGE_CONCURRENCY = Number(
  process.env.SONGHUB_PUPPETEER_PAGE_CONCURRENCY || 4,
)
let activePageCount = 0
const pageWaiters: Array<() => void> = []

async function acquirePageSlot(): Promise<() => void> {
  if (activePageCount >= PUPPETEER_PAGE_CONCURRENCY) {
    await new Promise<void>((resolve) => pageWaiters.push(resolve))
  }

  activePageCount += 1
  let released = false

  return () => {
    if (released) return
    released = true
    activePageCount = Math.max(0, activePageCount - 1)
    const next = pageWaiters.shift()
    if (next) next()
  }
}

export function getPuppeteerStats() {
  return {
    pageConcurrency: PUPPETEER_PAGE_CONCURRENCY,
    activePages: activePageCount,
    queuedPageRequests: pageWaiters.length,
    browserReady: Boolean(sharedBrowser),
    browserStarting: Boolean(browserInitPromise),
  }
}

async function getSharedBrowser(): Promise<any> {
  // If browser exists and is connected, return it
  if (sharedBrowser) {
    try {
      await sharedBrowser.pages() // test if still alive
      return sharedBrowser
    } catch {
      sharedBrowser = null
    }
  }

  // If browser startup is already running, await the same promise
  if (browserInitPromise) {
    return browserInitPromise
  }

  browserInitPromise = (async () => {
    const chromiumPath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      (process.platform === 'linux' ? '/usr/bin/chromium' : undefined)

    const { browser } = await connect({
      headless: false,
      customConfig: chromiumPath ? { chromePath: chromiumPath } : {},
      args: [
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-hang-monitor',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--disable-setuid-sandbox',
        '--disable-sync',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
      ],
      turnstile: true,
    })

    sharedBrowser = browser
    return browser
  })()

  try {
    return await browserInitPromise
  } finally {
    browserInitPromise = null
  }
}

export async function getPuppeteerConf(
  options: PuppeteerOptions = {},
): Promise<{ page: Page; browser: any }> {
  const browser = await getSharedBrowser()
  const releasePageSlot = await acquirePageSlot()

  let page: Page
  try {
    page = await browser.newPage()
  } catch (error) {
    releasePageSlot()
    throw error
  }

  const originalClose = page.close.bind(page)
  ;(page as any).close = async (...args: any[]) => {
    try {
      return await originalClose(...args)
    } finally {
      releasePageSlot()
    }
  }

  await page.setViewport(
    options.widthBrowser && options.heightBrowser
      ? {
          width: parseInt(options.widthBrowser) - 50,
          height: parseInt(options.heightBrowser),
        }
      : { width: 1280, height: 800 },
  )
  // Block every ressources that we don't need to load
  page.setDefaultNavigationTimeout(10000)
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const requestUrl = request.url().split('?')[0]
    if (
      PUPPETEER_BLOCK_RESSOURCE_TYPE.includes(request.resourceType()) ||
      PUPPETEER_BLOCK_RESSOURCE_NAME.some((resource) =>
        requestUrl.includes(resource),
      )
    ) {
      request.abort()
    } else {
      request.continue()
    }
  })

  return { page, browser }
}
