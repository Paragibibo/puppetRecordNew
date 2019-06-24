
const puppeteer = require('puppeteer');
const sleep = require('sleep');
(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  await page.goto('https://www.goibibo.com/hotels/')
  await sleep.sleep(5);
  
  await page.setViewport({ width: 1301, height: 623 })
  
  await page.waitForSelector('#content #Home')
  await page.click('#content #Home')
  await page.waitForSelector('.blueBg #gosuggest_inputL')
  await page.click('.blueBg #gosuggest_inputL')
  console.log('reached');
  await page.waitForSelector('#react-autosuggest-1 > #react-autosuggest-1-suggestion--3 > div > .dib > .mainTxt')
  await page.click('#react-autosuggest-1 > #react-autosuggest-1-suggestion--3 > div > .dib > .mainTxt')
  console.log('reached1');
  await page.waitForSelector('.shCalenderBox > .col-md-6:nth-child(1) > div > .col-md-12 > .form-control')
  await page.click('.shCalenderBox > .col-md-6:nth-child(1) > div > .col-md-12 > .form-control')

  await page.waitForSelector('.DayPicker > .DayPicker-Month > .DayPicker-Body > .DayPicker-Week:nth-child(4) > .DayPicker-Day:nth-child(5)')
  await page.click('.DayPicker > .DayPicker-Month > .DayPicker-Body > .DayPicker-Week:nth-child(4) > .DayPicker-Day:nth-child(5)')
  
  await page.waitForSelector('.DayPicker > .DayPicker-Month > .DayPicker-Body > .DayPicker-Week:nth-child(5) > .DayPicker-Day:nth-child(6)')
  await page.click('.DayPicker > .DayPicker-Month > .DayPicker-Body > .DayPicker-Week:nth-child(5) > .DayPicker-Day:nth-child(6)')
  
  await page.waitForSelector('.col-md-12 > .width100 > div > .col-md-3 > .width100')
  await page.click('.col-md-12 > .width100 > div > .col-md-3 > .width100')
  await page.screenshot({path: 'budds.png'});
  await browser.close()
})()